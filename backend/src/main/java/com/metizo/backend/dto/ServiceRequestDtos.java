package com.metizo.backend.dto;

import com.metizo.backend.domain.ProgressStage;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.ServiceRequest;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;

public class ServiceRequestDtos {

    public record CreateRequest(
            @NotBlank String title,
            String description,
            @NotBlank String category,
            String location,
            Double latitude,
            Double longitude,
            BigDecimal budget,
            boolean emergency
    ) {}

    /** Artisan reports a work checkpoint while the request is IN_PROGRESS. */
    public record ProgressRequest(@NotNull ProgressStage stage) {}

    public record Response(
            Long id,
            Long customerId,
            String customerName,
            String title,
            String description,
            String category,
            String location,
            Double latitude,
            Double longitude,
            BigDecimal budget,
            boolean emergency,
            RequestStatus status,
            ProgressStage progressStage,
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
                    sr.getLatitude(),
                    sr.getLongitude(),
                    sr.getBudget(),
                    sr.isEmergency(),
                    sr.getStatus(),
                    sr.getProgressStage(),
                    sr.getAssignedArtisan() == null ? null : sr.getAssignedArtisan().getId(),
                    sr.getAgreedAmount(),
                    sr.getCreatedAt()
            );
        }
    }
}
