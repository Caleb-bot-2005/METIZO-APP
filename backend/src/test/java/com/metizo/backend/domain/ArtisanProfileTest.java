package com.metizo.backend.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Trust-score formula: 80% from average rating + 20% from completion volume
 * (capped at 20 jobs).
 */
class ArtisanProfileTest {

    @Test
    void fiveStarRatingWithOneJob_givesTrustScore81() {
        ArtisanProfile profile = new ArtisanProfile();
        profile.setRatingCount(1);
        profile.setRatingPointsTotal(5);   // one 5-star review
        profile.setJobsCompleted(1);

        profile.recalculateTrustScore();

        // (5/5 * 80) + (1/20 * 20) = 80 + 1 = 81.0
        assertThat(profile.getTrustScore()).isEqualTo(81.0);
    }

    @Test
    void averageRatingAndVolume_combineCorrectly() {
        ArtisanProfile profile = new ArtisanProfile();
        profile.setRatingCount(2);
        profile.setRatingPointsTotal(8);   // average 4.0 stars
        profile.setJobsCompleted(10);

        profile.recalculateTrustScore();

        // (4/5 * 80) + (10/20 * 20) = 64 + 10 = 74.0
        assertThat(profile.averageRating()).isEqualTo(4.0);
        assertThat(profile.getTrustScore()).isEqualTo(74.0);
    }

    @Test
    void volumeContributionIsCappedAt20Jobs() {
        ArtisanProfile profile = new ArtisanProfile();
        profile.setRatingCount(1);
        profile.setRatingPointsTotal(5);
        profile.setJobsCompleted(100);     // far beyond the cap

        profile.recalculateTrustScore();

        // volume contributes at most 20 points -> 80 + 20 = 100.0
        assertThat(profile.getTrustScore()).isEqualTo(100.0);
    }

    @Test
    void noRatingsOrJobs_givesZero() {
        ArtisanProfile profile = new ArtisanProfile();

        profile.recalculateTrustScore();

        assertThat(profile.averageRating()).isZero();
        assertThat(profile.getTrustScore()).isZero();
    }
}
