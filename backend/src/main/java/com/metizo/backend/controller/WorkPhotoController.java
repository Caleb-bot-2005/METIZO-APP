package com.metizo.backend.controller;

import com.metizo.backend.domain.PhotoType;
import com.metizo.backend.dto.WorkPhotoDtos;
import com.metizo.backend.service.WorkPhotoService;
import com.metizo.backend.service.WorkPhotoService.LoadedImage;
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
public class WorkPhotoController {

    private final WorkPhotoService workPhotoService;

    /** Assigned artisan uploads a before/after photo (multipart form-data). */
    @PostMapping(path = "/api/requests/{requestId}/photos",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<WorkPhotoDtos.Response> upload(
            @PathVariable Long requestId,
            @RequestParam("type") PhotoType type,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workPhotoService.upload(requestId, type, file));
    }

    /** List photo metadata (with a URL for each) for a request. */
    @GetMapping("/api/requests/{requestId}/photos")
    public List<WorkPhotoDtos.Response> list(@PathVariable Long requestId) {
        return workPhotoService.listForRequest(requestId);
    }

    /** Stream the raw image bytes. Public so mobile {@code <Image>} tags can load it. */
    @GetMapping("/api/photos/{photoId}")
    public ResponseEntity<Resource> image(@PathVariable Long photoId) {
        LoadedImage loaded = workPhotoService.loadImage(photoId);
        MediaType mediaType = loaded.contentType() != null
                ? MediaType.parseMediaType(loaded.contentType())
                : MediaType.APPLICATION_OCTET_STREAM;
        return ResponseEntity.ok().contentType(mediaType).body(loaded.resource());
    }
}
