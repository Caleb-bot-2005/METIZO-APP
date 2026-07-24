package com.metizo.backend.controller;

import com.metizo.backend.dto.ContractDtos;
import com.metizo.backend.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    /** Draft a contract for a job (customer or assigned artisan). */
    @PostMapping("/api/requests/{requestId}/contract")
    public ResponseEntity<ContractDtos.Response> create(
            @PathVariable Long requestId,
            @Valid @RequestBody ContractDtos.CreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contractService.create(requestId, request));
    }

    /** View the contract attached to a job. */
    @GetMapping("/api/requests/{requestId}/contract")
    public ContractDtos.Response get(@PathVariable Long requestId) {
        return contractService.getByRequest(requestId);
    }

    /** Sign the contract as the current user (customer or artisan). */
    @PostMapping("/api/contracts/{contractId}/sign")
    public ContractDtos.Response sign(@PathVariable Long contractId) {
        return contractService.sign(contractId);
    }
}
