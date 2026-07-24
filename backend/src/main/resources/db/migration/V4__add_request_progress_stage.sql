-- Fine-grained work checkpoints (started / materials purchased / almost done /
-- done) shown on the customer's tracking screen, set by the assigned artisan.
ALTER TABLE service_requests
    ADD COLUMN progress_stage VARCHAR(255);
