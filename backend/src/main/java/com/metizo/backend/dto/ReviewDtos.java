package com.metizo.backend.dto;

import com.metizo.backend.domain.Review;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.time.Instant;

public class ReviewDtos {

    public record CreateRequest(
            @Min(1) @Max(5) int rating,
            String comment
    ) {}

    public record Response(
            Long id,
            Long serviceRequestId,
            Long artisanId,
            Long customerId,
            String customerName,
            int rating,
            String comment,
            Instant createdAt
    ) {
        public static Response from(Review review) {
            return new Response(
                    review.getId(),
                    review.getServiceRequest().getId(),
                    review.getArtisan().getId(),
                    review.getCustomer().getId(),
                    review.getCustomer().getFullName(),
                    review.getRating(),
                    review.getComment(),
                    review.getCreatedAt()
            );
        }
    }
}
