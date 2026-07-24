package com.metizo.backend.repository;

import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.ServiceRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRequestRepository extends JpaRepository<ServiceRequest, Long> {
    List<ServiceRequest> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    List<ServiceRequest> findByStatusOrderByCreatedAtDesc(RequestStatus status);

    List<ServiceRequest> findByCategoryIgnoreCaseAndStatusOrderByCreatedAtDesc(String category, RequestStatus status);

    List<ServiceRequest> findByAssignedArtisanIdOrderByCreatedAtDesc(Long artisanId);
}
