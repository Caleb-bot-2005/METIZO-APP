package com.metizo.backend.dto;

import com.metizo.backend.domain.ContractStatus;
import com.metizo.backend.domain.DigitalContract;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;

public class ContractDtos {

    public record CreateRequest(
            @NotBlank String scopeOfWork,
            String terms
    ) {}

    public record Response(
            Long id,
            Long serviceRequestId,
            Long customerId,
            Long artisanId,
            String scopeOfWork,
            String terms,
            BigDecimal agreedAmount,
            ContractStatus status,
            Instant customerSignedAt,
            Instant artisanSignedAt,
            Instant createdAt
    ) {
        public static Response from(DigitalContract c) {
            return new Response(
                    c.getId(),
                    c.getServiceRequest().getId(),
                    c.getCustomer().getId(),
                    c.getArtisan().getId(),
                    c.getScopeOfWork(),
                    c.getTerms(),
                    c.getAgreedAmount(),
                    c.getStatus(),
                    c.getCustomerSignedAt(),
                    c.getArtisanSignedAt(),
                    c.getCreatedAt()
            );
        }
    }
}
