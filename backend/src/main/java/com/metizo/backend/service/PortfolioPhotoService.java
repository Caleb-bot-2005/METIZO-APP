package com.metizo.backend.service;

import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.domain.PortfolioPhoto;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.PortfolioPhotoDtos.Response;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.ArtisanProfileRepository;
import com.metizo.backend.repository.PortfolioPhotoRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioPhotoService {

    private final PortfolioPhotoRepository portfolioPhotoRepository;
    private final ArtisanProfileRepository artisanProfileRepository;
    private final FileStorageService fileStorageService;
    private final CurrentUserService currentUserService;

    /** The logged-in artisan uploads a photo to their own portfolio. */
    @Transactional
    public Response upload(String caption, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Only image files are allowed");
        }

        User user = currentUserService.require();
        if (user.getRole() != Role.ARTISAN) {
            throw new BadRequestException("Only artisans have a portfolio");
        }
        ArtisanProfile profile = artisanProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Artisan profile not found for user " + user.getId()));

        String stored = fileStorageService.store(file);
        PortfolioPhoto photo = PortfolioPhoto.builder()
                .artisanProfile(profile)
                .storedFilename(stored)
                .originalFilename(file.getOriginalFilename())
                .contentType(contentType)
                .size(file.getSize())
                .caption(caption)
                .build();
        return Response.from(portfolioPhotoRepository.save(photo));
    }

    @Transactional(readOnly = true)
    public List<Response> listForArtisan(Long userId) {
        return portfolioPhotoRepository.findByArtisanProfile_User_IdOrderByCreatedAtDesc(userId)
                .stream().map(Response::from).toList();
    }

    /** The logged-in artisan deletes one of their own portfolio photos. */
    @Transactional
    public void delete(Long photoId) {
        User user = currentUserService.require();
        PortfolioPhoto photo = portfolioPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found: " + photoId));
        if (!photo.getArtisanProfile().getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Not your portfolio photo");
        }
        portfolioPhotoRepository.delete(photo);
    }

    @Transactional(readOnly = true)
    public LoadedImage loadImage(Long photoId) {
        PortfolioPhoto photo = portfolioPhotoRepository.findById(photoId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found: " + photoId));
        Resource resource = fileStorageService.load(photo.getStoredFilename());
        return new LoadedImage(resource, photo.getContentType());
    }

    public record LoadedImage(Resource resource, String contentType) {}
}
