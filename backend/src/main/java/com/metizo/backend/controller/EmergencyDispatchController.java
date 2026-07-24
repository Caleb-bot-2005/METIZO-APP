package com.metizo.backend.controller;

import com.metizo.backend.dto.EmergencyDispatchDtos.CreateRequest;
import com.metizo.backend.dto.EmergencyDispatchDtos.OfferResponse;
import com.metizo.backend.dto.EmergencyDispatchDtos.StatusResponse;
import com.metizo.backend.service.EmergencyDispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Ride-hailing-style emergency dispatch — deliberately separate from
 * ServiceRequestController/BidController's open-bidding flow. No bidding,
 * no manual artisan selection: the system picks and offers, first to accept wins.
 */
@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
public class EmergencyDispatchController {

    private final EmergencyDispatchService dispatchService;

    /** Customer submits an emergency request; dispatch to the nearest artisans starts immediately. */
    @PostMapping("/dispatch")
    public ResponseEntity<StatusResponse> create(@Valid @RequestBody CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(dispatchService.create(request));
    }

    /** Customer polls this while searching, and after being matched. */
    @GetMapping("/dispatch/{requestId}")
    public StatusResponse status(@PathVariable Long requestId) {
        return dispatchService.getStatus(requestId);
    }

    /** Customer cancels while still searching (no artisan assigned yet). */
    @PostMapping("/dispatch/{requestId}/cancel")
    public StatusResponse cancel(@PathVariable Long requestId) {
        return dispatchService.cancel(requestId);
    }

    /** Customer isn't happy with the match and wants a different artisan (before paying, limited retries). */
    @PostMapping("/dispatch/{requestId}/rematch")
    public StatusResponse rematch(@PathVariable Long requestId) {
        return dispatchService.rematch(requestId);
    }

    /** Artisan polls this for their pending emergency offers. */
    @GetMapping("/offers/mine")
    public List<OfferResponse> myOffers() {
        return dispatchService.myOffers();
    }

    /** First artisan to accept gets the job; siblings are cancelled automatically. */
    @PostMapping("/offers/{offerId}/accept")
    public OfferResponse accept(@PathVariable Long offerId) {
        return dispatchService.acceptOffer(offerId);
    }

    @PostMapping("/offers/{offerId}/decline")
    public ResponseEntity<Void> decline(@PathVariable Long offerId) {
        dispatchService.declineOffer(offerId);
        return ResponseEntity.noContent().build();
    }
}
