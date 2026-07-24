package com.metizo.backend.dto;

import com.metizo.backend.domain.Bid;
import com.metizo.backend.domain.BidStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public class BidDtos {

    public record CreateRequest(
            @NotNull @Positive BigDecimal amount,
            String estimatedTime,
            String message
    ) {}

    /** Artisan revises the amount on their own still-pending bid. */
    public record ReviseRequest(
            @NotNull @Positive BigDecimal amount
    ) {}

    /**
     * Optional final price when accepting — lets a customer lock in whatever was
     * actually negotiated (e.g. in chat) instead of always the bid's original amount.
     * Null/omitted falls back to the bid's own amount.
     */
    public record AcceptRequest(
            BigDecimal agreedAmount
    ) {}

    public record Response(
            Long id,
            Long serviceRequestId,
            Long artisanId,
            String artisanName,
            double artisanTrustScore,
            BigDecimal amount,
            String estimatedTime,
            String message,
            BidStatus status,
            Instant createdAt
    ) {
        public static Response from(Bid bid) {
            double trust = bid.getArtisan().getArtisanProfile() == null
                    ? 0.0 : bid.getArtisan().getArtisanProfile().getTrustScore();
            return new Response(
                    bid.getId(),
                    bid.getServiceRequest().getId(),
                    bid.getArtisan().getId(),
                    bid.getArtisan().getFullName(),
                    trust,
                    bid.getAmount(),
                    bid.getEstimatedTime(),
                    bid.getMessage(),
                    bid.getStatus(),
                    bid.getCreatedAt()
            );
        }
    }
}
