GRANT SELECT, INSERT, UPDATE ON invitations TO authenticated;
GRANT ALL ON invitations TO service_role;

DROP POLICY IF EXISTS "Publik bisa lihat invitation via token" ON invitations;

CREATE POLICY "Users can view their own invitations by email"
  ON invitations FOR SELECT
  USING (
    auth.email() = email
    OR
    auth.uid() IN (
      SELECT user_id FROM profiles
      WHERE role = 'admin'
    )
  );
