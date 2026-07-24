package com.metizo.backend.repository;

import com.metizo.backend.domain.EscrowTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EscrowTransactionRepository extends JpaRepository<EscrowTransaction, Long> {
    Optional<EscrowTransaction> findByServiceRequestId(Long serviceRequestId);
}
