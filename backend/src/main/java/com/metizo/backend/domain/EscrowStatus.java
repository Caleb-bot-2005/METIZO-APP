package com.metizo.backend.domain;

public enum EscrowStatus {
    HELD,      // customer funds locked
    RELEASED,  // paid out to artisan after confirmation
    REFUNDED   // returned to customer on cancellation/dispute
}
