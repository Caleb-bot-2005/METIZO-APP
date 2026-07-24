package com.metizo.backend.repository;

import com.metizo.backend.domain.Bid;
import com.metizo.backend.domain.BidStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface BidRepository extends JpaRepository<Bid, Long> {
    List<Bid> findByServiceRequestIdOrderByAmountAsc(Long serviceRequestId);

    List<Bid> findByArtisanIdOrderByCreatedAtDesc(Long artisanId);

    Optional<Bid> findByServiceRequestIdAndArtisanId(Long serviceRequestId, Long artisanId);

    boolean existsByServiceRequestIdAndArtisanId(Long serviceRequestId, Long artisanId);

    List<Bid> findByServiceRequestIdAndStatus(Long serviceRequestId, BidStatus status);
}
