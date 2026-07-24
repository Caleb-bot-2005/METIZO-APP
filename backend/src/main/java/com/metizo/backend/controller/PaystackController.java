package com.metizo.backend.controller;

import com.metizo.backend.domain.EscrowTransaction;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.PaystackDtos;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.EscrowTransactionRepository;
import com.metizo.backend.repository.UserRepository;
import com.metizo.backend.security.CurrentUserService;
import com.metizo.backend.service.PaystackService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Real money movement, via Paystack's hosted checkout: the app opens the
 * returned authorizationUrl in a WebView, then calls /verify once Paystack
 * redirects back. Card/mobile money/bank channel choice happens on Paystack's
 * own page — this backend never sees card details.
 */
@RestController
@RequestMapping("/api/payments/paystack")
@RequiredArgsConstructor
public class PaystackController {

    private final PaystackService paystackService;
    private final EscrowTransactionRepository escrowRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;

    @Value("${metizo.paystack.callback-url}")
    private String callbackUrl;

    @PostMapping("/initialize")
    @Transactional
    public PaystackDtos.InitializeResponse initialize(@RequestBody PaystackDtos.InitializeRequest request) {
        User user = currentUserService.require();
        BigDecimal amount;
        String reference;

        if ("ESCROW".equals(request.purpose())) {
            if (request.requestId() == null) {
                throw new BadRequestException("requestId is required for ESCROW payments");
            }
            EscrowTransaction tx = escrowRepository.findByServiceRequestId(request.requestId())
                    .orElseThrow(() -> new ResourceNotFoundException("No escrow for request " + request.requestId()));
            if (!tx.getCustomer().getId().equals(user.getId())) {
                throw new BadRequestException("Only the owning customer can pay this escrow");
            }
            if (tx.getPaidAt() != null) {
                throw new BadRequestException("This job has already been paid for");
            }
            amount = tx.getAmount();
            reference = "escrow-" + tx.getServiceRequest().getId() + "-" + System.currentTimeMillis();
            tx.setPaystackReference(reference);
        } else if ("WALLET_TOPUP".equals(request.purpose())) {
            if (request.amount() == null || request.amount().signum() <= 0) {
                throw new BadRequestException("A positive amount is required for wallet top-ups");
            }
            amount = request.amount();
            reference = "wallet-" + user.getId() + "-" + System.currentTimeMillis();
        } else if ("MARKETPLACE_ORDER".equals(request.purpose())) {
            if (request.amount() == null || request.amount().signum() <= 0) {
                throw new BadRequestException("A positive amount is required for marketplace orders");
            }
            amount = request.amount();
            reference = "marketplace-" + user.getId() + "-" + System.currentTimeMillis();
        } else if ("SUBSCRIPTION".equals(request.purpose())) {
            if (request.amount() == null || request.amount().signum() <= 0) {
                throw new BadRequestException("A positive amount is required for subscription payments");
            }
            amount = request.amount();
            reference = "subscription-" + user.getId() + "-" + System.currentTimeMillis();
        } else {
            throw new BadRequestException("Unknown payment purpose: " + request.purpose());
        }

        PaystackService.InitResult result = paystackService.initializeTransaction(user.getEmail(), amount, reference, callbackUrl);
        return new PaystackDtos.InitializeResponse(result.authorizationUrl(), result.reference());
    }

    @PostMapping("/verify")
    @Transactional
    public PaystackDtos.VerifyResponse verify(@RequestBody PaystackDtos.VerifyRequest request) {
        User user = currentUserService.require();
        String reference = request.reference();
        PaystackService.VerifyResult result = paystackService.verifyTransaction(reference);
        if (!result.success()) {
            throw new BadRequestException("Payment was not successful (status: " + result.status() + ")");
        }
        BigDecimal amountPaid = BigDecimal.valueOf(result.amountMinorUnits()).divide(BigDecimal.valueOf(100));

        if (reference.startsWith("escrow-")) {
            EscrowTransaction tx = escrowRepository.findByPaystackReference(reference)
                    .orElseThrow(() -> new ResourceNotFoundException("No escrow found for reference " + reference));
            if (!tx.getCustomer().getId().equals(user.getId())) {
                throw new BadRequestException("This payment does not belong to you");
            }
            if (tx.getPaidAt() == null) {
                tx.setPaidAt(Instant.now());
            }
            return new PaystackDtos.VerifyResponse(true, "ESCROW", tx.getServiceRequest().getId(), amountPaid);
        }
        if (reference.startsWith("wallet-")) {
            user.setWalletBalance(user.getWalletBalance().add(amountPaid));
            userRepository.save(user);
            return new PaystackDtos.VerifyResponse(true, "WALLET_TOPUP", null, amountPaid);
        }
        if (reference.startsWith("marketplace-")) {
            return new PaystackDtos.VerifyResponse(true, "MARKETPLACE_ORDER", null, amountPaid);
        }
        if (reference.startsWith("subscription-")) {
            return new PaystackDtos.VerifyResponse(true, "SUBSCRIPTION", null, amountPaid);
        }
        throw new BadRequestException("Unrecognized payment reference");
    }
}
