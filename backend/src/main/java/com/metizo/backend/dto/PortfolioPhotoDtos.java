package com.metizo.backend.dto;

import com.metizo.backend.domain.PortfolioPhoto;

import java.time.Instant;

public class PortfolioPhotoDtos {

    public record Response(
            Long id,
            Long artisanUserId,
            String caption,
            String url,
            Instant createdAt
    ) {
        public static Response from(PortfolioPhoto p) {
            return new Response(
                    p.getId(),
                    p.getArtisanProfile().getUser().getId(),
                    p.getCaption(),
                    "/api/portfolio-photos/" + p.getId(),
                    p.getCreatedAt()
            );
        }
    }
}
