package com.metizo.backend.dto;

import com.metizo.backend.domain.PhotoType;
import com.metizo.backend.domain.WorkPhoto;

import java.time.Instant;

public class WorkPhotoDtos {

    public record Response(
            Long id,
            Long serviceRequestId,
            Long uploadedById,
            PhotoType type,
            String originalFilename,
            String contentType,
            long size,
            String url,
            Instant createdAt
    ) {
        public static Response from(WorkPhoto p) {
            return new Response(
                    p.getId(),
                    p.getServiceRequest().getId(),
                    p.getUploadedBy().getId(),
                    p.getType(),
                    p.getOriginalFilename(),
                    p.getContentType(),
                    p.getSize(),
                    "/api/photos/" + p.getId(),   // GET this URL to fetch the image bytes
                    p.getCreatedAt()
            );
        }
    }
}
