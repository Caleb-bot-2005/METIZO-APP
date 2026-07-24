package com.metizo.backend.service;

import com.metizo.backend.domain.EscrowTransaction;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.dto.WalletDtos.BalanceResponse;
import com.metizo.backend.dto.WalletDtos.PayRequest;
import com.metizo.backend.dto.WalletDtos.PayResponse;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.EscrowTransactionRepository;
import com.metizo.backend.repository.UserRepository;
import com.metizo.backend.security.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Pay for something directly from the wallet balance instead of a fresh
 * Paystack checkout — an alternative to PaystackController for the same set
 * of purposes (minus WALLET_TOPUP, which funds the wallet in the first
 * place). Unlike Paystack, this settles synchronously: no hosted checkout
 * page or redirect, just an immediate balance check and debit.
 */
@Service
@RequiredArgsConstructor
public class WalletService {

    private final UserRepository userRepository;
    private final EscrowTransactionRepository escrowRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public BalanceResponse getBalance() {
        return new BalanceResponse(currentUserService.require().getWalletBalance());
    }

    @Transactional
    public PayResponse pay(PayRequest request) {
        User user = currentUserService.require();
        BigDecimal amount;

        if ("ESCROW".equals(request.purpose())) {
            if (request.requestId() == null) {
                throw new BadRequestException("requestId is required for ESCROW payments");
            }
            EscrowTransaction tx = escrowRepository.findByServiceRequestId(request.requestId())
                    .orElseThrow(() -> new ResourceNotFoundException("No escrow for request " + request.requestId()));
            ServiceRequest sr = tx.getServiceRequest();
            if (!sr.getCustomer().getId().equals(user.getId())) {
                throw new BadRequestException("Only the owning customer can pay this escrow");
            }
            if (tx.getPaidAt() != null) {
                throw new BadRequestException("This job has already been paid for");
            }
            amount = tx.getAmount();
            debit(user, amount);
            tx.setPaidAt(Instant.now());
        } else if ("SUBSCRIPTION".equals(request.purpose()) || "MARKETPLACE_ORDER".equals(request.purpose())) {
            if (request.amount() == null || request.amount().signum() <= 0) {
                throw new BadRequestException("A positive amount is required");
            }
            amount = request.amount();
            debit(user, amount);
        } else {
            throw new BadRequestException("Unsupported wallet payment purpose: " + request.purpose());
        }

        userRepository.save(user);
        return new PayResponse(amount, user.getWalletBalance());
    }

    private void debit(User user, BigDecimal amount) {
        if (user.getWalletBalance().compareTo(amount) < 0) {
            throw new BadRequestException("Insufficient wallet balance");
        }
        user.setWalletBalance(user.getWalletBalance().subtract(amount));
    }
}
