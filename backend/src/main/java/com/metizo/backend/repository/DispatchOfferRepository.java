package com.metizo.backend.repository;

import com.metizo.backend.domain.DispatchOffer;
import com.metizo.backend.domain.DispatchOfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DispatchOfferRepository extends JpaRepository<DispatchOffer, Long> {
    List<DispatchOffer> findByDispatchIdAndStatus(Long dispatchId, DispatchOfferStatus status);

    List<DispatchOffer> findByDispatchId(Long dispatchId);

    boolean existsByDispatchIdAndRoundAndStatus(Long dispatchId, int round, DispatchOfferStatus status);

    List<DispatchOffer> findByArtisanIdAndStatusOrderBySentAtDesc(Long artisanId, DispatchOfferStatus status);
}
