# Spesifikasi Desain: Invite-Only Registration

> **Proyek:** KostHub  
> **Tanggal:** 4 Juni 2026  
> **Status:** Draft  
> **Terkait:** Sprint 1 (Foundation, Auth & Core Shell)

---

## 1. Ringkasan Eksekutif

Fitur registrasi KostHub menggunakan model **invite-only**. Tidak ada halaman daftar publik. Pengelola kost yang sudah memiliki akun dapat mengundang penghuni baru melalui email. Penghuni menerima link undangan, membuat password, dan langsung terhubung ke kost yang sesuai. Pendekatan ini mencegah akses sembarangan dan memastikan setiap penghuni terikat ke kost yang benar sejak awal.

---

## 2. Konteks & Latar Belakang

### 2.1. Kondisi Saat Ini (Sprint 1)

- Login/logout via Supabase Auth sudah berfungsi
- Role-based middleware berjalan (penghuni → `/dashboard/penghuni`, pengelola → `/dashboard/pengelola`)
- Tabel `profiles` dengan field `role` (`tenant` / `admin`) dan `tenant_id`
- Tabel `tenants` untuk representasi kost
- Setiap pengelola manage satu kost (relasi one-to-one)
- Setiap penghuni belong ke satu kost (via `tenant_id`)

### 2.2. Masalah yang Diselesaikan

- Tidak boleh ada pendaftaran publik untuk mencegah akun sembarangan
- Role harus dikunci oleh sistem, bukan dipilih user saat daftar
- Setiap penghuni harus terikat ke kost yang benar sejak awal
- Alur registrasi harus sederhana dan aman

### 2.3. Asumsi Desain

- Satu pengelola manage satu kost (one-to-one)
- Akun pengelola dibuat manual/seeded (tidak melalui invite)
- Invite hanya untuk penghuni
- Email service tersedia (Supabase Auth built-in atau SMTP)
- Pengelola sudah login saat mengundang

---

## 3. Model Registrasi

| Aspek | Keputusan |
|-------|-----------|
| **Metode** | Invite-only via email |
| **Role** | Ditetapkan sistem (penghuni = `tenant`) |
| **Data wajib invite** | Email + Nama lengkap |
| **Akun pengelola** | Dibuat manual (seeded atau via database) |
| **Halaman register publik** | Tidak ada |

---

## 4. Alur Pengguna

### 4.1. Flow Invite (dari sisi Pengelola)

```
┌─────────────────────┐
│ Pengelola login     │
│ ke dashboard        │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Klik "Tambah        │
│ Penghuni" / "Invite"│
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Isi form:           │
│ • Email             │
│ • Nama Lengkap      │
│ (Kost otomatis      │
│  sesuai tenant_id   │
│  pengelola)         │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Sistem generate     │
│ token unik & kirim  │
│ email invite        │
└─────────┬───────────┘
          ▼
┌─────────────────────┐
│ Invitation tersimpan│
│ (status: pending)   │
└─────────────────────┘
```

### 4.2. Flow Accept Invite (dari sisi Penghuni)

```
┌──────────────────────────┐
│ Penghuni terima email    │
│ berisi link invite       │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ Klik link invite         │
│ /invite/accept?token=XXX │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ Sistem validasi token:   │
│ • Token valid?           │
│ • Belum expired?         │
│ • Status masih pending?  │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ Form set password        │
│ (tampilkan nama & email) │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ Sistem:                  │
│ 1. Sign up via Supabase  │
│ 2. Buat profile (tenant) │
│ 3. Update invitation     │
│    → accepted            │
└──────────┬───────────────┘
           ▼
┌──────────────────────────┐
│ Redirect ke              │
│ /dashboard/penghuni      │
└──────────────────────────┘
```

---

## 5. Arsitektur & Komponen

### 5.1. Perubahan Database

Tabel baru `invitations`:

