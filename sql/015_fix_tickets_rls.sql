-- Fix RLS policy untuk tickets - allow tenant insert dengan tenant_id mereka sendiri
DROP POLICY IF EXISTS "Penghuni can create tickets" ON tickets;

CREATE POLICY "Penghuni can create tickets"
ON tickets
FOR INSERT
TO authenticated
WITH CHECK (
  -- User harus tenant dengan tenant_id valid
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role = 'tenant'
    AND profiles.tenant_id IS NOT NULL
    -- Ticket yang dibuat harus punya tenant_id = tenant_id si user
    AND profiles.tenant_id = tickets.tenant_id
  )
);
