package com.metizo.backend.service;

import com.metizo.backend.domain.EscrowStatus;
import com.metizo.backend.domain.EscrowTransaction;
import com.metizo.backend.domain.ServiceRequest;
import com.metizo.backend.domain.User;
import com.metizo.backend.exception.BadRequestException;
import com.metizo.backend.exception.ResourceNotFoundException;
import com.metizo.backend.repository.EscrowTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;

/**
 * Simulated escrow ledger. In a real deployment, holds/releases would be wired
 * to a payment provider (e.g. Paystack, Stripe). Here we just record state.
 */
@Service
@RequiredArgsConstructor
public class EscrowService {

    private final EscrowTransactionRepository escrowRepository;

    @Value("${metizo.escrow.commission-rate}")
    private BigDecimal commissionRate;

    /** Lock the agreed amount from the customer when a bid is accepted. */
    @Transactional
    public EscrowTransaction hold(ServiceRequest request, User artisan, BigDecimal amount) {
        EscrowTransaction tx = EscrowTransaction.builder()
                .serviceRequest(request)
                .customer(request.getCustomer())
                .artisan(artisan)
                .amount(amount)
                .status(EscrowStatus.HELD)
                .build();
        return escrowRepository.save(tx);
    }

    /** Release held funds to the artisan, deducting platform commission. */
    @Transactional
    public EscrowTransaction release(Long serviceRequestId) {
        EscrowTransaction tx = escrowRepository.findByServiceRequestId(serviceRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("No escrow for request " + serviceRequestId));
        if (tx.getStatus() != EscrowStatus.HELD) {
            throw new BadRequestException("Escrow is not in HELD state");
        }

        BigDecimal commission = tx.getAmount().multiply(commissionRate).setScale(2, RoundingMode.HALF_UP);
        tx.setCommission(commission);
        tx.setArtisanPayout(tx.getAmount().subtract(commission));
        tx.setStatus(EscrowStatus.RELEASED);
        tx.setSettledAt(Instant.now());
        return tx;
    }

    /** Refund held funds back to the customer (e.g. on cancellation). */
    @Transactional
    public EscrowTransaction refund(Long serviceRequestId) {
        EscrowTransaction tx = escrowRepository.findByServiceRequestId(serviceRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("No escrow for request " + serviceRequestId));
        if (tx.getStatus() != EscrowStatus.HELD) {
            throw new BadRequestException("Escrow is not in HELD state");
        }
        tx.setStatus(EscrowStatus.REFUNDED);
        tx.setSettledAt(Instant.now());
        return tx;
    }

    @Transactional(readOnly = true)
    public EscrowTransaction getByRequest(Long serviceRequestId) {
        return escrowRepository.findByServiceRequestId(serviceRequestId)
                .orElseThrow(() -> new ResourceNotFoundException("No escrow for request " + serviceRequestId));
    }

    /**
     * Removes an escrow hold that was never actually paid (emergency dispatch's
     * "find another artisan" flow un-assigns before the customer pays). Refuses
     * to touch anything once real money has been collected via Paystack.
     */
    @Transactional
    public void dropUnpaidHold(Long serviceRequestId) {
        escrowRepository.findByServiceRequestId(serviceRequestId).ifPresent(tx -> {
            if (tx.getPaidAt() != null) {
                throw new BadRequestException("Cannot drop an escrow hold that has already been paid");
            }
            escrowRepository.delete(tx);
        });
    }
}
