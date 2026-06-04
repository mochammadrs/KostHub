-- 003_invitations.sql
-- Migration: Create invitations table for invite-only registration flow

CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  full_name   text NOT NULL,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant')),
  token       text NOT NULL UNIQUE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_by  uuid NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Pengelola bisa lihat invitation tenant-nya" ON invitations;
DROP POLICY IF EXISTS "Pengelola bisa buat invitation" ON invitations;

CREATE POLICY "Pengelola bisa lihat invitation tenant-nya"
  ON invitations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE tenant_id = invitations.tenant_id
        AND role = 'admin'
    )
  );

CREATE POLICY "Pengelola bisa buat invitation"
  ON invitations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE tenant_id = invitations.tenant_id
        AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Publik bisa lihat invitation via token" ON invitations;
CREATE POLICY "Publik bisa lihat invitation via token"
  ON invitations FOR SELECT
  USING (true);
