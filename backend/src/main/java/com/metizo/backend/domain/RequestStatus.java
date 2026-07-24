package com.metizo.backend.domain;

/**
 * Lifecycle of a customer's service request.
 */
public enum RequestStatus {
    OPEN,        // accepting bids
    ASSIGNED,    // a bid was accepted, funds held in escrow
    IN_PROGRESS, // artisan started the work
    COMPLETED,   // customer confirmed, escrow released
    CANCELLED
}
