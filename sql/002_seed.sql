-- Seed tenant
insert into tenants (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Kost Ibu Sari');

-- Note: Auth users must be created via Supabase dashboard or signup first.
-- Then insert profile rows manually with the correct user_id.
-- Example profile inserts (run after creating users):
-- insert into profiles (user_id, email, full_name, role, tenant_id)
-- values ('<auth-user-id>', 'admin@kosthub.com', 'Admin KostHub', 'admin', null);
-- insert into profiles (user_id, email, full_name, role, tenant_id)
-- values ('<auth-user-id>', 'penghuni@kosthub.com', 'Andi Penghuni', 'tenant', '00000000-0000-0000-0000-000000000001');
