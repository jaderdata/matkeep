-- Migration: Add phone_e164, full_name_normalized, password reset, and soft delete fields to students
-- Date: 2026-01-30
-- Status: MVP Implementation

-- Step 1: Add new columns to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS phone_e164 TEXT,
ADD COLUMN IF NOT EXISTS full_name_normalized TEXT,
ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS temp_password_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- Step 2: Create unique constraint on (academy_id, phone_e164, full_name_normalized)
-- First, we need to populate these fields from existing data for backward compatibility
UPDATE students 
SET 
  phone_e164 = CASE 
    WHEN phone IS NOT NULL AND phone != '' THEN '+55' || regexp_replace(phone, '\D', '', 'g')
    ELSE NULL
  END,
  full_name_normalized = CASE
    WHEN name IS NOT NULL AND name != '' THEN 
      lower(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(name, '[áàâãä]', 'a', 'g'),
              '[éèêë]', 'e', 'g'
            ),
            '[íìîï]', 'i', 'g'
          ),
          '[óòôõö]', 'o', 'g'
        )
      )
    ELSE NULL
  END
WHERE phone_e164 IS NULL OR full_name_normalized IS NULL;

-- Step 3: Add NOT NULL constraints after population (adjust as needed based on data)
-- ALTER TABLE students ALTER COLUMN phone_e164 SET NOT NULL;
-- ALTER TABLE students ALTER COLUMN full_name_normalized SET NOT NULL;

-- Step 4: Add unique constraint (safe: only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_academy_phone_fullname'
  ) THEN
    EXECUTE 'ALTER TABLE students ADD CONSTRAINT unique_academy_phone_fullname UNIQUE (academy_id, phone_e164, full_name_normalized) DEFERRABLE INITIALLY DEFERRED';
  END IF;
END;
$$;

-- Step 5: Create password_reset_audit table
CREATE TABLE IF NOT EXISTS password_reset_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  admin_id TEXT NOT NULL, -- Email of admin who reset
  reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  method TEXT NOT NULL DEFAULT 'desk_reset',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 6: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_password_reset_audit_academy_id 
  ON password_reset_audit(academy_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_audit_student_id 
  ON password_reset_audit(student_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_audit_reset_at 
  ON password_reset_audit(reset_at DESC);

CREATE INDEX IF NOT EXISTS idx_students_phone_e164 
  ON students(phone_e164);

CREATE INDEX IF NOT EXISTS idx_students_full_name_normalized 
  ON students(full_name_normalized);

CREATE INDEX IF NOT EXISTS idx_students_archived_at 
  ON students(archived_at) WHERE archived_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_students_must_change_password 
  ON students(must_change_password) WHERE must_change_password = TRUE;

-- Step 7: Enable RLS on password_reset_audit table
ALTER TABLE password_reset_audit ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies for password_reset_audit (Master Admin only for MVP)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_reset_audit' AND policyname = 'password_reset_audit_master_select'
  ) THEN
    EXECUTE 'CREATE POLICY password_reset_audit_master_select ON password_reset_audit FOR SELECT USING (auth.jwt() ->> ''role'' = ''master'')';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'password_reset_audit' AND policyname = 'password_reset_audit_master_insert'
  ) THEN
    EXECUTE 'CREATE POLICY password_reset_audit_master_insert ON password_reset_audit FOR INSERT WITH CHECK (auth.jwt() ->> ''role'' = ''master'')';
  END IF;
END;
$$;

-- Step 9: Create helper function for archiving students
CREATE OR REPLACE FUNCTION archive_student(
  p_student_id UUID,
  p_academy_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE students 
  SET 
    status = 'Inactive'::text,
    archived_at = NOW()
  WHERE id = p_student_id AND academy_id = p_academy_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 10: Create helper function for password reset
CREATE OR REPLACE FUNCTION reset_student_password(
  p_student_id UUID,
  p_academy_id UUID,
  p_admin_email TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_default_password TEXT := '123456';
BEGIN
  -- Update student password and set temporary flags
  UPDATE students 
  SET 
    password = v_default_password,
    must_change_password = TRUE,
    temp_password_expires_at = NOW() + INTERVAL '24 hours'
  WHERE id = p_student_id AND academy_id = p_academy_id;

  -- Note: In MVP, we log this in audit_logs via application layer
  -- password_reset_audit is handled by the backend service

  RETURN QUERY SELECT TRUE, 'Password reset successfully. Default password: ' || v_default_password;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 11: Create RLS policy for archived students (cannot check in)
-- This is enforced at application level in attendanceService.ts

COMMIT;
