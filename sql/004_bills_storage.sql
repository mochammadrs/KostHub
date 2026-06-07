-- 004_bills_storage.sql
-- Migration: Add storage support for payment proofs

-- Add proof_url and paid_at columns to bills
alter table bills add column if not exists proof_url text;
alter table bills add column if not exists paid_at timestamptz;

-- Create storage bucket for payment proofs
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', true);

-- RLS policies for storage
create policy "Authenticated users can upload payment proofs"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and auth.role() = 'authenticated'
  );

create policy "Anyone can view payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');

-- Allow tenants to update their own bill proof
create policy "Tenants can update their own bill proof"
  on bills for update
  using (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.tenant_id = bills.tenant_id
    )
  )
  with check (
    exists (
      select 1 from profiles
      where profiles.user_id = auth.uid()
      and profiles.tenant_id = bills.tenant_id
    )
  );
