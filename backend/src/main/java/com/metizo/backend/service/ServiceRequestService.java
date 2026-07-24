package com.metizo.backend.service;

import com.metizo.backend.domain.ProgressStage;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.ServiceRequestDtos.CreateRequest;
import com.metizo.backend.dto.ServiceRequestDtos.Response;
import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.domain.PhotoType;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.ArtisanProfileRepository;
import com.metizo.backend.repository.ServiceRequestRepository;
import com.metizo.backend.repository.WorkPhotoRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceRequestService {

    private final ServiceRequestRepository serviceRequestRepository;
    private final ArtisanProfileRepository artisanProfileRepository;
    private final WorkPhotoRepository workPhotoRepository;
    private final EscrowService escrowService;
    private final CurrentUserService currentUserService;
    private final NotificationService notificationService;

    @Transactional
    public Response create(CreateRequest request) {
        User customer = currentUserService.require();
        if (customer.getRole() != Role.CUSTOMER) {
            throw new BadRequestException("Only customers can post service requests");
        }

        ServiceRequest sr = ServiceRequest.builder()
                .customer(customer)
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .location(request.location())
                .latitude(request.latitude())
                .longitude(request.longitude())
                .budget(request.budget())
                .emergency(request.emergency())
                .status(RequestStatus.OPEN)
                .build();

        sr = serviceRequestRepository.save(sr);
        notificationService.notifyNewJobRequest(sr);
        return Response.from(sr);
    }

    @Transactional(readOnly = true)
    public Response get(Long id) {
        return Response.from(getEntity(id));
    }

    @Transactional(readOnly = true)
    public List<Response> listOpen() {
        return serviceRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.OPEN)
                .stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public List<Response> listOpenByCategory(String category) {
        return serviceRequestRepository
                .findByCategoryIgnoreCaseAndStatusOrderByCreatedAtDesc(category, RequestStatus.OPEN)
                .stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public List<Response> myRequests() {
        User user = currentUserService.require();
        List<ServiceRequest> requests = user.getRole() == Role.ARTISAN
                ? serviceRequestRepository.findByAssignedArtisanIdOrderByCreatedAtDesc(user.getId())
                : serviceRequestRepository.findByCustomerIdOrderByCreatedAtDesc(user.getId());
        return requests.stream().map(Response::from).toList();
    }

    /** Artisan marks an assigned job as started. */
    @Transactional
    public Response markInProgress(Long id) {
        ServiceRequest sr = getEntity(id);
        User artisan = currentUserService.require();
        requireAssignedArtisan(sr, artisan);
        if (sr.getStatus() != RequestStatus.ASSIGNED) {
            throw new BadRequestException("Request must be ASSIGNED to start work");
        }
        sr.setStatus(RequestStatus.IN_PROGRESS);
        sr.setProgressStage(ProgressStage.STARTED);
        return Response.from(sr);
    }

    /**
     * Artisan reports a work checkpoint (materials purchased / almost done / done)
     * while the request is IN_PROGRESS. STARTED is excluded here — it's set
     * automatically by markInProgress, not something to re-report manually.
     */
    @Transactional
    public Response updateProgress(Long id, ProgressStage stage) {
        ServiceRequest sr = getEntity(id);
        User artisan = currentUserService.require();
        requireAssignedArtisan(sr, artisan);
        if (sr.getStatus() != RequestStatus.IN_PROGRESS) {
            throw new BadRequestException("Request must be IN_PROGRESS to update work progress");
        }
        if (stage == ProgressStage.STARTED) {
            throw new BadRequestException("STARTED is set automatically when work begins");
        }
        sr.setProgressStage(stage);
        return Response.from(sr);
    }

    /**
     * Customer confirms the work is done: releases escrow to the artisan,
     * marks the request COMPLETED and credits the artisan's completion count.
     *
     * Gated on the artisan having actually reported DONE and posted at least one
     * AFTER photo as proof — otherwise this was effectively "release payment
     * before any evidence the job is finished," which defeats the point of
     * escrow. The customer still has to tap confirm themselves (this doesn't
     * auto-release once proof exists); it's just no longer possible early.
     */
    @Transactional
    public Response confirmCompletion(Long id) {
        ServiceRequest sr = getEntity(id);
        User customer = currentUserService.require();
        if (!sr.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Only the owning customer can confirm completion");
        }
        if (sr.getStatus() != RequestStatus.IN_PROGRESS && sr.getStatus() != RequestStatus.ASSIGNED) {
            throw new BadRequestException("Request must be ASSIGNED or IN_PROGRESS to confirm completion");
        }
        if (sr.getProgressStage() != ProgressStage.DONE) {
            throw new BadRequestException("The artisan hasn't marked this job as done yet");
        }
        if (!workPhotoRepository.existsByServiceRequestIdAndType(id, PhotoType.AFTER)) {
            throw new BadRequestException("Waiting on the artisan to post completion photos before you can release payment");
        }

        escrowService.release(sr.getId());
        sr.setStatus(RequestStatus.COMPLETED);

        ArtisanProfile profile = artisanProfileRepository.findByUserId(sr.getAssignedArtisan().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Artisan profile missing"));
        profile.setJobsCompleted(profile.getJobsCompleted() + 1);
        profile.recalculateTrustScore();

        return Response.from(sr);
    }

    @Transactional
    public Response cancel(Long id) {
        ServiceRequest sr = getEntity(id);
        User user = currentUserService.require();
        if (!sr.getCustomer().getId().equals(user.getId())) {
            throw new BadRequestException("Only the owning customer can cancel this request");
        }
        if (sr.getStatus() == RequestStatus.COMPLETED) {
            throw new BadRequestException("Completed requests cannot be cancelled");
        }
        // Refund any funds already held in escrow back to the customer.
        if (sr.getStatus() == RequestStatus.ASSIGNED || sr.getStatus() == RequestStatus.IN_PROGRESS) {
            escrowService.refund(sr.getId());
        }
        sr.setStatus(RequestStatus.CANCELLED);
        return Response.from(sr);
    }

    /** Permanently removes a cancelled request and everything under it (see V7 migration for the cascade). */
    @Transactional
    public void delete(Long id) {
        ServiceRequest sr = getEntity(id);
        User user = currentUserService.require();
        if (!sr.getCustomer().getId().equals(user.getId())) {
            throw new BadRequestException("Only the owning customer can delete this request");
        }
        if (sr.getStatus() != RequestStatus.CANCELLED) {
            throw new BadRequestException("Only cancelled requests can be deleted");
        }
        serviceRequestRepository.delete(sr);
    }

    public ServiceRequest getEntity(Long id) {
        return serviceRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service request not found: " + id));
    }

    private void requireAssignedArtisan(ServiceRequest sr, User artisan) {
        if (sr.getAssignedArtisan() == null || !sr.getAssignedArtisan().getId().equals(artisan.getId())) {
            throw new BadRequestException("You are not the assigned artisan for this request");
        }
    }
}
