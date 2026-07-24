-- Tracks the Paystack transaction used to actually collect the held amount,
-- and when it was confirmed paid (escrow.status stays HELD purely as the
-- assignment/ledger state — paid_at is the real "money moved" signal).
ALTER TABLE escrow_transactions
    ADD COLUMN paystack_reference VARCHAR(255),
    ADD COLUMN paid_at TIMESTAMP;
