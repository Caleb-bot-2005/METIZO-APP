package com.metizo.backend.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public class EmergencyDispatchDtos {

    public record CreateRequest(
            @NotBlank String category,
            @NotBlank String problemType,
            String note,
            @NotBlank String location,
            Double latitude,
            Double longitude
    ) {}

    /** Polled by the customer while searching, and once matched. */
    public record StatusResponse(
            Long requestId,
            String category,
            String title,
            String description,
            String status,
            int round,
            int maxRounds,
            long roundDeadlineEpochMs,
            BigDecimal estimatedAmount,
            String currency,
            Long assignedArtisanId,
            String assignedArtisanName,
            Double assignedArtisanRating,
            Double assignedArtisanTrustScore,
            Double distanceKm
    ) {}

    /** One pending offer as seen by an artisan. */
    public record OfferResponse(
            Long offerId,
            Long requestId,
            String category,
            String title,
            String description,
            String location,
            BigDecimal estimatedAmount,
            String currency,
            Double distanceKm,
            long roundDeadlineEpochMs,
            String status
    ) {}
}
