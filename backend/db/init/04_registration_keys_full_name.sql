ALTER TABLE registration_keys
  ADD COLUMN IF NOT EXISTS full_name text;

UPDATE registration_keys
SET full_name = COALESCE(full_name, 'Unbenannt');

ALTER TABLE registration_keys
  ALTER COLUMN full_name SET NOT NULL;
