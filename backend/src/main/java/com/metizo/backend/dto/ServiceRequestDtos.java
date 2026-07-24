package com.metizo.backend.dto;

import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.ServiceRequest;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;

public class ServiceRequestDtos {

    public record CreateRequest(
            @NotBlank String title,
            String description,
            @NotBlank String category,
            String location,
            BigDecimal budget,
            boolean emergency
    ) {}

    public record Response(
            Long id,
            Long customerId,
            String customerName,
            String title,
            String description,
            String category,
            String location,
            BigDecimal budget,
            boolean emergency,
            RequestStatus status,
            Long assignedArtisanId,
            BigDecimal agreedAmount,
            Instant createdAt
    ) {
        public static Response from(ServiceRequest sr) {
            return new Response(
                    sr.getId(),
                    sr.getCustomer().getId(),
                    sr.getCustomer().getFullName(),
                    sr.getTitle(),
                    sr.getDescription(),
                    sr.getCategory(),
                    sr.getLocation(),
                    sr.getBudget(),
                    sr.isEmergency(),
                    sr.getStatus(),
                    sr.getAssignedArtisan() == null ? null : sr.getAssignedArtisan().getId(),
                    sr.getAgreedAmount(),
                    sr.getCreatedAt()
            );
        }
    }
}
