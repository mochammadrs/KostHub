# Sprint 1 Technical Execution Checklist

## Tujuan Sprint

Membangun pondasi teknis MVP KostHub agar Sprint 2 bisa fokus ke implementasi fitur bisnis tanpa terhambat oleh setup project, auth, struktur data, atau shell UI.

## Definition of Done

- [ ] Project Nuxt 4 + Tailwind CSS bisa dijalankan lokal.
- [ ] Supabase sudah terhubung dan environment variables terdokumentasi.
- [ ] Tabel inti tersedia: `profiles`, `bills`, `tickets`, `announcements`.
- [ ] Login/logout berjalan untuk penghuni dan pengelola.
- [ ] Redirect dan route protection bekerja sesuai role.
- [ ] Login page, dashboard penghuni, dan dashboard pengelola versi shell sudah tersedia.
- [ ] Seed/mock data minimal tersedia.
- [ ] Happy path login → dashboard sesuai role → logout berhasil.

## Scope In

- Setup project Nuxt 4 + Tailwind CSS.
- Setup Supabase dan konfigurasi environment.
- Setup auth dasar dan role flow.
- Setup schema database inti.
- Setup route protection.
- Setup UI shell dasar.
- Setup seed/mock data minimal.

## Scope Out

- Upload bukti bayar yang benar-benar tersimpan.
- CRUD tagihan, ticketing, dan pengumuman secara penuh.
- Dashboard analytics final.
- Deployment production final.
- Uji pengguna eksternal.

## Checklist Eksekusi

### 1. Project Bootstrap

- [ ] Inisialisasi project Nuxt 4.
- [ ] Pasang dan konfigurasi Tailwind CSS.
- [ ] Rapikan struktur folder awal (`pages`, `components`, `layouts`, `middleware`, `composables`, `types`).
- [ ] Buat file environment example / catatan variabel yang dibutuhkan.
- [ ] Pastikan project bisa running lokal.

### 2. Supabase Setup

- [ ] Buat / siapkan project Supabase.
- [ ] Hubungkan aplikasi ke Supabase URL dan anon key.
- [ ] Tentukan strategi role user (`tenant` / `admin`).
- [ ] Tentukan apakah role disimpan di `profiles` atau struktur lain yang konsisten.

### 3. Database Schema Minimum

- [ ] Buat tabel `profiles`.
- [ ] Buat tabel `bills`.
- [ ] Buat tabel `tickets`.
- [ ] Buat tabel `announcements`.
- [ ] Pastikan relasi dasar antar tabel sudah jelas.
- [ ] Tambahkan kolom status minimum yang dibutuhkan untuk Sprint 2.

### 4. Access Control & Security Dasar

- [ ] Pastikan user yang login punya role yang bisa dibaca aplikasi.
- [ ] Buat proteksi route untuk dashboard admin.
- [ ] Buat proteksi route untuk dashboard penghuni.
- [ ] Pastikan penghuni tidak bisa mengakses halaman admin.
- [ ] Pastikan policy dasar akses data sudah dipikirkan sejak Sprint 1.

### 5. Auth Flow

- [ ] Buat halaman login.
- [ ] Implementasikan login email & password.
- [ ] Implementasikan logout.
- [ ] Implementasikan redirect setelah login sesuai role.
- [ ] Tampilkan state error dasar jika login gagal.
- [ ] Pastikan sesi login tetap terbaca saat refresh bila memang diharapkan.

### 6. UI Shell

- [ ] Slicing login page.
- [ ] Slicing dashboard penghuni versi shell.
- [ ] Slicing dashboard pengelola versi shell.
- [ ] Buat layout/navigasi dasar.
- [ ] Gunakan placeholder data, jangan masuk ke fitur penuh.
- [ ] Samakan struktur UI dengan desain dasar yang sudah disepakati.

### 7. Seed / Mock Data

- [ ] Siapkan minimal 1 akun admin.
- [ ] Siapkan minimal 1 akun penghuni.
- [ ] Siapkan contoh data tagihan.
- [ ] Siapkan contoh data tiket.
- [ ] Siapkan contoh data pengumuman.

### 8. Validation Checkpoint

- [ ] Login sebagai penghuni berhasil.
- [ ] Login sebagai admin berhasil.
- [ ] Penghuni diarahkan ke dashboard penghuni.
- [ ] Admin diarahkan ke dashboard pengelola.
- [ ] Penghuni tidak bisa membuka route admin.
- [ ] Admin bisa membuka area yang memang diperuntukkan baginya.
- [ ] Logout berhasil dari kedua role.
- [ ] Tidak ada blocker teknis utama untuk memulai Sprint 2.

## Risiko yang Harus Dijaga

- Role user tidak sinkron antara auth dan profile data.
- Route protection terasa selesai, tetapi policy data masih longgar.
- UI shell melebar menjadi implementasi fitur nyata.
- Desain berubah terlalu besar saat development foundation berjalan.

## Urutan Kerja yang Disarankan

1. Bootstrap project.
2. Hubungkan Supabase.
3. Bentuk schema database minimum.
4. Tentukan role flow dan auth flow.
5. Terapkan route protection.
6. Bangun login page dan dua dashboard shell.
7. Tambahkan seed/mock data.
8. Jalankan validation checkpoint.
