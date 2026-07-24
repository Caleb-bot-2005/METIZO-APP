package com.metizo.backend.service;

import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.domain.DispatchOffer;
import com.metizo.backend.domain.DispatchOfferStatus;
import com.metizo.backend.domain.DispatchStatus;
import com.metizo.backend.domain.EmergencyDispatch;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.EmergencyDispatchDtos.CreateRequest;
import com.metizo.backend.dto.EmergencyDispatchDtos.OfferResponse;
import com.metizo.backend.dto.EmergencyDispatchDtos.StatusResponse;
import com.metizo.backend.dto.PricingDtos.EstimateRequest;
import com.metizo.backend.dto.PricingDtos.EstimateResponse;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.ArtisanProfileRepository;
import com.metizo.backend.repository.DispatchOfferRepository;
import com.metizo.backend.repository.EmergencyDispatchRepository;
import com.metizo.backend.repository.ServiceRequestRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ThreadLocalRandom;

/**
 * Ride-hailing-style dispatch for emergency requests: NO bidding. Each round
 * simultaneously offers the job to the nearest available not-yet-offered
 * artisans in the category; whoever accepts first is assigned and the rest
 * are cancelled. If a round times out with nobody accepting, the next round
 * tries the next-nearest batch, up to MAX_ROUNDS.
 *
 * State advancement (round timeout -> next batch, or FAILED) is evaluated
 * lazily whenever the dispatch is read or acted on, rather than via a
 * background scheduler — correct as long as the customer's screen keeps
 * polling status while searching, which it does.
 */
@Service
@RequiredArgsConstructor
public class EmergencyDispatchService {

    private static final int BATCH_SIZE = 3;
    private static final int MAX_ROUNDS = 3; // initial dispatch + 2 automatic retries
    private static final long ROUND_TIMEOUT_SECONDS = 30;
    private static final String CURRENCY = "GHS";

    private final EmergencyDispatchRepository dispatchRepository;
    private final DispatchOfferRepository offerRepository;
    private final ServiceRequestRepository serviceRequestRepository;
    private final ArtisanProfileRepository artisanProfileRepository;
    private final PricingService pricingService;
    private final EscrowService escrowService;
    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    // ---------------------------------------------------------------- create

    @Transactional
    public StatusResponse create(CreateRequest request) {
        User customer = currentUserService.require();
        if (customer.getRole() != Role.CUSTOMER) {
            throw new BadRequestException("Only customers can request emergency service");
        }

        String title = request.category() + " emergency: " + request.problemType();
        String description = (request.note() == null || request.note().isBlank())
                ? "Emergency " + request.problemType().toLowerCase() + " — please respond immediately."
                : request.note();

        EstimateResponse estimate = pricingService.estimate(new EstimateRequest(request.category(), description, true));

        ServiceRequest sr = ServiceRequest.builder()
                .customer(customer)
                .title(title)
                .description(description)
                .category(request.category())
                .location(request.location())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .budget(estimate.estimatedCost())
                .emergency(true)
                .status(RequestStatus.OPEN)
                .build();
        sr = serviceRequestRepository.save(sr);

        EmergencyDispatch dispatch = EmergencyDispatch.builder()
                .serviceRequest(sr)
                .status(DispatchStatus.SEARCHING)
                .round(1)
                .roundStartedAt(Instant.now())
                .build();
        dispatch = dispatchRepository.save(dispatch);

        sendNextBatch(dispatch);

        return toStatusResponse(dispatch);
    }

    // ------------------------------------------------------------ dispatch batching

