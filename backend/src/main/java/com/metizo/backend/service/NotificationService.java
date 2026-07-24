package com.metizo.backend.service;

import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.domain.Notification;
import com.metizo.backend.domain.NotificationCategory;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.NotificationDtos.Response;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.repository.ArtisanProfileRepository;
import com.metizo.backend.repository.NotificationRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final ArtisanProfileRepository artisanProfileRepository;
    private final CurrentUserService currentUserService;

    /** Notify available artisans in the request's category that a new job came in. */
    @Transactional
    public void notifyNewJobRequest(ServiceRequest sr) {
        List<ArtisanProfile> matching = artisanProfileRepository
                .findByCategoryIgnoreCaseAndAvailableTrueOrderByTrustScoreDesc(sr.getCategory());
        for (ArtisanProfile profile : matching) {
            Notification notification = Notification.builder()
                    .recipient(profile.getUser())
                    .category(NotificationCategory.JOB)
                    .title("New job near you")
                    .body(sr.getTitle() + " — " + sr.getCategory())
                    .relatedRequestId(sr.getId())
                    .build();
            notificationRepository.save(notification);
        }
    }

    /** Notify one artisan they've been offered an emergency job (real-time-ish via their notification poll). */
    @Transactional
    public void notifyEmergencyOffer(User artisan, ServiceRequest sr) {
        Notification notification = Notification.builder()
                .recipient(artisan)
                .category(NotificationCategory.EMERGENCY)
                .title("Emergency job nearby!")
                .body(sr.getTitle() + " — respond fast, first to accept gets it.")
                .relatedRequestId(sr.getId())
                .build();
        notificationRepository.save(notification);
    }

    @Transactional(readOnly = true)
    public List<Response> listMine() {
        User user = currentUserService.require();
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        User user = currentUserService.require();
        return notificationRepository.countByRecipientIdAndReadFalse(user.getId());
    }

    @Transactional
    public Response markRead(Long id) {
        User user = currentUserService.require();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Notification not found: " + id));
        if (!notification.getRecipient().getId().equals(user.getId())) {
            throw new BadRequestException("Not your notification");
        }
        notification.setRead(true);
        return Response.from(notification);
    }

    @Transactional
    public void markAllRead() {
        User user = currentUserService.require();
        notificationRepository.markAllReadForRecipient(user.getId());
    }
}
