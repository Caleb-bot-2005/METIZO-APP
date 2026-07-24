package com.metizo.backend.repository;

import com.metizo.backend.domain.ArtisanProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ArtisanProfileRepository extends JpaRepository<ArtisanProfile, Long> {
    Optional<ArtisanProfile> findByUserId(Long userId);

    /** Smart matching: artisans in a category, best trust score first. */
    List<ArtisanProfile> findByCategoryIgnoreCaseAndAvailableTrueOrderByTrustScoreDesc(String category);

    List<ArtisanProfile> findAllByOrderByTrustScoreDesc();
}
