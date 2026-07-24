package com.metizo.backend.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

/**
 * Price-transparency dashboard + price-estimator payloads.
 */
public class PricingDtos {

    public record CategoryStats(
            String category,
            long completedJobs,
            BigDecimal averagePrice,
            BigDecimal minPrice,
            BigDecimal maxPrice
    ) {}

    /** Customer asks "what should this cost?" before posting a job. */
    public record EstimateRequest(
            @NotBlank String category,
            String description,
            boolean emergency
    ) {}

    public record EstimateResponse(
            String category,
            String currency,
            BigDecimal estimatedCost,
            BigDecimal lowEstimate,
            BigDecimal highEstimate,
            String estimatedTime,
            String likelyMaterials,
            long basedOnSamples,
            String confidence,   // HIGH | MEDIUM | LOW
            boolean emergencySurcharge,
            String note
    ) {}
}