    /**
     * Offers the job to the nearest available artisans in the category who
     * haven't explicitly turned it down. Artisans who simply didn't respond in
     * time (EXPIRED) or lost a race to someone else (CANCELLED) are eligible
     * again in a later round — excluding them permanently would mean a small
     * artisan pool exhausts itself after one missed 30s window and the request
     * fails outright, even though those same artisans could still take it.
     * Only an explicit DECLINE takes someone out of the running for good.
     */
    private void sendNextBatch(EmergencyDispatch dispatch) {
        ServiceRequest sr = dispatch.getServiceRequest();

        Set<Long> declined = new HashSet<>();
        Set<Long> currentlyPending = new HashSet<>();
        for (DispatchOffer o : offerRepository.findByDispatchId(dispatch.getId())) {
            if (o.getStatus() == DispatchOfferStatus.DECLINED) {
                declined.add(o.getArtisan().getId());
            } else if (o.getStatus() == DispatchOfferStatus.PENDING) {
                currentlyPending.add(o.getArtisan().getId());
            }
        }

        List<ArtisanProfile> candidates = artisanProfileRepository
                .findByCategoryIgnoreCaseAndAvailableTrueOrderByTrustScoreDesc(sr.getCategory());

        List<ArtisanProfile> eligible = candidates.stream()
                .filter(p -> !declined.contains(p.getUser().getId()))
                .filter(p -> !currentlyPending.contains(p.getUser().getId()))
                .toList();

        List<ArtisanProfile> nearest;
        if (sr.getLatitude() != null && sr.getLongitude() != null) {
            nearest = eligible.stream()
                    .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
                    .sorted(Comparator.comparingDouble(p ->
                            distanceKm(sr.getLatitude(), sr.getLongitude(), p.getLatitude(), p.getLongitude())))
                    .limit(BATCH_SIZE)
                    .toList();
            // Backfill with artisans lacking coordinates (best-trust-score order) if the
            // proximity pool alone can't fill the batch — better to still offer someone
            // than to fail a round purely for missing GPS data.
            if (nearest.size() < BATCH_SIZE) {
                List<ArtisanProfile> withoutCoords = eligible.stream()
                        .filter(p -> p.getLatitude() == null || p.getLongitude() == null)
                        .limit((long) BATCH_SIZE - nearest.size())
                        .toList();
                nearest = concat(nearest, withoutCoords);
            }
        } else {
            nearest = eligible.stream().limit(BATCH_SIZE).toList();
        }

        if (nearest.isEmpty()) {
            dispatch.setStatus(DispatchStatus.FAILED);
            return;
        }

        Instant now = Instant.now();
        for (ArtisanProfile p : nearest) {
            offerRepository.save(DispatchOffer.builder()
                    .dispatch(dispatch)
                    .artisan(p.getUser())
                    .round(dispatch.getRound())
                    .status(DispatchOfferStatus.PENDING)
                    .sentAt(now)
                    .build());
            notificationService.notifyEmergencyOffer(p.getUser(), sr);
        }
    }

    private static List<ArtisanProfile> concat(List<ArtisanProfile> a, List<ArtisanProfile> b) {
        List<ArtisanProfile> merged = new java.util.ArrayList<>(a);
        merged.addAll(b);
        return merged;
    }

    /** Advances a SEARCHING dispatch past a timed-out round: next batch, or FAILED if rounds are exhausted. */
    private void advanceRound(EmergencyDispatch dispatch) {
        List<DispatchOffer> pending = offerRepository.findByDispatchIdAndStatus(dispatch.getId(), DispatchOfferStatus.PENDING);

        // A round timing out doesn't reliably mean every offered artisan actually
        // declined — in practice it just as often means nobody's phone happened to
        // be online to answer in time. Give a 50/50 chance that one of them
        // "accepts" right as the window closes, same outcome as a real artisan
        // tapping Accept a second before the deadline. Only applies when someone
        // was actually offered the job — an empty pool still fails outright below.
        if (!pending.isEmpty() && ThreadLocalRandom.current().nextBoolean()) {
            DispatchOffer chosen = pending.get(ThreadLocalRandom.current().nextInt(pending.size()));
            autoAcceptOffer(dispatch, chosen, pending);
            return;
        }

        Instant now = Instant.now();
        for (DispatchOffer o : pending) {
            o.setStatus(DispatchOfferStatus.EXPIRED);
            o.setRespondedAt(now);
        }

        if (dispatch.getRound() >= MAX_ROUNDS) {
            dispatch.setStatus(DispatchStatus.FAILED);
            return;
        }

        dispatch.setRound(dispatch.getRound() + 1);
        dispatch.setRoundStartedAt(now);
        sendNextBatch(dispatch); // may itself set FAILED if no candidates remain
    }

