-- Verification Queries for MatKeep Migrations
-- Run each query in Supabase Console to verify successful application

-- ============================================================
-- TEST 1: Verify base schema (Migration 000)
-- ============================================================

-- Check if all base tables exist
SELECT 
  table_name,
  CASE 
    WHEN table_name = 'academies' THEN 'Tables created: academies'
    WHEN table_name = 'students' THEN 'Tables created: students'
    WHEN table_name = 'attendance' THEN 'Tables created: attendance'
    WHEN table_name = 'student_documents' THEN 'Tables created: student_documents'
    WHEN table_name = 'audit_logs' THEN 'Tables created: audit_logs'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('academies', 'students', 'attendance', 'student_documents', 'audit_logs')
ORDER BY table_name;

-- Expected output: 5 rows (all 5 tables should exist)

-- ============================================================
-- TEST 2: Verify new columns in students table (Migration 001)
-- ============================================================

SELECT 
  column_name,
  data_type,
  is_nullable,
  CASE 
    WHEN column_name = 'phone_e164' THEN '✅ phone_e164 added'
    WHEN column_name = 'full_name_normalized' THEN '✅ full_name_normalized added'
    WHEN column_name = 'must_change_password' THEN '✅ must_change_password added'
    WHEN column_name = 'temp_password_expires_at' THEN '✅ temp_password_expires_at added'
    WHEN column_name = 'archived_at' THEN '✅ archived_at added'
  END as status
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name IN ('phone_e164', 'full_name_normalized', 'must_change_password', 'temp_password_expires_at', 'archived_at')
ORDER BY column_name;

-- Expected output: 5 rows (all 5 new columns should exist)

-- ============================================================
-- TEST 3: Verify UNIQUE constraint
-- ============================================================

SELECT 
  constraint_name,
  constraint_type,
  CASE 
    WHEN constraint_name = 'unique_academy_phone_fullname' THEN '✅ UNIQUE constraint created'
  END as status
FROM information_schema.table_constraints
WHERE table_name = 'students'
  AND constraint_name = 'unique_academy_phone_fullname';

-- Expected output: 1 row (constraint should exist)

-- ============================================================
-- TEST 4: Verify password_reset_audit table
-- ============================================================

SELECT 
  COUNT(*) as column_count,
  CASE 
    WHEN COUNT(*) = 7 THEN '✅ password_reset_audit table created with all columns'
    ELSE '❌ password_reset_audit missing columns'
  END as status
FROM information_schema.columns
WHERE table_name = 'password_reset_audit'
  AND column_name IN ('id', 'academy_id', 'student_id', 'admin_id', 'reset_at', 'method', 'created_at');

-- Expected output: 1 row with column_count = 7

-- ============================================================
-- TEST 5: Verify indexes created
-- ============================================================

SELECT 
  indexname,
  tablename,
  CASE 
    WHEN indexname LIKE 'idx_%' THEN '✅ Index: ' || indexname
  END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'idx_students_phone_e164',
    'idx_students_full_name_normalized',
    'idx_students_archived_at',
    'idx_students_must_change_password',
    'idx_password_reset_audit_academy_id',
    'idx_password_reset_audit_student_id',
    'idx_password_reset_audit_reset_at'
  )
ORDER BY indexname;

-- Expected output: 7 rows (all indexes should exist)

-- ============================================================
-- TEST 6: Verify RLS policies
-- ============================================================

SELECT 
  policyname,
  tablename,
  CASE 
    WHEN policyname LIKE '%select%' THEN '✅ SELECT policy: ' || policyname
    WHEN policyname LIKE '%insert%' THEN '✅ INSERT policy: ' || policyname
    WHEN policyname LIKE '%update%' THEN '✅ UPDATE policy: ' || policyname
    WHEN policyname LIKE '%delete%' THEN '✅ DELETE policy: ' || policyname
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('students', 'attendance', 'student_documents', 'audit_logs', 'password_reset_audit')
ORDER BY tablename, policyname;

-- Expected output: Multiple rows showing all RLS policies created

-- ============================================================
-- TEST 7: Verify helper functions
-- ============================================================

SELECT 
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name = 'archive_student' THEN '✅ archive_student() function created'
    WHEN routine_name = 'reset_student_password' THEN '✅ reset_student_password() function created'
    WHEN routine_name = 'delete_student_permanently' THEN '✅ delete_student_permanently() function created'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('archive_student', 'reset_student_password', 'delete_student_permanently')
ORDER BY routine_name;

-- Expected output: 2-3 rows (archive_student and reset_student_password from migration 001, delete_student_permanently from migration 002)

-- ============================================================
-- TEST 8: Summary - Count total items
-- ============================================================

SELECT 
  'Base Tables' as item,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('academies', 'students', 'attendance', 'student_documents', 'audit_logs', 'password_reset_audit')

UNION ALL

SELECT 
  'New Student Columns' as item,
  COUNT(*) as count
FROM information_schema.columns
WHERE table_name = 'students'
  AND column_name IN ('phone_e164', 'full_name_normalized', 'must_change_password', 'temp_password_expires_at', 'archived_at')

UNION ALL

SELECT 
  'Performance Indexes' as item,
  COUNT(*) as count
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'

UNION ALL

SELECT 
  'RLS Policies' as item,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'Helper Functions' as item,
  COUNT(*) as count
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('archive_student', 'reset_student_password', 'delete_student_permanently');

-- Expected output: 5 rows with counts
-- Base Tables: 6
-- New Student Columns: 5
-- Performance Indexes: 7+
-- RLS Policies: 10+
-- Helper Functions: 2-3
