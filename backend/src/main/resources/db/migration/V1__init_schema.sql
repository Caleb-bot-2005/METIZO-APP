-- METIZO baseline schema. Mirrors com.metizo.backend.domain.* exactly — column
-- names/types/nullability must stay in sync with the entities, since
-- spring.jpa.hibernate.ddl-auto=validate fails startup on any drift.

-- ============================================================================
-- users — every account, both customers and artisans (role distinguishes them)
-- ============================================================================
CREATE TABLE users (
    id                          BIGSERIAL PRIMARY KEY,
    full_name                   VARCHAR(255) NOT NULL,
    email                       VARCHAR(255) NOT NULL,
    password                    VARCHAR(255) NOT NULL,
    phone                       VARCHAR(255),
    role                        VARCHAR(255) NOT NULL,               -- CUSTOMER | ARTISAN | ADMIN
    reset_code_hash             VARCHAR(255),
    reset_code_expires_at       TIMESTAMP,
    verification_code_hash      VARCHAR(255),
    verification_code_expires_at TIMESTAMP,
    email_verified              BOOLEAN NOT NULL DEFAULT FALSE,
    created_at                  TIMESTAMP,
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- ============================================================================
-- artisan_profiles — one-to-one extension of users for role=ARTISAN
-- ============================================================================
CREATE TABLE artisan_profiles (
    id                    BIGSERIAL PRIMARY KEY,
    user_id               BIGINT NOT NULL,
    category              VARCHAR(255),                              -- PLUMBER, ELECTRICIAN, ...
    bio                   VARCHAR(1000),
    location              VARCHAR(255),
    available             BOOLEAN NOT NULL DEFAULT TRUE,
    verified              BOOLEAN NOT NULL DEFAULT FALSE,
    jobs_completed        INTEGER NOT NULL DEFAULT 0,
    rating_count          INTEGER NOT NULL DEFAULT 0,
    rating_points_total   INTEGER NOT NULL DEFAULT 0,
    trust_score           DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT uq_artisan_profiles_user UNIQUE (user_id),
    CONSTRAINT fk_artisan_profiles_user FOREIGN KEY (user_id) REFERENCES users (id)
);

-- ============================================================================
-- service_requests — a customer's job posting
-- ============================================================================
CREATE TABLE service_requests (
    id                    BIGSERIAL PRIMARY KEY,
    customer_id           BIGINT NOT NULL,
    title                 VARCHAR(255) NOT NULL,
    description           VARCHAR(2000),
    category              VARCHAR(255),
    location              VARCHAR(255),
    budget                NUMERIC,
    emergency             BOOLEAN NOT NULL DEFAULT FALSE,
    status                VARCHAR(255) NOT NULL DEFAULT 'OPEN',       -- OPEN | ASSIGNED | IN_PROGRESS | COMPLETED | CANCELLED
    assigned_artisan_id   BIGINT,
    agreed_amount         NUMERIC,
    created_at            TIMESTAMP,
    CONSTRAINT fk_service_requests_customer FOREIGN KEY (customer_id) REFERENCES users (id),
    CONSTRAINT fk_service_requests_assigned_artisan FOREIGN KEY (assigned_artisan_id) REFERENCES users (id)
);

-- ============================================================================
-- bids — an artisan's offer on a service_request (one bid per artisan per job)
-- ============================================================================
CREATE TABLE bids (
    id                    BIGSERIAL PRIMARY KEY,
    service_request_id    BIGINT NOT NULL,
    artisan_id            BIGINT NOT NULL,
    amount                NUMERIC NOT NULL,
    estimated_time        VARCHAR(255),
    message               VARCHAR(1000),
    status                VARCHAR(255) NOT NULL DEFAULT 'PENDING',   -- PENDING | ACCEPTED | REJECTED | WITHDRAWN
    created_at            TIMESTAMP,
    CONSTRAINT uq_bids_request_artisan UNIQUE (service_request_id, artisan_id),
    CONSTRAINT fk_bids_service_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id),
    CONSTRAINT fk_bids_artisan FOREIGN KEY (artisan_id) REFERENCES users (id)
);

-- ============================================================================
-- work_photos — before/after proof photos an artisan uploads for a job
-- ============================================================================
CREATE TABLE work_photos (
    id                    BIGSERIAL PRIMARY KEY,
    service_request_id    BIGINT NOT NULL,
    uploaded_by           BIGINT NOT NULL,
    type                  VARCHAR(255) NOT NULL,                     -- BEFORE | AFTER
    stored_filename       VARCHAR(255) NOT NULL,
    original_filename     VARCHAR(255),
    content_type          VARCHAR(255),
    size                  BIGINT NOT NULL,
    created_at            TIMESTAMP,
    CONSTRAINT fk_work_photos_service_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id),
    CONSTRAINT fk_work_photos_uploaded_by FOREIGN KEY (uploaded_by) REFERENCES users (id)
);

-- ============================================================================
-- portfolio_photos — showcase photos on an artisan's public profile
-- ============================================================================
CREATE TABLE portfolio_photos (
    id                    BIGSERIAL PRIMARY KEY,
    artisan_profile_id    BIGINT NOT NULL,
    stored_filename       VARCHAR(255) NOT NULL,
    original_filename     VARCHAR(255),
    content_type          VARCHAR(255),
    size                  BIGINT NOT NULL,
    caption               VARCHAR(255),
    created_at            TIMESTAMP,
    CONSTRAINT fk_portfolio_photos_artisan_profile FOREIGN KEY (artisan_profile_id) REFERENCES artisan_profiles (id)
);

