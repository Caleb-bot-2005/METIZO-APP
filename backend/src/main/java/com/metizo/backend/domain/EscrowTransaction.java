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
@Table(name = "escrow_transactions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class EscrowTransaction {

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

    /** Total amount held from the customer. */
    @Column(nullable = false)
    private BigDecimal amount;

    /** Platform commission deducted on release. */
    private BigDecimal commission;

    /** Net paid out to the artisan on release (amount - commission). */
    private BigDecimal artisanPayout;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private EscrowStatus status = EscrowStatus.HELD;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;

    private Instant settledAt;

    /** Reference of the Paystack transaction initialized to collect this amount. */
    private String paystackReference;

    /** Set once Paystack confirms the charge succeeded — the real "money moved" signal. */
    private Instant paidAt;
}
