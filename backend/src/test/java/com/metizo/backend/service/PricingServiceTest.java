package com.metizo.backend.service;

import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.dto.PricingDtos.EstimateRequest;
import com.metizo.backend.dto.PricingDtos.EstimateResponse;
import com.metizo.backend.repository.ServiceRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PricingServiceTest {

    @Mock ServiceRequestRepository serviceRequestRepository;

    @InjectMocks PricingService pricingService;

    private void noHistory() {
        when(serviceRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.COMPLETED))
                .thenReturn(List.of());
    }

    @Test
    void emergencyAddsA25PercentSurchargeToTheCategoryDefault() {
        noHistory();

        EstimateResponse r = pricingService.estimate(new EstimateRequest("PLUMBING", null, true));

        // PLUMBING default 250 * 1.25 emergency = 312.50
        assertThat(r.estimatedCost()).isEqualByComparingTo("312.50");
        assertThat(r.emergencySurcharge()).isTrue();
        assertThat(r.confidence()).isEqualTo("LOW"); // no history
    }

    @Test
    void installKeywordRaisesTheEstimate() {
        noHistory();

        EstimateResponse r = pricingService.estimate(
                new EstimateRequest("PLUMBING", "install new unit", false));

        // PLUMBING default 250 * 1.30 complexity = 325.00
        assertThat(r.estimatedCost()).isEqualByComparingTo("325.00");
    }

    @Test
    void unknownCategoryFallsBackToGenericDefaultWithLowConfidence() {
        noHistory();

        EstimateResponse r = pricingService.estimate(
                new EstimateRequest("WELDING", "gate repair", false));

        assertThat(r.estimatedCost()).isEqualByComparingTo("300.00"); // generic default
        assertThat(r.confidence()).isEqualTo("LOW");
        assertThat(r.basedOnSamples()).isZero();
    }
}
