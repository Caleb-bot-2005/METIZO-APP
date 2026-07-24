package com.metizo.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

/** One artisan's simultaneous offer within a dispatch round. First to ACCEPT wins; siblings get CANCELLED. */
@Entity
@Table(name = "dispatch_offers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DispatchOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "dispatch_id", nullable = false)
    private EmergencyDispatch dispatch;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artisan_id", nullable = false)
    private User artisan;

    private int round;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private DispatchOfferStatus status = DispatchOfferStatus.PENDING;

    @Column(nullable = false)
    private Instant sentAt;

    private Instant respondedAt;
}
