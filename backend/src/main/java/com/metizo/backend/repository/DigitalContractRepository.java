package com.metizo.backend.repository;

import com.metizo.backend.domain.DigitalContract;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DigitalContractRepository extends JpaRepository<DigitalContract, Long> {
    Optional<DigitalContract> findByServiceRequestId(Long serviceRequestId);
    boolean existsByServiceRequestId(Long serviceRequestId);
}