-- ============================================================================
-- notifications — in-app notifications (e.g. "new job near you")
-- ============================================================================
CREATE TABLE notifications (
    id                    BIGSERIAL PRIMARY KEY,
    recipient_id          BIGINT NOT NULL,
    category              VARCHAR(255) NOT NULL,                     -- BID | ARRIVAL | PAYMENT | JOB | EMERGENCY | PROMOTION
    title                 VARCHAR(255) NOT NULL,
    body                  VARCHAR(500) NOT NULL,
    related_request_id    BIGINT,
    read                  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMP,
    CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id)
);

-- ============================================================================
-- digital_contracts — signed scope-of-work agreement for an assigned job
-- ============================================================================
CREATE TABLE digital_contracts (
    id                    BIGSERIAL PRIMARY KEY,
    service_request_id    BIGINT NOT NULL,
    customer_id           BIGINT NOT NULL,
    artisan_id            BIGINT NOT NULL,
    scope_of_work         VARCHAR(4000) NOT NULL,
    terms                 VARCHAR(4000),
    agreed_amount         NUMERIC NOT NULL,
    status                VARCHAR(255) NOT NULL DEFAULT 'DRAFT',     -- DRAFT | SIGNED | VOID
    customer_signed_at    TIMESTAMP,
    artisan_signed_at     TIMESTAMP,
    created_at            TIMESTAMP,
    CONSTRAINT uq_digital_contracts_service_request UNIQUE (service_request_id),
    CONSTRAINT fk_digital_contracts_service_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id),
    CONSTRAINT fk_digital_contracts_customer FOREIGN KEY (customer_id) REFERENCES users (id),
    CONSTRAINT fk_digital_contracts_artisan FOREIGN KEY (artisan_id) REFERENCES users (id)
);

-- ============================================================================
-- escrow_transactions — held/released/refunded funds for an assigned job
-- ============================================================================
CREATE TABLE escrow_transactions (
    id                    BIGSERIAL PRIMARY KEY,
    service_request_id    BIGINT NOT NULL,
    customer_id           BIGINT NOT NULL,
    artisan_id            BIGINT NOT NULL,
    amount                NUMERIC NOT NULL,
    commission            NUMERIC,
    artisan_payout        NUMERIC,
    status                VARCHAR(255) NOT NULL DEFAULT 'HELD',      -- HELD | RELEASED | REFUNDED
    created_at            TIMESTAMP,
    settled_at            TIMESTAMP,
    CONSTRAINT uq_escrow_transactions_service_request UNIQUE (service_request_id),
    CONSTRAINT fk_escrow_transactions_service_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id),
    CONSTRAINT fk_escrow_transactions_customer FOREIGN KEY (customer_id) REFERENCES users (id),
    CONSTRAINT fk_escrow_transactions_artisan FOREIGN KEY (artisan_id) REFERENCES users (id)
);

-- ============================================================================
-- reviews — a customer's 1-5 star review of a completed job
-- ============================================================================
CREATE TABLE reviews (
    id                    BIGSERIAL PRIMARY KEY,
    service_request_id    BIGINT NOT NULL,
    customer_id           BIGINT NOT NULL,
    artisan_id            BIGINT NOT NULL,
    rating                INTEGER NOT NULL,
    comment               VARCHAR(1000),
    created_at            TIMESTAMP,
    CONSTRAINT uq_reviews_service_request UNIQUE (service_request_id),
    CONSTRAINT fk_reviews_service_request FOREIGN KEY (service_request_id) REFERENCES service_requests (id),
    CONSTRAINT fk_reviews_customer FOREIGN KEY (customer_id) REFERENCES users (id),
    CONSTRAINT fk_reviews_artisan FOREIGN KEY (artisan_id) REFERENCES users (id)
);

-- ============================================================================
-- Indexes — Postgres does not auto-index foreign key columns, and these match
-- the actual query patterns in ArtisanProfileRepository, ServiceRequestRepository,
-- BidRepository, WorkPhotoRepository, PortfolioPhotoRepository, NotificationRepository.
-- ============================================================================
CREATE INDEX idx_artisan_profiles_category_available ON artisan_profiles (category, available);
CREATE INDEX idx_artisan_profiles_trust_score ON artisan_profiles (trust_score DESC);

CREATE INDEX idx_service_requests_status_created ON service_requests (status, created_at DESC);
CREATE INDEX idx_service_requests_category_status ON service_requests (category, status);
CREATE INDEX idx_service_requests_customer ON service_requests (customer_id, created_at DESC);
CREATE INDEX idx_service_requests_assigned_artisan ON service_requests (assigned_artisan_id, created_at DESC);

CREATE INDEX idx_bids_artisan ON bids (artisan_id);

CREATE INDEX idx_work_photos_service_request ON work_photos (service_request_id, created_at);

CREATE INDEX idx_portfolio_photos_artisan_profile ON portfolio_photos (artisan_profile_id, created_at DESC);

CREATE INDEX idx_notifications_recipient_created ON notifications (recipient_id, created_at DESC);
CREATE INDEX idx_notifications_recipient_unread ON notifications (recipient_id) WHERE read = FALSE;

CREATE INDEX idx_reviews_artisan ON reviews (artisan_id);
