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

/**
 * A digital agreement between a customer and the assigned artisan for a job:
 * records the scope of work and agreed price, and both parties sign it before
 * work begins to reduce disputes.
 */
@Entity
@Table(name = "digital_contracts",
        uniqueConstraints = @UniqueConstraint(columnNames = "service_request_id"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class DigitalContract {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_request_id", nullable = false, unique = true)
    private ServiceRequest serviceRequest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "artisan_id", nullable = false)
    private User artisan;

    @Column(nullable = false, length = 4000)
    private String scopeOfWork;

    @Column(length = 4000)
    private String terms;

    /** The price both parties agree to (copied from the accepted bid). */
    @Column(nullable = false)
    private BigDecimal agreedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ContractStatus status = ContractStatus.DRAFT;

    private Instant customerSignedAt;

    private Instant artisanSignedAt;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    public boolean isFullySigned() {
        return customerSignedAt != null && artisanSignedAt != null;
    }
}
