package com.metizo.backend.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "artisan_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArtisanProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /** e.g. PLUMBER, ELECTRICIAN, CARPENTER, TECHNICIAN. */
    private String category;

    @Column(length = 1000)
    private String bio;

    private String location;

    /** Real coordinates for distance-based "nearby artisans" sorting — null until the artisan sets it. */
    private Double latitude;
    private Double longitude;

    @Builder.Default
    private boolean available = true;

    /**
     * Identity/business verification, distinct from trust score — an admin marks
     * this true after checking ID/business documents. Independent of job history
     * so a legitimately verified artisan can show it from day one, before any jobs.
     */
    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false not null")
    private boolean verified = false;

    // --- Trust score inputs ---

    @Builder.Default
    private int jobsCompleted = 0;

    @Builder.Default
    private int ratingCount = 0;

    /** Sum of all star ratings received; used to derive the average. */
    @Builder.Default
    private int ratingPointsTotal = 0;

    /**
     * Trust score on a 0-100 scale, recomputed whenever a review lands or a job
     * completes. Combines average rating (80%) with completion volume (20%).
     */
    @Builder.Default
    private double trustScore = 0.0;

    public double averageRating() {
        return ratingCount == 0 ? 0.0 : (double) ratingPointsTotal / ratingCount;
    }

    /** Recompute the trust score from current rating + completion stats. */
    public void recalculateTrustScore() {
        double ratingComponent = (averageRating() / 5.0) * 80.0;
        // Completion volume caps its contribution at 20 points (>= 20 jobs).
        double volumeComponent = Math.min(jobsCompleted, 20) / 20.0 * 20.0;
        this.trustScore = Math.round((ratingComponent + volumeComponent) * 10.0) / 10.0;
    }
}
