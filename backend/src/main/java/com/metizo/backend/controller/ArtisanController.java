package com.metizo.backend.controller;

import com.metizo.backend.dto.ArtisanDtos;
import com.metizo.backend.dto.ReviewDtos;
import com.metizo.backend.service.ArtisanService;
import com.metizo.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/artisans")
@RequiredArgsConstructor
public class ArtisanController {

    private final ArtisanService artisanService;
    private final ReviewService reviewService;

    @GetMapping
    public List<ArtisanDtos.Response> list() {
        return artisanService.listAll();
    }

    /** Smart matching: best available artisans for a category. */
    @GetMapping("/match")
    public List<ArtisanDtos.Response> match(@RequestParam String category) {
        return artisanService.matchByCategory(category);
    }

    @GetMapping("/{userId}")
    public ArtisanDtos.Response get(@PathVariable Long userId) {
        return artisanService.getByUserId(userId);
    }

    @GetMapping("/{userId}/reviews")
    public List<ReviewDtos.Response> reviews(@PathVariable Long userId) {
        return reviewService.listForArtisan(userId);
    }

    /** Artisan edits their own profile (availability, bio, category, location). */
    @PutMapping("/me")
    public ArtisanDtos.Response updateMe(@Valid @RequestBody ArtisanDtos.UpdateRequest request) {
        return artisanService.updateMyProfile(request);
    }

    /** Admin marks an artisan's identity/business as verified after checking their documents. */
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{userId}/verify")
    public ArtisanDtos.Response setVerified(@PathVariable Long userId, @RequestBody Map<String, Boolean> body) {
        return artisanService.setVerified(userId, Boolean.TRUE.equals(body.get("verified")));
    }
}