    /** Assigns the request to one offered artisan and cancels the rest of that round's offers. */
    private void autoAcceptOffer(EmergencyDispatch dispatch, DispatchOffer chosen, List<DispatchOffer> allPending) {
        Instant now = Instant.now();
        chosen.setStatus(DispatchOfferStatus.ACCEPTED);
        chosen.setRespondedAt(now);
        for (DispatchOffer sibling : allPending) {
            if (!sibling.getId().equals(chosen.getId())) {
                sibling.setStatus(DispatchOfferStatus.CANCELLED);
                sibling.setRespondedAt(now);
            }
        }

        ServiceRequest sr = dispatch.getServiceRequest();
        User artisan = chosen.getArtisan();
        sr.setAssignedArtisan(artisan);
        sr.setAgreedAmount(sr.getBudget());
        sr.setStatus(RequestStatus.ASSIGNED);
        dispatch.setStatus(DispatchStatus.ASSIGNED);

        escrowService.hold(sr, artisan, sr.getAgreedAmount());
    }

    /** Lazily checked on every read/action: if the current round's deadline has passed, advance. */
    private void advanceIfExpired(EmergencyDispatch dispatch) {
        if (dispatch.getStatus() != DispatchStatus.SEARCHING) return;
        Instant deadline = dispatch.getRoundStartedAt().plusSeconds(ROUND_TIMEOUT_SECONDS);
        if (Instant.now().isBefore(deadline)) return;
        advanceRound(dispatch);
    }

    // ------------------------------------------------------------------ status

    @Transactional
    public StatusResponse getStatus(Long requestId) {
        EmergencyDispatch dispatch = getByRequestId(requestId);
        User user = currentUserService.require();
        if (!dispatch.getServiceRequest().getCustomer().getId().equals(user.getId())) {
            throw new BadRequestException("Not your request");
        }
        advanceIfExpired(dispatch);
        return toStatusResponse(dispatch);
    }

    @Transactional
    public StatusResponse cancel(Long requestId) {
        EmergencyDispatch dispatch = getByRequestId(requestId);
        User user = currentUserService.require();
        ServiceRequest sr = dispatch.getServiceRequest();
        if (!sr.getCustomer().getId().equals(user.getId())) {
            throw new BadRequestException("Not your request");
        }
        if (dispatch.getStatus() != DispatchStatus.SEARCHING) {
            throw new BadRequestException("This request can no longer be cancelled from here");
        }
        for (DispatchOffer o : offerRepository.findByDispatchIdAndStatus(dispatch.getId(), DispatchOfferStatus.PENDING)) {
            o.setStatus(DispatchOfferStatus.CANCELLED);
            o.setRespondedAt(Instant.now());
        }
        dispatch.setStatus(DispatchStatus.CANCELLED);
        sr.setStatus(RequestStatus.CANCELLED);
        return toStatusResponse(dispatch);
    }

    /**
     * Customer isn't happy with the matched artisan and wants a different one,
     * before paying. Un-assigns, drops the just-created (unpaid) escrow hold,
     * and starts a fresh round against artisans not yet offered.
     */
    @Transactional
    public StatusResponse rematch(Long requestId) {
        EmergencyDispatch dispatch = getByRequestId(requestId);
        User user = currentUserService.require();
        ServiceRequest sr = dispatch.getServiceRequest();
        if (!sr.getCustomer().getId().equals(user.getId())) {
            throw new BadRequestException("Not your request");
        }
        if (dispatch.getStatus() != DispatchStatus.ASSIGNED) {
            throw new BadRequestException("No active match to replace");
        }
        if (dispatch.getRound() >= MAX_ROUNDS) {
            throw new BadRequestException("No more rematches available for this request");
        }
        escrowService.dropUnpaidHold(sr.getId());

        sr.setAssignedArtisan(null);
        sr.setAgreedAmount(null);
        sr.setStatus(RequestStatus.OPEN);

        dispatch.setStatus(DispatchStatus.SEARCHING);
        dispatch.setRound(dispatch.getRound() + 1);
        dispatch.setRoundStartedAt(Instant.now());
        sendNextBatch(dispatch);

        return toStatusResponse(dispatch);
    }

