package com.metizo.backend.service;

import com.metizo.backend.domain.ArtisanProfile;
import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.Review;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.ReviewDtos.CreateRequest;
import com.metizo.backend.dto.ReviewDtos.Response;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.ArtisanProfileRepository;
import com.metizo.backend.repository.ReviewRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ArtisanProfileRepository artisanProfileRepository;
    private final ServiceRequestService serviceRequestService;
    private final CurrentUserService currentUserService;

    /**
     * Customer reviews a completed job. The rating feeds the artisan's trust score.
     */
    @Transactional
    public Response leaveReview(Long requestId, CreateRequest request) {
        ServiceRequest sr = serviceRequestService.getEntity(requestId);
        User customer = currentUserService.require();

        if (!sr.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Only the owning customer can review this job");
        }
        if (sr.getStatus() != RequestStatus.COMPLETED) {
            throw new BadRequestException("You can only review completed jobs");
        }
        if (reviewRepository.existsByServiceRequestId(requestId)) {
            throw new BadRequestException("This job has already been reviewed");
        }

        User artisan = sr.getAssignedArtisan();
        Review review = Review.builder()
                .serviceRequest(sr)
                .customer(customer)
                .artisan(artisan)
                .rating(request.rating())
                .comment(request.comment())
                .build();
        review = reviewRepository.save(review);

        ArtisanProfile profile = artisanProfileRepository.findByUserId(artisan.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Artisan profile missing"));
        profile.setRatingCount(profile.getRatingCount() + 1);
        profile.setRatingPointsTotal(profile.getRatingPointsTotal() + request.rating());
        profile.recalculateTrustScore();

        return Response.from(review);
    }

    @Transactional(readOnly = true)
    public List<Response> listForArtisan(Long artisanUserId) {
        return reviewRepository.findByArtisanIdOrderByCreatedAtDesc(artisanUserId)
                .stream().map(Response::from).toList();
    }
}
