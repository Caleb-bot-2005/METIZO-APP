package com.metizo.backend.controller;

import com.metizo.backend.dto.PortfolioPhotoDtos;
import com.metizo.backend.service.PortfolioPhotoService;
import com.metizo.backend.service.PortfolioPhotoService.LoadedImage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PortfolioPhotoController {

    private final PortfolioPhotoService portfolioPhotoService;

    /** Logged-in artisan uploads a portfolio photo (multipart form-data). */
    @PostMapping(path = "/api/artisans/me/portfolio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PortfolioPhotoDtos.Response> upload(
            @RequestParam(value = "caption", required = false) String caption,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(portfolioPhotoService.upload(caption, file));
    }

    /** Public: view an artisan's portfolio. */
    @GetMapping("/api/artisans/{userId}/portfolio")
    public List<PortfolioPhotoDtos.Response> list(@PathVariable Long userId) {
        return portfolioPhotoService.listForArtisan(userId);
    }

    @DeleteMapping("/api/artisans/me/portfolio/{photoId}")
    public ResponseEntity<Void> delete(@PathVariable Long photoId) {
        portfolioPhotoService.delete(photoId);
        return ResponseEntity.noContent().build();
    }

    /** Stream the raw image bytes. Public so mobile <Image> tags can load it. */
    @GetMapping("/api/portfolio-photos/{photoId}")
    public ResponseEntity<Resource> image(@PathVariable Long photoId) {
        LoadedImage loaded = portfolioPhotoService.loadImage(photoId);
        MediaType mediaType = loaded.contentType() != null
                ? MediaType.parseMediaType(loaded.contentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok().contentType(mediaType).body(loaded.resource());
    }
}