```sql
CREATE TABLE invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  full_name   text NOT NULL,
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  role        text NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant')),
  token       text NOT NULL UNIQUE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_by  uuid NOT NULL REFERENCES profiles(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

-- Index untuk lookup token
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);

-- Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Pengelola bisa lihat invitation milik tenant-nya
CREATE POLICY "Pengelola bisa lihat invitation tenant-nya"
  ON invitations FOR SELECT
  USING (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE tenant_id = invitations.tenant_id
        AND role = 'admin'
    )
  );

-- Pengelola bisa insert invitation untuk tenant-nya
CREATE POLICY "Pengelola bisa buat invitation"
  ON invitations FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM profiles
      WHERE tenant_id = invitations.tenant_id
        AND role = 'admin'
    )
  );
```

### 5.2. Komponen UI

| Komponen | Lokasi | Deskripsi |
|----------|--------|-----------|
| `app/pages/dashboard/pengelola/invite.vue` | Halaman baru | Form invite penghuni |
| `app/pages/invite/accept.vue` | Halaman baru | Halaman accept token + set password |
| `app/components/invite/InviteForm.vue` | Komponen baru | Form input email + nama lengkap |
| `app/components/invite/InviteStatus.vue` | Komponen baru | Menampilkan status undangan |

### 5.3. API / Server Routes

| Route | Method | Deskripsi |
|-------|--------|-----------|
| `POST /api/invite` | POST | Buat invitation baru (dari pengelola) |
| `GET /api/invite/verify` | GET | Validasi token invite |
| `POST /api/invite/accept` | POST | Accept invite + set password |

### 5.4. Service / Composable

| Composable | Deskripsi |
|------------|-----------|
| `app/composables/useInvite.ts` | Logic invite (create, verify, accept) |
| `app/server/api/invite/index.post.ts` | Endpoint buat invitation |
| `app/server/api/invite/verify.get.ts` | Endpoint validasi token |
| `app/server/api/invite/accept.post.ts` | Endpoint accept invite |

---

## 6. Data Flow Detail

### 6.1. Buat Invitation (Pengelola → Sistem)

1. Pengelola isi form: email + nama lengkap
2. Sistem validasi: email belum terdaftar, belum punya invitation pending
3. Sistem generate token unik (`crypto.randomUUID()` atau `nanoid`)
4. Sistem set `expires_at = now() + 7 days`
5. Sistem simpan record ke tabel `invitations`
6. Sistem kirim email ke alamat tujuan berisi link invite
7. Response ke pengelola: "Undangan berhasil dikirim"

### 6.2. Accept Invite (Penghuni → Sistem)

1. Penghuni buka link: `/invite/accept?token=xxx`
2. Frontend panggil `GET /api/invite/verify?token=xxx`
3. Backend validasi:
   - Token ditemukan? Jika tidak → "Link tidak valid"
   - Status masih `pending`? Jika tidak → "Undangan sudah digunakan"
   - `expires_at` masih di masa depan? Jika tidak → "Link sudah kedaluwarsa"
4. Jika valid, tampilkan form set password (dengan email & nama yang sudah diisi readonly)
5. Penghuni input password (min 8 karakter)
6. Frontend panggil `POST /api/invite/accept` dengan body `{ token, password }`
7. Backend:
   - Register ke Supabase Auth: `supabase.auth.signUp({ email, password })`
   - Buat profile: `INSERT INTO profiles (id, email, full_name, role, tenant_id)`
   - Update invitation: `UPDATE invitations SET status = 'accepted', updated_at = now()`
8. Auto-login user
9. Redirect ke `/dashboard/penghuni`

### 6.3. Kirim Email

Untuk MVP, kita bisa pakai opsi paling sederhana:
- **Opsi 1 (Recommended):** Supabase Auth built-in email templates (konfigurasi via Supabase Dashboard)
- **Opsi 2:** SMTP custom via Supabase (Gmail, SendGrid, dsb)
- **Opsi 3 (Fallback):** Manual copy link dan kirim via WhatsApp oleh pengelola

Opsi 1 paling sederhana karena Supabase sudah handle delivery email.

---

## 7. Penanganan Error

