-- Real coordinates on a request — needed for emergency dispatch's proximity
-- matching (previously only a free-text location string existed).
ALTER TABLE service_requests
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;

-- One dispatch "session" per emergency service_request: tracks the current
-- round of simultaneous offers to the nearest available artisans.
CREATE TABLE emergency_dispatches (
    id                BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL UNIQUE REFERENCES service_requests(id),
    status            VARCHAR(255) NOT NULL,
    round             INT NOT NULL DEFAULT 1,
    round_started_at  TIMESTAMP NOT NULL,
    created_at        TIMESTAMP NOT NULL
);

-- One row per artisan offered a given round. First to reach ACCEPTED wins;
-- its siblings (still PENDING) get CANCELLED atomically in the same transaction.
CREATE TABLE dispatch_offers (
    id            BIGSERIAL PRIMARY KEY,
    dispatch_id   BIGINT NOT NULL REFERENCES emergency_dispatches(id),
    artisan_id    BIGINT NOT NULL REFERENCES users(id),
    round         INT NOT NULL,
    status        VARCHAR(255) NOT NULL,
    sent_at       TIMESTAMP NOT NULL,
    responded_at  TIMESTAMP
);

CREATE INDEX idx_dispatch_offers_dispatch ON dispatch_offers(dispatch_id);
CREATE INDEX idx_dispatch_offers_artisan_status ON dispatch_offers(artisan_id, status);
