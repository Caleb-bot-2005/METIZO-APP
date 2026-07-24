package com.metizo.backend.dto;

import com.metizo.backend.domain.ArtisanProfile;

public class ArtisanDtos {

    public record Response(
            Long profileId,
            Long userId,
            String fullName,
            String phone,
            String category,
            String bio,
            String location,
            Double latitude,
            Double longitude,
            boolean available,
            boolean verified,
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
                    p.getUser().getPhone(),
                    p.getCategory(),
                    p.getBio(),
                    p.getLocation(),
                    p.getLatitude(),
                    p.getLongitude(),
                    p.isAvailable(),
                    p.isVerified(),
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
            Double latitude,
            Double longitude,
            Boolean available
    ) {}
}
