package com.metizo.backend.controller;

import com.metizo.backend.dto.BidDtos;
import com.metizo.backend.dto.ServiceRequestDtos.CreateRequest;
import com.metizo.backend.dto.ServiceRequestDtos.Response;
import com.metizo.backend.service.BidService;
import com.metizo.backend.service.ServiceRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
@RequiredArgsConstructor
public class ServiceRequestController {

    private final ServiceRequestService serviceRequestService;
    private final BidService bidService;

    @PostMapping
    public ResponseEntity<Response> create(@Valid @RequestBody CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(serviceRequestService.create(request));
    }

    /** Open marketplace feed (optionally filtered by category) for artisans to browse. */
    @GetMapping
    public List<Response> listOpen(@RequestParam(required = false) String category) {
        return category == null
                ? serviceRequestService.listOpen()
                : serviceRequestService.listOpenByCategory(category);
    }

    @GetMapping("/mine")
    public List<Response> mine() {
        return serviceRequestService.myRequests();
    }

    @GetMapping("/{id}")
    public Response get(@PathVariable Long id) {
        return serviceRequestService.get(id);
    }

    @GetMapping("/{id}/bids")
    public List<BidDtos.Response> bids(@PathVariable Long id) {
        return bidService.listForRequest(id);
    }

    @PostMapping("/{id}/bids")
    public ResponseEntity<BidDtos.Response> placeBid(
            @PathVariable Long id,
            @Valid @RequestBody BidDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(bidService.placeBid(id, request));
    }

    @PostMapping("/{id}/start")
    public Response start(@PathVariable Long id) {
        return serviceRequestService.markInProgress(id);
    }

    @PostMapping("/{id}/confirm")
    public Response confirm(@PathVariable Long id) {
        return serviceRequestService.confirmCompletion(id);
    }

    @PostMapping("/{id}/cancel")
    public Response cancel(@PathVariable Long id) {
        return serviceRequestService.cancel(id);
    }
}
