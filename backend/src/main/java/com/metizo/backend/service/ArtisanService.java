package com.metizo.backend.service;

import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.domain.Role;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.ArtisanDtos.Response;
import com.metizo.backend.dto.ArtisanDtos.UpdateRequest;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.ArtisanProfileRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArtisanService {

    private final ArtisanProfileRepository artisanProfileRepository;
    private final CurrentUserService currentUserService;

    /** Directory listing, highest trust score first. */
    @Transactional(readOnly = true)
    public List<Response> listAll() {
        return artisanProfileRepository.findAllByOrderByTrustScoreDesc()
                .stream().map(Response::from).toList();
    }

    /** Smart matching: best available artisans for a category. */
    @Transactional(readOnly = true)
    public List<Response> matchByCategory(String category) {
        return artisanProfileRepository
                .findByCategoryIgnoreCaseAndAvailableTrueOrderByTrustScoreDesc(category)
                .stream().map(Response::from).toList();
    }

    @Transactional(readOnly = true)
    public Response getByUserId(Long userId) {
        return Response.from(getProfile(userId));
    }

    /** Admin marks (or unmarks) an artisan as identity/business-verified. */
    @Transactional
    public Response setVerified(Long userId, boolean verified) {
        ArtisanProfile profile = getProfile(userId);
        profile.setVerified(verified);
        return Response.from(profile);
    }

    @Transactional
    public Response updateMyProfile(UpdateRequest request) {
        User user = currentUserService.require();
        if (user.getRole() != Role.ARTISAN) {
            throw new BadRequestException("Only artisans have a profile");
        }
        ArtisanProfile profile = getProfile(user.getId());
        if (request.category() != null) profile.setCategory(request.category());
        if (request.bio() != null) profile.setBio(request.bio());
        if (request.location() != null) profile.setLocation(request.location());
        if (request.latitude() != null) profile.setLatitude(request.latitude());
        if (request.longitude() != null) profile.setLongitude(request.longitude());
        if (request.available() != null) profile.setAvailable(request.available());
        return Response.from(profile);
    }

    private ArtisanProfile getProfile(Long userId) {
        return artisanProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Artisan profile not found for user " + userId));
    }
}
