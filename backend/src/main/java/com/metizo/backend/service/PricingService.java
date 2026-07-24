package com.metizo.backend.service;

import com.metizo.backend.domain.RequestStatus;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.dto.PricingDtos.CategoryStats;
import com.metizo.backend.dto.PricingDtos.EstimateRequest;
import com.metizo.backend.dto.PricingDtos.EstimateResponse;
import com.metizo.backend.repository.ServiceRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Price-transparency dashboard + a rule-based price estimator. The estimator
 * uses historical completed-job prices per category (with sensible defaults
 * when there's no history yet) — no external AI/LLM service required.
 */
@Service
@RequiredArgsConstructor
public class PricingService {

    private final ServiceRequestRepository serviceRequestRepository;

    private static final String CURRENCY = "GHS";
    private static final BigDecimal EMERGENCY_MULTIPLIER = new BigDecimal("1.25");

    /** Per-category fallback used when there's not enough historical data. */
    private record CategoryDefault(BigDecimal basePrice, String time, String materials) {}

    private static final Map<String, CategoryDefault> DEFAULTS = Map.of(
            "PLUMBING",   new CategoryDefault(new BigDecimal("250"), "1-2 days", "Pipes, fittings, sealant"),
            "ELECTRICAL", new CategoryDefault(new BigDecimal("300"), "1-3 days", "Wiring, sockets, breakers"),
            "CARPENTRY",  new CategoryDefault(new BigDecimal("400"), "2-4 days", "Wood, screws, hinges, varnish"),
            "MASONRY",    new CategoryDefault(new BigDecimal("500"), "3-5 days", "Cement, sand, blocks"),
            "PAINTING",   new CategoryDefault(new BigDecimal("350"), "2-3 days", "Paint, brushes, rollers, primer"),
            "AC_REPAIR",  new CategoryDefault(new BigDecimal("280"), "1 day",    "Refrigerant, filters, parts"),
            "APPLIANCE",  new CategoryDefault(new BigDecimal("220"), "1 day",    "Replacement parts"));

    private static final CategoryDefault GENERIC_DEFAULT =
            new CategoryDefault(new BigDecimal("300"), "1-3 days", "Varies by job");

    @Transactional(readOnly = true)
    public List<CategoryStats> categoryStats() {
        List<ServiceRequest> completed =
                serviceRequestRepository.findByStatusOrderByCreatedAtDesc(RequestStatus.COMPLETED);

        Map<String, List<BigDecimal>> byCategory = new TreeMap<>();
        for (ServiceRequest sr : completed) {
            if (sr.getAgreedAmount() == null) continue;
            String category = sr.getCategory() == null ? "OTHER" : sr.getCategory().toUpperCase();
            byCategory.computeIfAbsent(category, k -> new ArrayList<>()).add(sr.getAgreedAmount());
        }

        List<CategoryStats> stats = new ArrayList<>();
        for (Map.Entry<String, List<BigDecimal>> entry : byCategory.entrySet()) {
            List<BigDecimal> prices = entry.getValue();
            BigDecimal sum = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avg = sum.divide(BigDecimal.valueOf(prices.size()), 2, RoundingMode.HALF_UP);
            BigDecimal min = prices.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            BigDecimal max = prices.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            stats.add(new CategoryStats(entry.getKey(), prices.size(), avg, min, max));
        }
        return stats;
    }

    /**
     * Estimate a job's cost from historical prices in that category, falling
     * back to category defaults. A few keywords nudge the estimate for jobs
     * that read as installs/replacements (typically pricier than repairs).
     */
    @Transactional(readOnly = true)
    public EstimateResponse estimate(EstimateRequest request) {
        String category = request.category().toUpperCase().trim();

        List<BigDecimal> prices = serviceRequestRepository
                .findByStatusOrderByCreatedAtDesc(RequestStatus.COMPLETED).stream()
                .filter(sr -> sr.getAgreedAmount() != null)
                .filter(sr -> category.equalsIgnoreCase(sr.getCategory()))
                .map(ServiceRequest::getAgreedAmount)
                .toList();

        BigDecimal base;
        long samples = prices.size();
        String confidence;
        String basis;
        CategoryDefault def = DEFAULTS.getOrDefault(category, GENERIC_DEFAULT);

        if (samples >= 3) {
            BigDecimal sum = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            base = sum.divide(BigDecimal.valueOf(samples), 2, RoundingMode.HALF_UP);
            confidence = "HIGH";
            basis = "based on " + samples + " completed " + category + " jobs";
        } else if (samples > 0) {
            // Blend the little history we have with the category default.
            BigDecimal sum = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal avg = sum.divide(BigDecimal.valueOf(samples), 2, RoundingMode.HALF_UP);
            base = avg.add(def.basePrice()).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
            confidence = "MEDIUM";
            basis = "based on " + samples + " past job(s) plus typical " + category + " rates";
        } else {
            base = def.basePrice();
            confidence = "LOW";
            basis = "no history yet for " + category + " - using a typical starting rate";
        }

        // Light complexity nudge from the description.
        BigDecimal complexity = complexityMultiplier(request.description());
        base = base.multiply(complexity);

        // Emergency surcharge.
        boolean emergency = request.emergency();
        if (emergency) {
            base = base.multiply(EMERGENCY_MULTIPLIER);
        }

        base = base.setScale(2, RoundingMode.HALF_UP);
        // Present a +/- 20% range around the point estimate.
        BigDecimal low = base.multiply(new BigDecimal("0.80")).setScale(2, RoundingMode.HALF_UP);
        BigDecimal high = base.multiply(new BigDecimal("1.20")).setScale(2, RoundingMode.HALF_UP);

        String note = "Estimate " + basis
                + (emergency ? "; +25% emergency surcharge applied" : "")
                + ". Final price is set by artisan bids.";

        return new EstimateResponse(
                category, CURRENCY, base, low, high,
                def.time(), def.materials(), samples, confidence, emergency, note);
    }

    /** Returns a multiplier > 1 when the description suggests a larger job. */
    private BigDecimal complexityMultiplier(String description) {
        if (description == null || description.isBlank()) {
            return BigDecimal.ONE;
        }
        String d = description.toLowerCase();
        String[] bigJobWords = {"install", "replace", "rewire", "new ", "build", "renovat", "full"};
        for (String w : bigJobWords) {
            if (d.contains(w)) {
                return new BigDecimal("1.30");
            }
        }
        return BigDecimal.ONE;
    }
}
