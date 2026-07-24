package com.metizo.backend.repository;

import com.metizo.backend.domain.EmergencyDispatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface EmergencyDispatchRepository extends JpaRepository<EmergencyDispatch, Long> {
    Optional<EmergencyDispatch> findByServiceRequestId(Long serviceRequestId);

    /**
     * Row-locks the dispatch for the duration of the transaction, so two
     * artisans accepting near-simultaneously are serialized: the second one
     * blocks until the first commits, then correctly sees status != SEARCHING.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from EmergencyDispatch d where d.id = :id")
    Optional<EmergencyDispatch> findByIdForUpdate(@Param("id") Long id);
}
