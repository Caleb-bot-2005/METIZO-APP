package com.metizo.backend.controller;

import com.metizo.backend.dto.EscrowDtos;
import com.metizo.backend.service.EscrowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/requests/{requestId}/escrow")
@RequiredArgsConstructor
public class EscrowController {

    private final EscrowService escrowService;

    /** View the escrow ledger entry for a request (held / released / refunded). */
    @GetMapping
    public EscrowDtos.Response get(@PathVariable Long requestId) {
        return EscrowDtos.Response.from(escrowService.getByRequest(requestId));
    }
}
