-- Tracks the first time a key is successfully verified via the plugin API
-- and bound to an IP, independent of the website's Discord-claim flow
-- (`used_by`). Lets a license be used purely as a bearer key by a
-- resource/plugin whose users never log into the website, while still
-- showing as "Used" in the admin panel.
ALTER TABLE public.license_keys ADD COLUMN IF NOT EXISTS first_verified_at TIMESTAMPTZ;
