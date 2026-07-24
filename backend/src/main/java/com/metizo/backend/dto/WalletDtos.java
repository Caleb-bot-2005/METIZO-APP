package com.metizo.backend.dto;

import java.math.BigDecimal;

public class WalletDtos {

    public record BalanceResponse(BigDecimal balance) {}

    /**
     * purpose = "ESCROW": pays the held amount for requestId from the wallet.
     * purpose = "SUBSCRIPTION" / "MARKETPLACE_ORDER": pays amount from the
     * wallet — same shape as PaystackDtos.InitializeRequest, minus WALLET_TOPUP
     * (you can't top up the wallet from the wallet).
     */
    public record PayRequest(String purpose, Long requestId, BigDecimal amount) {}

    public record PayResponse(BigDecimal amountPaid, BigDecimal newBalance) {}
}
