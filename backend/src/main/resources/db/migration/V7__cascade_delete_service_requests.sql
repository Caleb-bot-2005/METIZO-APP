-- Lets a customer permanently delete a cancelled job request (see
-- ServiceRequestService.delete) and have everything under it go with it —
-- bids, uploaded photos, any draft contract, the (already-refunded) escrow
-- record, and emergency dispatch/offers — instead of either an FK violation
-- or the application having to know every dependent table by hand.
--
-- This schema was originally created by Hibernate's ddl-auto: update before
-- Flyway adopted it (see application.yml's baseline-on-migrate note), so the
-- live constraint names are Hibernate's auto-generated hashes, not the names
-- V1's CREATE TABLE script specifies — V1 was baselined, never actually run
-- here. Names below were read directly from information_schema on the real
-- database rather than assumed from V1.

ALTER TABLE bids DROP CONSTRAINT fkg1l8kwsphsnql2vyd313i8snr;
ALTER TABLE bids ADD CONSTRAINT fk_bids_service_request
    FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE;

ALTER TABLE work_photos DROP CONSTRAINT fki6hajb0oxvmiurta5ahde59mj;
ALTER TABLE work_photos ADD CONSTRAINT fk_work_photos_service_request
    FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE;

ALTER TABLE digital_contracts DROP CONSTRAINT fkporsttq0wfor2be42h45w112n;
ALTER TABLE digital_contracts ADD CONSTRAINT fk_digital_contracts_service_request
    FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE;

ALTER TABLE escrow_transactions DROP CONSTRAINT fkt96wtt71m5ope36mb7qyo7mfg;
ALTER TABLE escrow_transactions ADD CONSTRAINT fk_escrow_transactions_service_request
    FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE;

ALTER TABLE reviews DROP CONSTRAINT fktiq8oko7maqq8sgfe1ud1m4hh;
ALTER TABLE reviews ADD CONSTRAINT fk_reviews_service_request
    FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE;

ALTER TABLE emergency_dispatches DROP CONSTRAINT emergency_dispatches_service_request_id_fkey;
ALTER TABLE emergency_dispatches ADD CONSTRAINT fk_emergency_dispatches_service_request
    FOREIGN KEY (service_request_id) REFERENCES service_requests (id) ON DELETE CASCADE;

ALTER TABLE dispatch_offers DROP CONSTRAINT dispatch_offers_dispatch_id_fkey;
ALTER TABLE dispatch_offers ADD CONSTRAINT fk_dispatch_offers_dispatch
    FOREIGN KEY (dispatch_id) REFERENCES emergency_dispatches (id) ON DELETE CASCADE;
