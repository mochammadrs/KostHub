-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ============================
-- TABLES
-- ============================

create table tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('tenant', 'admin')) default 'tenant',
  tenant_id uuid references tenants(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bills (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  amount numeric not null,
  due_date date not null,
  status text not null check (status in ('pending', 'paid', 'overdue')) default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table tickets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  title text not null,
  description text,
  category text,
  status text not null check (status in ('menunggu', 'diproses', 'selesai')) default 'menunggu',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- ============================
-- ROW LEVEL SECURITY
-- ============================

-- Helper: admin check
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from profiles
    where profiles.user_id = auth.uid()
    and profiles.role = 'admin'
  );
$$;

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table tenants enable row level security;
alter table bills enable row level security;
alter table tickets enable row level security;
alter table announcements enable row level security;

-- Profiles
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = user_id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = user_id);

create policy "Admins can manage all profiles"
  on profiles for all
  using (public.is_admin());

-- Tenants
create policy "Tenant users can view own tenant"
  on tenants for select
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.tenant_id = tenants.id
    )
  );

create policy "Admins can manage all tenants"
  on tenants for all
  using (public.is_admin());

-- Bills
create policy "Tenant users can view own bills"
  on bills for select
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.tenant_id = bills.tenant_id
    )
  );

create policy "Admins can manage all bills"
  on bills for all
  using (public.is_admin());

-- Tickets
create policy "Tenant users can view own tickets"
  on tickets for select
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.tenant_id = tickets.tenant_id
    )
  );

create policy "Admins can manage all tickets"
  on tickets for all
  using (public.is_admin());

-- Announcements
create policy "Tenant users can view announcements for their tenant"
  on announcements for select
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and (profiles.tenant_id = announcements.tenant_id or announcements.tenant_id is null)
    )
  );

create policy "Admins can manage all announcements"
  on announcements for all
  using (public.is_admin());

grant usage on schema public to authenticated;

grant select, update on profiles to authenticated;
grant select on tenants to authenticated;
grant select on bills to authenticated;
grant select on tickets to authenticated;
grant select on announcements to authenticated;
