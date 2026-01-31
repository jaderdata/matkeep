-- Migration: Fix RLS Policies for Academy Admins and Students
-- Date: 2026-01-30
-- Status: CRITICAL FIX - Enable proper role-based access control

-- Drop existing overly restrictive policies
DROP POLICY IF EXISTS students_admin_select ON students;
DROP POLICY IF EXISTS students_admin_insert ON students;
DROP POLICY IF EXISTS students_admin_update ON students;
DROP POLICY IF EXISTS students_admin_delete ON students;
DROP POLICY IF EXISTS attendance_admin_select ON attendance;
DROP POLICY IF EXISTS attendance_admin_insert ON attendance;
DROP POLICY IF EXISTS student_documents_admin_select ON student_documents;
DROP POLICY IF EXISTS student_documents_admin_insert ON student_documents;
DROP POLICY IF EXISTS student_documents_admin_delete ON student_documents;
DROP POLICY IF EXISTS academies_admin_select ON academies;

-- ============================================================
-- STUDENTS POLICIES
-- ============================================================

-- Academy admins can SELECT their own academy's students
CREATE POLICY students_select_academy_admin
  ON students
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = students.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Academy admins can INSERT students in their academy
CREATE POLICY students_insert_academy_admin
  ON students
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = students.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Academy admins can UPDATE students in their academy
CREATE POLICY students_update_academy_admin
  ON students
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = students.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = students.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Academy admins can DELETE students in their academy
CREATE POLICY students_delete_academy_admin
  ON students
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = students.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- ============================================================
-- ATTENDANCE POLICIES
-- ============================================================

-- Academy admins can SELECT attendance in their academy
CREATE POLICY attendance_select_academy_admin
  ON attendance
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = attendance.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Academy admins and students can INSERT attendance
CREATE POLICY attendance_insert_academy_admin_or_student
  ON attendance
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = attendance.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
    OR true  -- Allow students to check in with their own attendance
  );

-- ============================================================
-- STUDENT_DOCUMENTS POLICIES
-- ============================================================

-- Academy admins can SELECT documents in their academy
CREATE POLICY student_documents_select_academy_admin
  ON student_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = student_documents.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Academy admins can INSERT documents in their academy
CREATE POLICY student_documents_insert_academy_admin
  ON student_documents
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = student_documents.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Academy admins can DELETE documents in their academy
CREATE POLICY student_documents_delete_academy_admin
  ON student_documents
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM academies
      WHERE academies.id = student_documents.academy_id
      AND academies.admin_email = auth.jwt() ->> 'email'
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- ============================================================
-- ACADEMIES POLICIES
-- ============================================================

-- Academy admins can SELECT their own academy
CREATE POLICY academies_select_admin
  ON academies
  FOR SELECT
  USING (
    admin_email = auth.jwt() ->> 'email'
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Master admins can UPDATE any academy
CREATE POLICY academies_update_master
  ON academies
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'master')
  WITH CHECK (auth.jwt() ->> 'role' = 'master');

-- ============================================================
-- AUDIT_LOGS POLICIES
-- ============================================================

-- Academy admins can SELECT logs from their academy
CREATE POLICY audit_logs_select_academy_admin
  ON audit_logs
  FOR SELECT
  USING (
    (
      EXISTS (
        SELECT 1 FROM academies
        WHERE academies.id = audit_logs.academy_id
        AND academies.admin_email = auth.jwt() ->> 'email'
      )
    )
    OR auth.jwt() ->> 'role' = 'master'
  );

-- Anyone authenticated can INSERT audit logs
CREATE POLICY audit_logs_insert_authenticated
  ON audit_logs
  FOR INSERT
  WITH CHECK (true);

COMMIT;
