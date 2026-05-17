# 📄 Dokumen Perencanaan MVP: KostHub

## Elevator Pitch

Satu platform terpadu untuk transparansi pembayaran dan efisiensi pemeliharaan kost tanpa drama komunikasi.

---

## 👥 Tim Pengembang (The Golden Triangle)

### Mochammad Rizky Septian (1302220121)

- **Role:** CEO, Front-End Engineer
- **Startup Hat:** The Hustler & The Hipster (Fokus pada UI/UX, desain Figma, copywriting, strategi bisnis, dan validasi lapangan).

### Muhammad Fauzan Majid (1302220144)

- **Role:** CTO, Back-End Architect
- **Startup Hat:** The Hacker (Fokus pada arsitektur sistem, database Supabase/PostgreSQL, integrasi API, dan deployment).

---

## 🎯 1. Problem & Solution Fit

### ⚠️ Masalah di Lapangan

1. **Pembayaran Kost Sering Terlambat** — Karena lupa tanggal jatuh tempo atau catatan bukti transfer manual hilang.
2. **Laporan Kerusakan Tenggelam** — Keluhan fasilitas (keran bocor, AC mati, WiFi gangguan) sering terabaikan karena tertumpuk di chat WhatsApp.
3. **Ketidakteraturan Biaya Tambahan** — Sulitnya pembagian iuran kolektif tambahan seperti token listrik lorong.

### 💡 Solusi KostHub

1. **Dasbor Tagihan Otomatis** — Menampilkan riwayat pembayaran dan status lunas/belum lunas secara terpusat.
2. **Sistem Ticketing Laporan** — Pengajuan laporan kerusakan dengan foto dan pelacakan status (Menunggu → Diproses → Selesai).
3. **Papan Pengumuman Digital** — Informasi satu arah dari pengelola kost agar pesan penting tidak tenggelam.

---

## 📊 2. Ukuran Pasar (Market Size)

| Metrik | Nilai | Cakupan |
|--------|-------|---------|
| **TAM** (Total Addressable Market) | ~5.000.000+ Orang | Seluruh mahasiswa & pekerja rantau di indekos se-Indonesia. |
| **SAM** (Serviceable Available Market) | ~300.000+ Orang | Fokus pada kota pelajar dengan tingkat kepadatan kost tinggi (Kawasan Bandung Raya). |
| **SOM** (Serviceable Obtainable Market) | ~15.000+ Orang | Target penetrasi awal (early adopter). Mahasiswa yang berdomisili di radius kampus Telkom University. |

---

## 🔄 3. Alur Pengguna Utama (User Flow)

### 📱 A. Penghuni (Anak Kost)

1. **Login:** Masuk menggunakan email & password.
2. **Dashboard:**
   - Melihat pengumuman penting _(Read-only)_.
   - Mengecek tagihan bulan ini → Klik "Bayar Sekarang" → Upload bukti transfer.
   - Mengecek riwayat laporan perbaikan → Klik "+ Buat Laporan" jika ada kerusakan baru.

### 👨‍💼 B. Pengelola (Ibu/Bapak Kost)

1. **Login:** Masuk menggunakan email & password (dilindungi middleware khusus admin).
2. **Dashboard:**
   - Memantau ringkasan metrik (Total Penghuni, Total Menunggak, Laporan Aktif).
   - Verifikasi tabel "Status Pembayaran" → Mengecek bukti transfer → Ubah status 'Pending' jadi 'Lunas'.
   - Update status laporan kerusakan dari penghuni.
   - Membuat pengumuman baru yang akan disiarkan ke semua penghuni.

---

## 📋 4. Product Backlog (Jira Ready)

| Epic | User Story | Kriteria Penerimaan (Acceptance Criteria) | Prioritas | Story Points |
|------|-----------|------------------------------------------|-----------|-------------|
| **Auth** | Sebagai penghuni/pengelola, saya ingin login dengan email & password. | 1. Ada form login. 2. Validasi error jika salah. 3. Diarahkan ke dashboard masing-masing sesuai role. | High | 3 |
| **Billing** | Sebagai penghuni, saya ingin melihat tagihan & mengunggah bukti bayar. | 1. Muncul nominal tagihan. 2. Bisa unggah gambar/foto. 3. Status berubah jadi 'Pending'. | High | 5 |
| **Billing** | Sebagai pengelola, saya ingin memverifikasi tagihan penghuni. | 1. Tabel daftar tagihan dengan statusnya. 2. Bisa klik 'Terima/Lunas'. 3. Status berubah hijau. | High | 5 |
| **Ticketing** | Sebagai penghuni, saya ingin melaporkan kerusakan fasilitas. | 1. Ada dropdown kategori. 2. Ada input teks. 3. Muncul di riwayat dengan status 'Menunggu'. | Medium | 5 |
| **Ticketing** | Sebagai pengelola, saya ingin mengubah status laporan kerusakan. | 1. Admin bisa melihat daftar tiket. 2. Bisa mengubah status (Menunggu → Diproses → Selesai). | Medium | 3 |
| **Info** | Sebagai pengelola, saya ingin membuat pengumuman satu arah. | 1. Form input Judul & Isi. 2. Pesan muncul di dashboard semua penghuni. | Low | 2 |

