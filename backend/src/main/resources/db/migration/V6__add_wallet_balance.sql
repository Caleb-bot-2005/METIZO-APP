-- Real server-side wallet balance. Previously the wallet was tracked entirely
-- client-side (a local number bumped after a verified Paystack top-up) —
-- fine for topping up, but paying FROM the wallet needs the balance to be
-- authoritative server-side, or any client could "pay" for a real job with a
-- number it made up locally.
ALTER TABLE users
    ADD COLUMN wallet_balance NUMERIC NOT NULL DEFAULT 0;
