package com.metizo.backend.service;

import com.metizo.backend.domain.Bid;
import com.metizo.backend.domain.BidStatus;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.BidDtos.CreateRequest;
import com.metizo.backend.dto.BidDtos.Response;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.BidRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final ServiceRequestService serviceRequestService;
    private final EscrowService escrowService;
    private final CurrentUserService currentUserService;

    /** Artisan places a competitive bid on an open request. */
    @Transactional
    public Response placeBid(Long requestId, CreateRequest request) {
        User artisan = currentUserService.require();
        if (artisan.getRole() != Role.ARTISAN) {
            throw new BadRequestException("Only artisans can place bids");
        }

        ServiceRequest sr = serviceRequestService.getEntity(requestId);
        if (sr.getStatus() != RequestStatus.OPEN) {
            throw new BadRequestException("This request is no longer accepting bids");
        }
        if (bidRepository.existsByServiceRequestIdAndArtisanId(requestId, artisan.getId())) {
            throw new BadRequestException("You have already bid on this request");
        }

        Bid bid = Bid.builder()
                .serviceRequest(sr)
                .artisan(artisan)
                .amount(request.amount())
                .estimatedTime(request.estimatedTime())
                .message(request.message())
                .status(BidStatus.PENDING)
                .build();

        return Response.from(bidRepository.save(bid));
    }

    @Transactional(readOnly = true)
    public List<Response> listForRequest(Long requestId) {
        return bidRepository.findByServiceRequestIdOrderByAmountAsc(requestId)
                .stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public List<Response> myBids() {
        User artisan = currentUserService.require();
        return bidRepository.findByArtisanIdOrderByCreatedAtDesc(artisan.getId())
                .stream().map(Response::from).toList();
    }

    /**
     * Customer accepts a bid: assigns the artisan, rejects the rest, and locks
     * the agreed amount in escrow.
     */
    @Transactional
    public Response acceptBid(Long bidId) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new ResourceNotFoundException("Bid not found: " + bidId));
        ServiceRequest sr = bid.getServiceRequest();

        User customer = currentUserService.require();
        if (!sr.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Only the owning customer can accept a bid");
        }
        if (sr.getStatus() != RequestStatus.OPEN) {
            throw new BadRequestException("This request already has an accepted bid");
        }

        // Accept the chosen bid, reject the competitors.
        bid.setStatus(BidStatus.ACCEPTED);
        for (Bid other : bidRepository.findByServiceRequestIdOrderByAmountAsc(sr.getId())) {
            if (!other.getId().equals(bid.getId()) && other.getStatus() == BidStatus.PENDING) {
                other.setStatus(BidStatus.REJECTED);
            }
        }

        sr.setAssignedArtisan(bid.getArtisan());
        sr.setAgreedAmount(bid.getAmount());
        sr.setStatus(RequestStatus.ASSIGNED);

        escrowService.hold(sr, bid.getArtisan(), bid.getAmount());

        return Response.from(bid);
    }
}
