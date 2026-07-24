package com.metizo.backend.controller;

import com.metizo.backend.dto.BidDtos;
import com.metizo.backend.service.BidService;
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

    /** Customer accepts a winning bid; triggers escrow hold + assignment. */
    @PostMapping("/{bidId}/accept")
    public BidDtos.Response accept(@PathVariable Long bidId) {
        return bidService.acceptBid(bidId);
    }
}
