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
@Table(name = "users", uniqueConstraints = @UniqueConstraint(columnNames = "email"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    /** Hashed one-time password-reset code + expiry; both null when no reset is pending. */
    private String resetCodeHash;
    private Instant resetCodeExpiresAt;

    /** Hashed one-time email-verification code + expiry, separate from the reset code above. */
    private String verificationCodeHash;
    private Instant verificationCodeExpiresAt;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false not null")
    private boolean emailVerified = false;

    /** Real money, credited only after a verified Paystack top-up (see PaystackController.verify). */
    @Builder.Default
    @Column(nullable = false)
    private BigDecimal walletBalance = BigDecimal.ZERO;

    /** Optional profile, populated only for artisans. */
    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private ArtisanProfile artisanProfile;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
}
