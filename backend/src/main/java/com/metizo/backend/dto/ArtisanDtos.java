package com.metizo.backend.dto;

import com.metizo.backend.domain.ArtisanProfile;

public class ArtisanDtos {

    public record Response(
            Long profileId,
            Long userId,
            String fullName,
            String category,
            String bio,
            String location,
            boolean available,
            int jobsCompleted,
            int ratingCount,
            double averageRating,
            double trustScore
    ) {
        public static Response from(ArtisanProfile p) {
            return new Response(
                    p.getId(),
                    p.getUser().getId(),
                    p.getUser().getFullName(),
                    p.getCategory(),
                    p.getBio(),
                    p.getLocation(),
                    p.isAvailable(),
                    p.getJobsCompleted(),
                    p.getRatingCount(),
                    p.averageRating(),
                    p.getTrustScore()
            );
        }
    }

    public record UpdateRequest(
            String category,
            String bio,
            String location,
            Boolean available
    ) {}
}
