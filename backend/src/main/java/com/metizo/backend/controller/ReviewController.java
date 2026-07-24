package com.metizo.backend.controller;

import com.metizo.backend.dto.ReviewDtos;
import com.metizo.backend.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/requests/{requestId}/review")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    /** Customer reviews a completed job; feeds the artisan's trust score. */
    @PostMapping
    public ResponseEntity<ReviewDtos.Response> leaveReview(
            @PathVariable Long requestId,
            @Valid @RequestBody ReviewDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.leaveReview(requestId, request));
    }
}
