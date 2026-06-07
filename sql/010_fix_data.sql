-- 010_fix_data.sql
-- Fix existing data for penghuni2@test.com and add test data
-- Penghuni2 user_id: 5f37b1d1-2668-46c4-8efc-26400413c7f9
-- Penghuni2 tenant_id (Test Penghuni - Kamar 12A): 776ac678-bfdf-4d68-9636-5b4c702c260c

-- 1. Fix profile tenant_id
update public.profiles
set tenant_id = '776ac678-bfdf-4d68-9636-5b4c702c260c'
where user_id = '5f37b1d1-2668-46c4-8efc-26400413c7f9'
  and tenant_id is null;

-- 2. Add test bills for penghuni2
insert into public.bills (tenant_id, title, amount, due_date, status) values
  ('776ac678-bfdf-4d68-9636-5b4c702c260c', 'Tagihan Bulan Juni 2026', 750000, '2026-06-15', 'pending'),
  ('776ac678-bfdf-4d68-9636-5b4c702c260c', 'Tagihan Bulan Mei 2026', 750000, '2026-05-15', 'paid'),
  ('776ac678-bfdf-4d68-9636-5b4c702c260c', 'Tagihan Bulan April 2026', 750000, '2026-04-15', 'paid');

-- 3. Add test tickets for penghuni2
insert into public.tickets (tenant_id, title, description, category, status) values
  ('776ac678-bfdf-4d68-9636-5b4c702c260c', 'AC kamar tidak dingin', 'AC sudah 2 hari ini tidak mengeluarkan udara dingin sama sekali. Mohon dicek.', 'ac', 'diproses'),
  ('776ac678-bfdf-4d68-9636-5b4c702c260c', 'Kran kamar mandi bocor', 'Kran air di kamar mandi bocor terus, airnya tidak bisa mati total.', 'air', 'selesai'),
  ('776ac678-bfdf-4d68-9636-5b4c702c260c', 'Lampu lorong mati', 'Lampu di lorong lantai 2 mati sudah 3 hari.', 'listrik', 'menunggu');

-- 4. Add global announcements (tenant_id IS NULL)
insert into public.announcements (tenant_id, title, content) values
  (null, 'Jadwal Kebersihan Mingguan', 'Kebersihan bersama akan dilaksanakan setiap hari Sabtu pukul 08.00 WIB. Mohon partisipasi semua penghuni.'),
  (null, 'Pengingat Pembayaran', 'Pembayaran kost dilakukan paling lambat tanggal 15 setiap bulannya. Keterlambatan akan dikenakan denda.');
