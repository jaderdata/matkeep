-- Create audit_logs table for tracking system activities
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id TEXT NOT NULL REFERENCES academies(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_academy_id ON audit_logs(academy_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view audit logs for their academy
CREATE POLICY "Users can view their academy audit logs"
  ON audit_logs
  FOR SELECT
  USING (
    academy_id IN (
      SELECT id FROM academies 
      WHERE admin_email = auth.jwt() ->> 'email'
    )
    OR 
    (auth.jwt() ->> 'email') = 'jader_dourado@hotmail.com' -- Master can see all
  );

-- Policy: Users can insert audit logs for their academy
CREATE POLICY "Users can insert audit logs for their academy"
  ON audit_logs
  FOR INSERT
  WITH CHECK (
    academy_id IN (
      SELECT id FROM academies 
      WHERE admin_email = auth.jwt() ->> 'email'
    )
    OR 
    (auth.jwt() ->> 'email') = 'jader_dourado@hotmail.com' -- Master can insert all
  );

-- Add comment
COMMENT ON TABLE audit_logs IS 'Stores audit trail of system activities for compliance and monitoring';
