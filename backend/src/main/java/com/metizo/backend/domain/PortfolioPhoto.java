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

/** A photo an artisan uploads to showcase past work on their public profile. */
@Entity
@Table(name = "portfolio_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PortfolioPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "artisan_profile_id", nullable = false)
    private ArtisanProfile artisanProfile;

    @Column(nullable = false)
    private String storedFilename;

    private String originalFilename;

    private String contentType;

    private long size;

    private String caption;

    @CreatedDate
    @Column(updatable = false)
    private Instant createdAt;
}
