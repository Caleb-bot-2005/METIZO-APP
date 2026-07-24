package com.metizo.backend.repository;

import com.metizo.backend.domain.PhotoType;
import com.metizo.backend.domain.WorkPhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorkPhotoRepository extends JpaRepository<WorkPhoto, Long> {
    List<WorkPhoto> findByServiceRequestIdOrderByCreatedAtAsc(Long serviceRequestId);

    boolean existsByServiceRequestIdAndType(Long serviceRequestId, PhotoType type);
}
