package com.metizo.backend.repository;

import com.metizo.backend.domain.PortfolioPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PortfolioPhotoRepository extends JpaRepository<PortfolioPhoto, Long> {

    List<PortfolioPhoto> findByArtisanProfileIdOrderByCreatedAtDesc(Long artisanProfileId);

    List<PortfolioPhoto> findByArtisanProfile_User_IdOrderByCreatedAtDesc(Long userId);
}
