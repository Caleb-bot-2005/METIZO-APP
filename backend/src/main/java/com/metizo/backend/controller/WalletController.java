package com.metizo.backend.controller;

import com.metizo.backend.dto.WalletDtos;
import com.metizo.backend.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/wallet")
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping
    public WalletDtos.BalanceResponse balance() {
        return walletService.getBalance();
    }

    /** Pay for something (ESCROW/SUBSCRIPTION/MARKETPLACE_ORDER) directly from the wallet balance. */
    @PostMapping("/pay")
    public WalletDtos.PayResponse pay(@RequestBody WalletDtos.PayRequest request) {
        return walletService.pay(request);
    }
}
