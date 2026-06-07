-- 005_seed_data.sql
-- Sample data for Sprint 2 testing
-- Jalankan setelah auth users dibuat (via Supabase dashboard)

-- Sample bills for existing tenant (assuming tenant id from 002_seed.sql)
-- Ganti tenant_id sesuai dengan yang ada di database
insert into bills (tenant_id, title, amount, due_date, status) values
  ('00000000-0000-0000-0000-000000000001', 'Tagihan Bulan Juni 2026', 750000, '2026-06-15', 'pending'),
  ('00000000-0000-0000-0000-000000000001', 'Tagihan Bulan Mei 2026', 750000, '2026-05-15', 'paid'),
  ('00000000-0000-0000-0000-000000000001', 'Tagihan Bulan April 2026', 750000, '2026-04-15', 'paid');

-- Sample tickets
insert into tickets (tenant_id, title, description, category, status) values
  ('00000000-0000-0000-0000-000000000001', 'AC kamar tidak dingin', 'AC sudah 2 hari ini tidak mengeluarkan udara dingin sama sekali. Mohon dicek.', 'ac', 'diproses'),
  ('00000000-0000-0000-0000-000000000001', 'Kran kamar mandi bocor', 'Kran air di kamar mandi bocor terus, airnya tidak bisa mati total.', 'air', 'selesai'),
  ('00000000-0000-0000-0000-000000000001', 'Lampu lorong mati', 'Lampu di lorong lantai 2 mati sudah 3 hari.', 'listrik', 'menunggu');

-- Sample announcements (tenant_id null = global untuk semua tenant)
insert into announcements (tenant_id, title, content) values
  (null, 'Jadwal Kebersihan Mingguan', 'Kebersihan bersama akan dilaksanakan setiap hari Sabtu pukul 08.00 WIB. Mohon partisipasi semua penghuni.'),
  (null, 'Pengingat Pembayaran', 'Pembayaran kost dilakukan paling lambat tanggal 15 setiap bulannya. Keterlambatan akan dikenakan denda.');
