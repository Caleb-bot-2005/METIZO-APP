-- Lets an artisan's profile carry real coordinates (captured via "Use Current
-- Location" on their profile screen) so customers can be shown genuinely
-- nearby artisans instead of an arbitrary list. Nullable — older/unset
-- profiles just don't participate in distance sorting until set.
ALTER TABLE artisan_profiles
    ADD COLUMN latitude DOUBLE PRECISION,
    ADD COLUMN longitude DOUBLE PRECISION;
