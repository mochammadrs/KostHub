-- Grant specific permissions based on Supabase error hints
-- Run this in Supabase Dashboard SQL Editor

GRANT SELECT, UPDATE ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bills TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tickets TO service_role;
GRANT SELECT, INSERT, DELETE ON public.announcements TO service_role;
GRANT SELECT ON public.tenants TO service_role;

-- Grant sequence permissions for auto-increment IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Also grant to authenticated role for app operations
GRANT INSERT, UPDATE ON public.tickets TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.bills TO authenticated;
GRANT INSERT, DELETE ON public.announcements TO authenticated;
