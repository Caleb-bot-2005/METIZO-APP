package com.metizo.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "service_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Column(nullable = false)
    private String title;

    @Column(length = 2000)
    private String description;

    /** PLUMBING, ELECTRICAL, CARPENTRY, etc. */
    private String category;

    private String location;

    /** Real coordinates (GPS or manual pin) — needed for emergency dispatch's proximity matching. */
    private Double latitude;
    private Double longitude;

    /** Optional budget hint shown to bidding artisans; for emergency requests, the held escrow estimate. */
    private BigDecimal budget;

    @Builder.Default
    private boolean emergency = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private RequestStatus status = RequestStatus.OPEN;

    /** Fine-grained work checkpoint while IN_PROGRESS — null before work starts. */
    @Enumerated(EnumType.STRING)
    private ProgressStage progressStage;

    /** The artisan whose bid was accepted (null until assigned). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_artisan_id")
    private User assignedArtisan;

    /** Final agreed amount once a bid is accepted. */
    private BigDecimal agreedAmount;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
}
