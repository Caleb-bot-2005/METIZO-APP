package com.metizo.backend.domain;

/**
 * Fine-grained work checkpoints an artisan reports while a request is
 * IN_PROGRESS. Orthogonal to RequestStatus (which drives escrow/bidding) —
 * this is purely a visibility signal for the customer's tracking screen.
 * STARTED is set automatically when work begins; the rest are artisan-set.
 */
public enum ProgressStage {
    STARTED, MATERIALS_PURCHASED, ALMOST_DONE, DONE
}
