package com.metizo.backend.controller;

import com.metizo.backend.dto.PricingDtos;
import com.metizo.backend.service.PricingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/pricing")
@RequiredArgsConstructor
public class PricingController {

    private final PricingService pricingService;

    /** Price-transparency dashboard: average cost per service category. */
    @GetMapping("/categories")
    public List<PricingDtos.CategoryStats> categories() {
        return pricingService.categoryStats();
    }

    /** Estimate a job's cost before posting it (no login required). */
    @PostMapping("/estimate")
    public PricingDtos.EstimateResponse estimate(@Valid @RequestBody PricingDtos.EstimateRequest request) {
        return pricingService.estimate(request);
    }
}
