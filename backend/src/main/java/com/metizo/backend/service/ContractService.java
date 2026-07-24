package com.metizo.backend.service;

import com.metizo.backend.domain.ContractStatus;
import com.metizo.backend.domain.DigitalContract;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.ContractDtos.CreateRequest;
import com.metizo.backend.dto.ContractDtos.Response;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.DigitalContractRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final DigitalContractRepository contractRepository;
    private final ServiceRequestService serviceRequestService;
    private final CurrentUserService currentUserService;

    /**
     * Draft a contract for an assigned job. Either the owning customer or the
     * assigned artisan can create it; the agreed price comes from the request.
     */
    @Transactional
    public Response create(Long requestId, CreateRequest request) {
        ServiceRequest sr = serviceRequestService.getEntity(requestId);
        User user = currentUserService.require();
        requireParticipant(sr, user);

        if (sr.getStatus() != RequestStatus.ASSIGNED && sr.getStatus() != RequestStatus.IN_PROGRESS) {
            throw new BadRequestException("A contract can only be drafted once a bid is accepted");
        }
        if (sr.getAgreedAmount() == null || sr.getAssignedArtisan() == null) {
            throw new BadRequestException("Request has no accepted bid yet");
        }
        if (contractRepository.existsByServiceRequestId(requestId)) {
            throw new BadRequestException("This job already has a contract");
        }

        DigitalContract contract = DigitalContract.builder()
                .serviceRequest(sr)
                .customer(sr.getCustomer())
                .artisan(sr.getAssignedArtisan())
                .scopeOfWork(request.scopeOfWork())
                .terms(request.terms())
                .agreedAmount(sr.getAgreedAmount())
                .status(ContractStatus.DRAFT)
                .build();
        return Response.from(contractRepository.save(contract));
    }

    /** The current user (customer or artisan) signs the contract. */
    @Transactional
    public Response sign(Long contractId) {
        DigitalContract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ResourceNotFoundException("Contract not found: " + contractId));
        User user = currentUserService.require();

        if (contract.getStatus() == ContractStatus.VOID) {
            throw new BadRequestException("Cannot sign a void contract");
        }

        boolean isCustomer = contract.getCustomer().getId().equals(user.getId());
        boolean isArtisan = contract.getArtisan().getId().equals(user.getId());
        if (!isCustomer && !isArtisan) {
            throw new BadRequestException("Only the contract's customer or artisan can sign it");
        }

        if (isCustomer) {
            if (contract.getCustomerSignedAt() != null) {
                throw new BadRequestException("You have already signed this contract");
            }
            contract.setCustomerSignedAt(Instant.now());
        } else {
            if (contract.getArtisanSignedAt() != null) {
                throw new BadRequestException("You have already signed this contract");
            }
            contract.setArtisanSignedAt(Instant.now());
        }

        if (contract.isFullySigned()) {
            contract.setStatus(ContractStatus.SIGNED);
        }
        return Response.from(contract);
    }

    @Transactional(readOnly = true)
    public Response getByRequest(Long requestId) {
        return Response.from(contractRepository.findByServiceRequestId(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("No contract for request " + requestId)));
    }

    private void requireParticipant(ServiceRequest sr, User user) {
        boolean isCustomer = sr.getCustomer().getId().equals(user.getId());
        boolean isArtisan = sr.getAssignedArtisan() != null
                && sr.getAssignedArtisan().getId().equals(user.getId());
        if (!isCustomer && !isArtisan) {
            throw new BadRequestException("Only the job's customer or assigned artisan can do this");
        }
    }
}
