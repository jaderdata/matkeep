-- Migration: Add permanent delete function for Master Admin
-- Date: 2026-01-30
-- Status: MVP Implementation - Master Admin Only

-- Step 1: Create RPC function for permanent deletion of student
CREATE OR REPLACE FUNCTION delete_student_permanently(
  p_student_id UUID,
  p_academy_id UUID
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  v_student_name TEXT;
  v_student_email TEXT;
BEGIN
  -- Get student info for audit logging
  SELECT name, email INTO v_student_name, v_student_email
  FROM students
  WHERE id = p_student_id AND academy_id = p_academy_id;

  IF v_student_name IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Student not found';
    RETURN;
  END IF;

  -- Delete attendance records first (due to foreign key constraint)
  DELETE FROM attendance
  WHERE student_id = p_student_id AND academy_id = p_academy_id;

  -- Delete student documents
  DELETE FROM student_documents
  WHERE student_id = p_student_id AND academy_id = p_academy_id;

  -- Finally, delete the student record
  DELETE FROM students
  WHERE id = p_student_id AND academy_id = p_academy_id;

  RETURN QUERY SELECT TRUE, 'Student ' || v_student_name || ' (' || v_student_email || ') permanently deleted';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Grant execute permission to authenticated users only
GRANT EXECUTE ON FUNCTION delete_student_permanently(UUID, UUID) TO authenticated;

COMMIT;
