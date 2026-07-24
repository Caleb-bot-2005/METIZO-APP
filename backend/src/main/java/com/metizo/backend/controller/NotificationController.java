package com.metizo.backend.controller;

import com.metizo.backend.dto.NotificationDtos;
import com.metizo.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationDtos.Response> listMine() {
        return notificationService.listMine();
    }

    @GetMapping("/unread-count")
    public NotificationDtos.UnreadCount unreadCount() {
        return new NotificationDtos.UnreadCount(notificationService.unreadCount());
    }

    @PostMapping("/{id}/read")
    public NotificationDtos.Response markRead(@PathVariable Long id) {
        return notificationService.markRead(id);
    }

    @PostMapping("/read-all")
    public void markAllRead() {
        notificationService.markAllRead();
    }
}