---

## 🔄 5. Sprint Planning (2 Sprints)

> **Durasi:** Asumsi 1 Sprint = 2 Minggu

### 🏃 SPRINT 1: Foundation, Auth & Core Shell

> **Goal:** Menyelesaikan pondasi teknis yang cukup untuk memulai Sprint 2 tanpa hambatan arsitektur, auth, atau struktur data dasar.

#### Fokus Sprint 1

- Menyiapkan project Nuxt 4 + Tailwind CSS yang siap dikembangkan.
- Menyiapkan Supabase sebagai pondasi auth, database, dan akses data berbasis role.
- Menyelesaikan alur login dasar untuk penghuni dan pengelola.
- Menyediakan kerangka UI (shell) untuk halaman login, dashboard penghuni, dan dashboard pengelola.

#### Scope In

- Inisialisasi project, environment, dan struktur folder awal.
- Setup Supabase project, koneksi aplikasi, dan konfigurasi environment variables.
- Setup skema database minimal untuk `users`/`profiles`, `bills`, `tickets`, dan `announcements`.
- Implementasi login, logout, redirect sesuai role, dan proteksi route dasar.
- Implementasi kebijakan akses dasar agar penghuni hanya dapat mengakses data miliknya dan admin dapat mengakses data operasional.
- Slicing UI shell untuk login, dashboard penghuni, dan dashboard pengelola dengan placeholder data.
- Seed/mock data minimal agar fitur Sprint 2 dapat dikembangkan tanpa mulai dari nol.

#### Scope Out

- Upload bukti bayar yang sudah functional end-to-end.
- CRUD penuh untuk tagihan, laporan kerusakan, dan pengumuman.
- Dashboard analytics/metrik final dengan data production-ready.
- Visual polish tingkat lanjut, animasi, atau optimasi UI non-esensial.
- Deployment final production dan sesi uji pengguna eksternal.

#### Definition of Done

- Project Nuxt 4 + Tailwind CSS dapat dijalankan lokal tanpa error setup.
- Supabase sudah terhubung ke aplikasi dan environment variables terdokumentasi.
- Tabel inti sudah tersedia: `profiles`, `bills`, `tickets`, `announcements`.
- Login dan logout berjalan untuk role penghuni dan pengelola.
- Redirect dan proteksi route bekerja sesuai role.
- Shell halaman login, dashboard penghuni, dan dashboard pengelola sudah tersedia dan dapat dinavigasi.
- Terdapat seeded/mock data minimal untuk pengujian awal Sprint 2.
- Terdapat minimal satu happy path utuh: login sebagai penghuni/admin → masuk dashboard yang sesuai → logout berhasil.

#### Risiko Utama Sprint 1

- Mapping role user tidak konsisten antara auth Supabase dan data profil.
- Kebijakan akses data (RLS/policy) terlambat dipikirkan sehingga menghambat Sprint 2.
- Scope slicing UI melebar menjadi implementasi fitur penuh.
- Revisi desain terlalu besar di tengah sprint dan mengganggu progress fondasi teknis.

#### Pembagian Fokus Tim

**Hustler & Hipster (Rizky):**
- Finalisasi desain High-Fidelity yang terbatas pada login page, dashboard shell penghuni, dan dashboard shell pengelola.
- Menyusun design tokens / pedoman UI minimum yang cukup untuk membantu slicing konsisten.
- Menyiapkan copywriting dasar untuk auth flow dan placeholder dashboard.
- Melakukan QA visual terhadap hasil slicing Sprint 1 agar sesuai desain dasar, bukan polish final.

**Hacker (Fauzan):**
- Inisialisasi Nuxt 4 & Tailwind CSS.
- Menyiapkan koneksi Supabase dan environment variables.
- Membuat skema database inti dan seed/mock data awal.
- Implementasi auth, role-based redirect, dan proteksi route dasar.
- Menyambungkan shell UI dengan placeholder data agar siap menjadi landasan Sprint 2.

#### Deliverable Sprint 1

- Aplikasi lokal berjalan dengan halaman login.
- Dashboard penghuni dan dashboard pengelola versi shell sudah tersedia.
- Auth flow dasar dan route protection berjalan sesuai role.
- Struktur database dan data awal tersedia untuk pengembangan fitur Sprint 2.

### 🏃 SPRINT 2: Core Features & MVP Polish

> **Goal:** Fitur utama (Tagihan, Ticketing, Pengumuman) berfungsi 100% secara data, perbaikan bug, aplikasi siap rilis dan diuji.

**Hustler & Hipster (Rizky):**
- Menyusun copywriting dan microcopy aplikasi.
- Uji Coba Internal (Dogfooding) untuk mencari celah UI/UX.
- Eksekusi MVP Testing ke 5 target (mahasiswa & bapak/ibu kost) setelah aplikasi live.

**Hacker (Fauzan):**
- Logika CRUD untuk Tagihan (`bills`) & integrasi Supabase Storage untuk foto.
- Logika CRUD Laporan Kerusakan (`tickets`).
- Logika CRUD Pengumuman (`announcements`).
- Bug fixing dan Deployment aplikasi (Vercel).
