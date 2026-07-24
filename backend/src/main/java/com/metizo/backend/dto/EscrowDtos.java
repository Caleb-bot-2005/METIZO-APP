package com.metizo.backend.dto;

import com.metizo.backend.domain.EscrowStatus;
import com.metizo.backend.domain.EscrowTransaction;

import java.math.BigDecimal;
import java.time.Instant;

public class EscrowDtos {

    public record Response(
            Long id,
            Long serviceRequestId,
            Long customerId,
            Long artisanId,
            BigDecimal amount,
            BigDecimal commission,
            BigDecimal artisanPayout,
            EscrowStatus status,
            Instant createdAt,
            Instant settledAt,
            Instant paidAt
    ) {
        public static Response from(EscrowTransaction tx) {
            return new Response(
                    tx.getId(),
                    tx.getServiceRequest().getId(),
                    tx.getCustomer().getId(),
                    tx.getArtisan().getId(),
                    tx.getAmount(),
                    tx.getCommission(),
                    tx.getArtisanPayout(),
                    tx.getStatus(),
                    tx.getCreatedAt(),
                    tx.getSettledAt(),
                    tx.getPaidAt()
            );
        }
    }
}
