package com.metizo.backend.domain;

/**
 * Lifecycle of a digital work contract.
 */
public enum ContractStatus {
    DRAFT,   // drafted, awaiting both signatures
    SIGNED,  // both customer and artisan have signed
    VOID     // cancelled before completion
}
