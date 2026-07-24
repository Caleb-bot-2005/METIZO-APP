package com.metizo.backend.controller;

import com.metizo.backend.dto.BidDtos;
import com.metizo.backend.service.BidService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bids")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    /** Bids placed by the current artisan. */
    @GetMapping("/mine")
    public List<BidDtos.Response> myBids() {
        return bidService.myBids();
    }

    /** Artisan revises the amount on their own still-pending bid. */
    @PutMapping("/{bidId}/revise")
    public BidDtos.Response revise(@PathVariable Long bidId, @Valid @RequestBody BidDtos.ReviseRequest request) {
        return bidService.reviseBid(bidId, request);
    }

    /**
     * Customer accepts a winning bid; triggers escrow hold + assignment. An optional
     * body can carry the actually-negotiated final price (see BidDtos.AcceptRequest).
     */
    @PostMapping("/{bidId}/accept")
    public BidDtos.Response accept(@PathVariable Long bidId, @RequestBody(required = false) BidDtos.AcceptRequest request) {
        return bidService.acceptBid(bidId, request != null ? request.agreedAmount() : null);
    }
}
