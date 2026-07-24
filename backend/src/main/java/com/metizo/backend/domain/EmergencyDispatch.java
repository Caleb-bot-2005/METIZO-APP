package com.metizo.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;

/**
 * One emergency request's dispatch session: rounds of simultaneous offers to
 * the nearest available artisans until one accepts (or all rounds are
 * exhausted). Kept separate from ServiceRequest/RequestStatus, which takes
 * over the job's lifecycle once an artisan is ASSIGNED.
 */
@Entity
@Table(name = "emergency_dispatches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class EmergencyDispatch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_request_id", nullable = false, unique = true)
    private ServiceRequest serviceRequest;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DispatchStatus status = DispatchStatus.SEARCHING;

    /** 1-based; a new round means a fresh batch of nearest-not-yet-offered artisans. */
    @Builder.Default
    private int round = 1;

    @Column(nullable = false)
    private Instant roundStartedAt;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
}
