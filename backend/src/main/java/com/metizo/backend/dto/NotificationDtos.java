package com.metizo.backend.dto;

import com.metizo.backend.domain.Notification;
import com.metizo.backend.domain.NotificationCategory;

import java.time.Instant;

public class NotificationDtos {

    public record Response(
            Long id,
            NotificationCategory category,
            String title,
            String body,
            Long relatedRequestId,
            boolean read,
            Instant createdAt
    ) {
        public static Response from(Notification n) {
            return new Response(
                    n.getId(),
                    n.getCategory(),
                    n.getTitle(),
                    n.getBody(),
                    n.getRelatedRequestId(),
                    n.isRead(),
                    n.getCreatedAt()
            );
        }
    }

    public record UnreadCount(long count) {}
}