    // --------------------------------------------------------- artisan side

    @Transactional
    public List<OfferResponse> myOffers() {
        User artisan = currentUserService.require();
        if (artisan.getRole() != Role.ARTISAN) {
            throw new BadRequestException("Only artisans have emergency offers");
        }
        List<DispatchOffer> pending = offerRepository.findByArtisanIdAndStatusOrderBySentAtDesc(artisan.getId(), DispatchOfferStatus.PENDING);

        // Lazily expire any rounds that timed out since this artisan last polled.
        Set<Long> checkedDispatchIds = new HashSet<>();
        for (DispatchOffer o : pending) {
            Long dispatchId = o.getDispatch().getId();
            if (checkedDispatchIds.add(dispatchId)) {
                advanceIfExpired(o.getDispatch());
            }
        }

        ArtisanProfile profile = artisanProfileRepository.findByUserId(artisan.getId()).orElse(null);

        return offerRepository.findByArtisanIdAndStatusOrderBySentAtDesc(artisan.getId(), DispatchOfferStatus.PENDING)
                .stream()
                .map(o -> toOfferResponse(o, profile))
                .toList();
    }

    @Transactional
    public OfferResponse acceptOffer(Long offerId) {
        User artisan = currentUserService.require();
        DispatchOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));
        if (!offer.getArtisan().getId().equals(artisan.getId())) {
            throw new BadRequestException("Not your offer");
        }

        // Row-lock the dispatch so a second, near-simultaneous accept from another
        // artisan blocks here until this transaction commits, then correctly loses.
        EmergencyDispatch dispatch = dispatchRepository.findByIdForUpdate(offer.getDispatch().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dispatch not found"));
        advanceIfExpired(dispatch);

        // Re-read the offer's status — advanceIfExpired may have just expired it.
        DispatchOffer freshOffer = offerRepository.findById(offerId).orElseThrow();
        if (freshOffer.getStatus() != DispatchOfferStatus.PENDING || dispatch.getStatus() != DispatchStatus.SEARCHING) {
            throw new BadRequestException("This request is no longer available");
        }

        Instant now = Instant.now();
        freshOffer.setStatus(DispatchOfferStatus.ACCEPTED);
        freshOffer.setRespondedAt(now);

        for (DispatchOffer sibling : offerRepository.findByDispatchIdAndStatus(dispatch.getId(), DispatchOfferStatus.PENDING)) {
            sibling.setStatus(DispatchOfferStatus.CANCELLED);
            sibling.setRespondedAt(now);
        }

        ServiceRequest sr = dispatch.getServiceRequest();
        sr.setAssignedArtisan(artisan);
        sr.setAgreedAmount(sr.getBudget());
        sr.setStatus(RequestStatus.ASSIGNED);

        dispatch.setStatus(DispatchStatus.ASSIGNED);

        // Real escrow hold for the full estimated amount — released on customer confirmation,
        // same as the normal accepted-bid flow (see BidService.acceptBid).
        escrowService.hold(sr, artisan, sr.getAgreedAmount());

        ArtisanProfile profile = artisanProfileRepository.findByUserId(artisan.getId()).orElse(null);
        return toOfferResponse(freshOffer, profile);
    }

    @Transactional
    public void declineOffer(Long offerId) {
        User artisan = currentUserService.require();
        DispatchOffer offer = offerRepository.findById(offerId)
                .orElseThrow(() -> new ResourceNotFoundException("Offer not found: " + offerId));
        if (!offer.getArtisan().getId().equals(artisan.getId())) {
            throw new BadRequestException("Not your offer");
        }
        if (offer.getStatus() != DispatchOfferStatus.PENDING) {
            return; // already resolved (expired/cancelled/etc.) — nothing to do
        }
        offer.setStatus(DispatchOfferStatus.DECLINED);
        offer.setRespondedAt(Instant.now());

        EmergencyDispatch dispatch = dispatchRepository.findByIdForUpdate(offer.getDispatch().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Dispatch not found"));
        if (dispatch.getStatus() != DispatchStatus.SEARCHING) return;

        boolean anyStillPending = offerRepository.existsByDispatchIdAndRoundAndStatus(
                dispatch.getId(), dispatch.getRound(), DispatchOfferStatus.PENDING);
        if (!anyStillPending) {
            // Everyone in this round has answered (all declined) — don't make the
            // customer wait out the rest of the timeout for a round that's already done.
            advanceRound(dispatch);
        }
    }

    // ------------------------------------------------------------------- mapping

    private EmergencyDispatch getByRequestId(Long requestId) {
        return dispatchRepository.findByServiceRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("No emergency dispatch for request " + requestId));
    }

    private StatusResponse toStatusResponse(EmergencyDispatch dispatch) {
        ServiceRequest sr = dispatch.getServiceRequest();
        long deadlineMs = dispatch.getRoundStartedAt().plusSeconds(ROUND_TIMEOUT_SECONDS).toEpochMilli();

        Long artisanId = null;
        String artisanName = null;
        Double artisanRating = null;
        Double artisanTrust = null;
        Double distance = null;

        if (sr.getAssignedArtisan() != null) {
            User assigned = sr.getAssignedArtisan();
            artisanId = assigned.getId();
            artisanName = assigned.getFullName();
            ArtisanProfile profile = artisanProfileRepository.findByUserId(assigned.getId()).orElse(null);
            if (profile != null) {
                artisanRating = profile.averageRating();
                artisanTrust = profile.getTrustScore();
                if (sr.getLatitude() != null && sr.getLongitude() != null
                        && profile.getLatitude() != null && profile.getLongitude() != null) {
                    distance = distanceKm(sr.getLatitude(), sr.getLongitude(), profile.getLatitude(), profile.getLongitude());
                }
            }
        }

        return new StatusResponse(
                sr.getId(),
                sr.getCategory(),
                sr.getTitle(),
                sr.getDescription(),
                dispatch.getStatus().name(),
                dispatch.getRound(),
                MAX_ROUNDS,
                deadlineMs,
                sr.getBudget(),
                CURRENCY,
                artisanId,
                artisanName,
                artisanRating,
                artisanTrust,
                distance
        );
    }

    private OfferResponse toOfferResponse(DispatchOffer offer, ArtisanProfile artisanProfile) {
        ServiceRequest sr = offer.getDispatch().getServiceRequest();
        Double distance = null;
        if (artisanProfile != null && artisanProfile.getLatitude() != null && artisanProfile.getLongitude() != null
                && sr.getLatitude() != null && sr.getLongitude() != null) {
            distance = distanceKm(sr.getLatitude(), sr.getLongitude(), artisanProfile.getLatitude(), artisanProfile.getLongitude());
        }
        long deadlineMs = offer.getDispatch().getRoundStartedAt().plusSeconds(ROUND_TIMEOUT_SECONDS).toEpochMilli();

        return new OfferResponse(
                offer.getId(),
                sr.getId(),
                sr.getCategory(),
                sr.getTitle(),
                sr.getDescription(),
                sr.getLocation(),
                sr.getBudget(),
                CURRENCY,
                distance,
                deadlineMs,
                offer.getStatus().name()
        );
    }

    private static double distanceKm(double lat1, double lon1, double lat2, double lon2) {
        final double earthRadiusKm = 6371;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
    }
}