| Skenario Error | Response ke User |
|---------------|------------------|
| Email sudah terdaftar | "Email ini sudah terdaftar sebagai pengguna" |
| Email pernah diinvite (pending) | "Undangan sudah dikirim ke email ini sebelumnya" |
| Token tidak ditemukan | "Link tidak valid. Hubungi pengelola kost Anda" |
| Token expired | "Link sudah kedaluwarsa. Minta pengelola mengirim ulang undangan" |
| Token sudah dipakai (accepted) | "Akun sudah aktif. Silakan login" |
| Password kurang dari 8 karakter | "Password minimal 8 karakter" |
| Gagal kirim email | "Gagal mengirim email. Coba lagi" |
| Network error | "Terjadi kesalahan. Silakan coba lagi" |

---

## 8. Strategi Testing

### 8.1. Skenario Happy Path

1. Pengelola login → buka halaman invite → isi email + nama → submit → lihat sukses
2. Penghuni buka email → klik link invite → lihat halaman set password → input password → submit → redirect ke dashboard penghuni
3. Penghuni logout → login dengan email + password yang tadi → masuk dashboard penghuni

### 8.2. Skenario Error Path

4. Penghuni buka link invalid → lihat pesan "Link tidak valid"
5. Penghuni buka link expired → lihat pesan "Link sudah kedaluwarsa"
6. Penghuni buka link yang sudah dipakai → lihat pesan "Akun sudah aktif"
7. Pengelola invite email yang sudah terdaftar → lihat pesan error
8. Penghuni input password terlalu pendek → lihat validasi

### 8.3. Validasi Keamanan

9. Token invite tidak bisa ditebak (cukup panjang & random)
10. User yang bukan pengelola tenant tidak bisa akses halaman invite
11. RLS memastikan pengelola hanya lihat invitation tenant-nya sendiri
12. Setelah accept, token tidak bisa dipakai lagi

---

## 9. Batasan & Asumsi

### 9.1. Batasan (Untuk versi MVP)

- Tidak ada fitur **resend invite** — sementara pengelola bisa buat invite baru
- Tidak ada **bulk invite** — invite dilakukan satu per satu
- Tidak ada **revoke/cancel invite** — sementara biarkan expired
- Tidak ada **role selection** — role untuk invite selalu `tenant`
- Tabel `invitations` tidak ada fitur soft delete

### 9.2. Asumsi

- Supabase Auth sudah configured untuk email/password signup
- Email service sudah aktif di project Supabase
- Halaman invite hanya bisa diakses oleh pengelola yang sudah login
- Link invite expired dalam 7 hari (cukup lama untuk user proses forward ke penghuni)

---

## 10. Out of Scope

Fitur berikut tidak termasuk dalam implementasi ini:

- Halaman register publik (tidak akan pernah ada)
- Invite akun pengelola/admin (hanya manual/seeded)
- Bulk upload invite dari file CSV/Excel
- Dashboard invite history dengan filter & search
- Notifikasi realtime saat invite accepted
- Integrasi WhatsApp untuk invite link

---

## 11. Lampiran: Referensi File

**File yang sudah ada (Sprint 1):**
- `app/pages/login.vue` — halaman login eksisting
- `app/middleware/auth.ts` — middleware auth
- `app/middleware/role.ts` — middleware role
- `app/composables/useRole.ts` — helper role
- `sql/001_schema.sql` — schema database eksisting
- `app/server/` — server routes (belum ada, perlu dibuat)

**File yang akan dibuat:**
- `sql/003_invitations.sql` — migration tabel invitations
- `app/pages/dashboard/pengelola/invite.vue` — halaman invite
- `app/components/invite/InviteForm.vue` — form invite
- `app/components/invite/InviteStatus.vue` — status invite
- `app/pages/invite/accept.vue` — halaman accept invite
- `app/composables/useInvite.ts` — composable invite
- `app/server/api/invite/index.post.ts` — endpoint create invite
- `app/server/api/invite/verify.get.ts` — endpoint verify token
- `app/server/api/invite/accept.post.ts` — endpoint accept invite
