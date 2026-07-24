package com.metizo.backend.domain;

/** Lifecycle of an emergency dispatch — separate from RequestStatus, which takes over once ASSIGNED. */
public enum DispatchStatus {
    SEARCHING, ASSIGNED, FAILED, CANCELLED
}
