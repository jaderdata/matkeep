-- Migration: Create base schema for MatKeep
-- Date: 2026-01-30
-- Status: MUST RUN FIRST - Creates foundational tables

-- Step 1: Create academies table
CREATE TABLE IF NOT EXISTS academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admin_email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create students table with all base fields
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  internal_id TEXT,
  card_pass_code TEXT,
  belt_level TEXT DEFAULT 'White',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Add unique constraints on students
ALTER TABLE students
ADD CONSTRAINT unique_academy_email UNIQUE(academy_id, email);

ALTER TABLE students
ADD CONSTRAINT unique_academy_internal_id UNIQUE(academy_id, internal_id);

ALTER TABLE students
ADD CONSTRAINT unique_academy_card_pass UNIQUE(academy_id, card_pass_code);

-- Step 4: Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_method TEXT DEFAULT 'card',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Create student_documents table
CREATE TABLE IF NOT EXISTS student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_type TEXT,
  description TEXT,
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 6: Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID REFERENCES academies(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_students_academy_id ON students(academy_id);
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_internal_id ON students(internal_id);
CREATE INDEX IF NOT EXISTS idx_students_card_pass_code ON students(card_pass_code);
CREATE INDEX IF NOT EXISTS idx_attendance_academy_id ON attendance(academy_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_check_in_time ON attendance(check_in_time DESC);
CREATE INDEX IF NOT EXISTS idx_student_documents_academy_id ON student_documents(academy_id);
CREATE INDEX IF NOT EXISTS idx_student_documents_student_id ON student_documents(student_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_academy_id ON audit_logs(academy_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Step 8: Enable RLS
ALTER TABLE academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Step 9: Create RLS policies for academies (simplified - Master only for MVP)
CREATE POLICY academies_admin_select 
  ON academies 
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'master');

-- Step 10: Create RLS policies for students (simplified)
CREATE POLICY students_admin_select 
  ON students 
  FOR SELECT 
  USING (
    auth.jwt() ->> 'role' = 'master'
  );

CREATE POLICY students_admin_insert 
  ON students 
  FOR INSERT 
  WITH CHECK (
    auth.jwt() ->> 'role' = 'master'
  );

CREATE POLICY students_admin_update 
  ON students 
  FOR UPDATE 
  USING (auth.jwt() ->> 'role' = 'master')
  WITH CHECK (auth.jwt() ->> 'role' = 'master');

CREATE POLICY students_admin_delete 
  ON students 
  FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'master');

-- Step 11: Create RLS policies for attendance
CREATE POLICY attendance_admin_select 
  ON attendance 
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'master');

CREATE POLICY attendance_admin_insert 
  ON attendance 
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'master');

-- Step 12: Create RLS policies for student_documents
CREATE POLICY student_documents_admin_select 
  ON student_documents 
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'master');

CREATE POLICY student_documents_admin_insert 
  ON student_documents 
  FOR INSERT 
  WITH CHECK (auth.jwt() ->> 'role' = 'master');

CREATE POLICY student_documents_admin_delete 
  ON student_documents 
  FOR DELETE 
  USING (auth.jwt() ->> 'role' = 'master');

-- Step 13: Create RLS policies for audit_logs
CREATE POLICY audit_logs_admin_select 
  ON audit_logs 
  FOR SELECT 
  USING (auth.jwt() ->> 'role' = 'master');

CREATE POLICY audit_logs_insert 
  ON audit_logs 
  FOR INSERT 
  WITH CHECK (true);

COMMIT;
