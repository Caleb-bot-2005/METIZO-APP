package com.metizo.backend.service;

import com.metizo.backend.domain.PhotoType;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.domain.WorkPhoto;
import com.metizo.backend.dto.WorkPhotoDtos.Response;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.WorkPhotoRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class WorkPhotoService {

    private final WorkPhotoRepository workPhotoRepository;
    private final ServiceRequestService serviceRequestService;
    private final FileStorageService fileStorageService;
    private final CurrentUserService currentUserService;

    /** The assigned artisan uploads a before/after photo for a job. */
    @Transactional
    public Response upload(Long requestId, PhotoType type, MultipartFile file) {
        if (type == null) {
            throw new BadRequestException("Photo type (BEFORE or AFTER) is required");
        }
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        ServiceRequest sr = serviceRequestService.getEntity(requestId);
        User artisan = currentUserService.require();
        if (artisan.getRole() != Role.ARTISAN
                || sr.getAssignedArtisan() == null
                || !sr.getAssignedArtisan().getId().equals(artisan.getId())) {
            throw new BadRequestException("Only the assigned artisan can upload photos for this job");
        }
        if (sr.getStatus() != RequestStatus.ASSIGNED
                && sr.getStatus() != RequestStatus.IN_PROGRESS
                && sr.getStatus() != RequestStatus.COMPLETED) {
            throw new BadRequestException("Photos can only be uploaded once a job is assigned");
        }

        String stored = fileStorageService.store(file);
        WorkPhoto photo = WorkPhoto.builder()
                .serviceRequest(sr)
                .uploadedBy(artisan)
                .type(type)
                .storedFilename(stored)
                .originalFilename(file.getOriginalFilename())
                .contentType(contentType)
                .size(file.getSize())
                .build();
        return Response.from(workPhotoRepository.save(photo));
    }

    @Transactional(readOnly = true)
    public List<Response> listForRequest(Long requestId) {
        return workPhotoRepository.findByServiceRequestIdOrderByCreatedAtAsc(requestId)
                .stream().map(Response::from).toList();
    }

    /** Load the raw image bytes + content type for streaming back to a client. */
    @Transactional(readOnly = true)
    public LoadedImage loadImage(Long photoId) {
        WorkPhoto photo = workPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found: " + photoId));
        Resource resource = fileStorageService.load(photo.getStoredFilename());
        return new LoadedImage(resource, photo.getContentType());
    }

    public record LoadedImage(Resource resource, String contentType) {}
}
