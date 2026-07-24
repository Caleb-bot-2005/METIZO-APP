package com.metizo.backend.dto;

import java.math.BigDecimal;

public class PaystackDtos {

    /**
     * purpose = "ESCROW": pays the held amount for requestId (must belong to the
     * caller and not already be paid). purpose = "WALLET_TOPUP": tops up the
     * caller's wallet by amount (the wallet itself is tracked client-side only).
     * purpose = "MARKETPLACE_ORDER": pays for a materials-marketplace order by
     * amount — a direct charge, not an escrow hold, since there's no job to
     * release funds against (the order itself is tracked client-side only).
     * purpose = "SUBSCRIPTION": pays for a plan upgrade by amount — same
     * direct-charge shape as the two above (the plan itself is tracked
     * client-side only; there's no subscription/billing model server-side).
     */
    public record InitializeRequest(String purpose, Long requestId, BigDecimal amount) {}

    public record InitializeResponse(String authorizationUrl, String reference) {}

    public record VerifyRequest(String reference) {}

    public record VerifyResponse(boolean success, String purpose, Long requestId, BigDecimal amount) {}
}
