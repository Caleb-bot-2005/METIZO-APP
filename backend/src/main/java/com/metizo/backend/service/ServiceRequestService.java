package com.metizo.backend.service;

import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.ServiceRequestDtos.CreateRequest;
import com.metizo.backend.dto.ServiceRequestDtos.Response;
import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.ArtisanProfileRepository;
import com.metizo.backend.repository.ServiceRequestRepository;
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
    private final EscrowService escrowService;
    private final CurrentUserService currentUserService;

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
                .budget(request.budget())
                .emergency(request.emergency())
                .status(RequestStatus.OPEN)
                .build();

        return Response.from(serviceRequestRepository.save(sr));
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
        return Response.from(sr);
    }

    /**
     * Customer confirms the work is done: releases escrow to the artisan,
     * marks the request COMPLETED and credits the artisan's completion count.
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
