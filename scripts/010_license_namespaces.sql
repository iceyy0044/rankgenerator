-- Namespaces let one license_keys pool serve multiple plugins/resources.
-- Existing rows all default to 'samsranks' (the original product), so nothing
-- that's already been generated or claimed changes behavior.
ALTER TABLE public.license_keys
  ADD COLUMN IF NOT EXISTS namespace TEXT NOT NULL DEFAULT 'samsranks';

CREATE INDEX IF NOT EXISTS idx_license_keys_namespace ON public.license_keys (namespace);
