# Register Invite-Only — Implementation Plan

> **Untuk agentic worker:** WAJIB: Gunakan superpowers:subagent-driven-development (recommended) atau superpowers:executing-plans untuk implementasi task-by-task. Steps menggunakan checkbox (`- [ ]`).

**Goal:** Implementasi sistem invite-only registration agar pengelola kost bisa mengundang penghuni via email invite link.

**Architecture:** Nuxt 4 server routes untuk API invite, Supabase Auth untuk registrasi, Supabase DB untuk invitations table. Flow: pengelola create invite → email link → penghuni set password → auto-create profile → redirect dashboard.

**Tech Stack:** Nuxt 4, Supabase Auth, Supabase DB (PostgreSQL), Tailwind CSS, Nuxt server routes

**Design spec:** `docs/superpowers/specs/2026-06-04-register-invite-only-design.md`

---

## File Structure Map

```
F:\Coding\KostHub\
├── sql\
│   └── 003_invitations.sql              -- CREATE: tabel invitations + RLS
├── app\
│   ├── server\
│   │   └── api\
│   │       └── invite\
│   │           ├── index.post.ts         -- CREATE: POST /api/invite
│   │           ├── verify.get.ts         -- CREATE: GET /api/invite/verify?token=xxx
│   │           └── accept.post.ts        -- CREATE: POST /api/invite/accept
│   ├── composables\
│   │   └── useInvite.ts                  -- CREATE: composable invite
│   ├── components\
│   │   └── invite\
│   │       ├── InviteForm.vue            -- CREATE: form invite
│   │       └── InviteStatus.vue          -- CREATE: badge/tag status
│   └── pages\
│       ├── dashboard\
│       │   └── pengelola\
│       │       └── invite.vue            -- CREATE: halaman invite di dashboard pengelola
│       └── invite\
│           └── accept.vue                -- CREATE: halaman accept invite publik
```

---

### Task 1: SQL Migration — Tabel Invitations

**Files:**
- Create: `F:\Coding\KostHub\sql\003_invitations.sql`

- [ ] **Step 1: Tulis migration SQL**

```sql
-- 003_invitations.sql
-- Migration: Create invitations table for invite-only registration flow

CREATE TABLE IF NOT EXISTS invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  full_name   text NOT NULL,
  tenant_id   uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'tenant' CHECK (role IN ('tenant')),
  token       text NOT NULL UNIQUE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  created_by  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz NOT NULL
);

-- Index untuk lookup token (cepat)
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);

-- Row Level Security
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama kalau sudah ada (idempotent)
DROP POLICY IF EXISTS "Pengelola bisa lihat invitation tenant-nya" ON invitations;
DROP POLICY IF EXISTS "Pengelola bisa buat invitation" ON invitations;

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

-- Siapa pun bisa select invitation by token (untuk validasi invite)
DROP POLICY IF EXISTS "Publik bisa lihat invitation via token" ON invitations;
CREATE POLICY "Publik bisa lihat invitation via token"
  ON invitations FOR SELECT
  USING (true);
```

- [ ] **Step 2: Buat file migration**

  Write file `F:\Coding\KostHub\sql\003_invitations.sql` dengan konten di atas.

- [ ] **Step 3: Commit migration**

  Jalankan:
  ```bash
  git add sql/003_invitations.sql
  git commit -m "feat: add invitations table and RLS policies"
  ```

---

### Task 2: Server API — Create Invitation (POST /api/invite)

**Files:**
- Create: `F:\Coding\KostHub\app\server\api\invite\index.post.ts`

- [ ] **Step 1: Tulis endpoint create invite**

```typescript
// app/server/api/invite/index.post.ts
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  // 1. Harus login
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // 2. Validasi role admin
  const { data: profile } = await client
    .from('profiles')
    .select('role, tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Hanya pengelola yang bisa mengundang' })
  }

  // 3. Baca body
  const body = await readBody(event)
  const { email, full_name } = body

  if (!email || !full_name) {
    throw createError({ statusCode: 400, statusMessage: 'Email dan nama lengkap wajib diisi' })
  }

  // Validasi format email sederhana
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid' })
  }

  if (full_name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Nama lengkap minimal 2 karakter' })
  }

  // 4. Cek apakah email sudah terdaftar
  const { data: existingUser } = await client
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'Email ini sudah terdaftar sebagai pengguna' })
  }

  // 5. Cek apakah sudah ada invitation pending untuk email ini
  const { data: existingInvite } = await client
    .from('invitations')
    .select('id, status')
    .eq('email', email)
    .in('status', ['pending'])
    .maybeSingle()

  if (existingInvite) {
    throw createError({ statusCode: 409, statusMessage: 'Undangan sudah dikirim ke email ini sebelumnya' })
  }

  // 6. Generate token & buat invitation
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 hari

  const { data: invitation, error } = await client
    .from('invitations')
    .insert({
      email,
      full_name,
      tenant_id: profile.tenant_id,
      role: 'tenant',
      token,
      created_by: user.id,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Gagal membuat invitation:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat undangan' })
  }

  // 7. Kirim email (untuk MVP: log link saja — email integration bisa ditambahkan nanti)
  const inviteUrl = `${getRequestURL(event).origin}/invite/accept?token=${token}`
  console.log('📧 Invite link:', inviteUrl)

  return {
    success: true,
    data: {
      id: invitation.id,
      email: invitation.email,
      full_name: invitation.full_name,
      status: invitation.status,
      created_at: invitation.created_at,
      invite_url: inviteUrl // untuk testing manual
    }
  }
})
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/server/api/invite/index.post.ts
  git commit -m "feat: add POST /api/invite endpoint"
  ```

---

### Task 3: Server API — Verify Token (GET /api/invite/verify)

**Files:**
- Create: `F:\Coding\KostHub\app\server\api\invite\verify.get.ts`

- [ ] **Step 1: Tulis endpoint verify**

```typescript
// app/server/api/invite/verify.get.ts
import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token tidak ditemukan' })
  }

  const client = await serverSupabaseClient(event)

  const { data: invitation } = await client
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Link tidak valid. Hubungi pengelola kost Anda' })
  }

  if (invitation.status === 'accepted') {
    throw createError({ statusCode: 400, statusMessage: 'Akun sudah aktif. Silakan login' })
  }

  if (invitation.status === 'expired' || invitation.status === 'cancelled') {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah tidak berlaku. Minta pengelola mengirim ulang undangan' })
  }

  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)

  if (now > expiresAt) {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah kedaluwarsa. Minta pengelola mengirim ulang undangan' })
  }

  return {
    success: true,
    data: {
      email: invitation.email,
      full_name: invitation.full_name,
      status: invitation.status
    }
  }
})
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/server/api/invite/verify.get.ts
  git commit -m "feat: add GET /api/invite/verify endpoint"
  ```

---

### Task 4: Server API — Accept Invite (POST /api/invite/accept)

**Files:**
- Create: `F:\Coding\KostHub\app\server\api\invite\accept.post.ts`

- [ ] **Step 1: Tulis endpoint accept**

```typescript
// app/server/api/invite/accept.post.ts
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { token, password } = body

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Token dan password wajib diisi' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password minimal 8 karakter' })
  }

  // 1. Validasi token
  const { data: invitation } = await client
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Link tidak valid. Hubungi pengelola kost Anda' })
  }

  if (invitation.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah tidak berlaku' })
  }

  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)
  if (now > expiresAt) {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah kedaluwarsa. Minta pengelola mengirim ulang undangan' })
  }

  // 2. Register ke Supabase Auth — pakai service role biar auto-confirm
  const adminClient = serverSupabaseServiceRole(event)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true, // langsung confirmed
    user_metadata: {
      full_name: invitation.full_name,
      role: invitation.role
    }
  })

  if (authError) {
    // Error karena email already registered di Auth
    if (authError.message?.includes('already')) {
      throw createError({ statusCode: 409, statusMessage: 'Email ini sudah terdaftar' })
    }
    console.error('Gagal register auth:', authError)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat akun' })
  }

  if (!authData.user) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat akun' })
  }

  // 3. Buat profile
  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: invitation.email,
      full_name: invitation.full_name,
      role: invitation.role,
      tenant_id: invitation.tenant_id
    })

  if (profileError) {
    console.error('Gagal membuat profile:', profileError)
    // Rollback: hapus user auth
    await adminClient.auth.admin.deleteUser(authData.user.id)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat profile' })
  }

  // 4. Update invitation status
  const { error: updateError } = await client
    .from('invitations')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', invitation.id)

  if (updateError) {
    console.error('Gagal update invitation:', updateError)
    // Non-critical, user tetap jadi terdaftar
  }

  // 5. Buat session (auto-login)
  // Catatan: service role bisa buat session token
  const { data: sessionData, error: sessionError } = await adminClient.auth.admin.generateLink({
    type: 'recovery',
    email: invitation.email
  })

  return {
    success: true,
    message: 'Akun berhasil dibuat. Silakan login'
  }
})
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/server/api/invite/accept.post.ts
  git commit -m "feat: add POST /api/invite/accept endpoint"
  ```

---

### Task 5: Composable — useInvite

**Files:**
- Create: `F:\Coding\KostHub\app\composables\useInvite.ts`

- [ ] **Step 1: Tulis composable useInvite**

```typescript
// app/composables/useInvite.ts
export const useInvite = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const loading = ref(false)
  const error = ref<string | null>(null)

  type InvitePayload = {
    email: string
    full_name: string
  }

  /**
   * Create invitation (pengelola → penghuni)
   */
  async function createInvite(payload: InvitePayload) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()

      if (!res.ok) {
        error.value = json.statusMessage || 'Gagal membuat undangan'
        return null
      }

      return json.data
    } catch (e: any) {
      error.value = e.message || 'Terjadi kesalahan'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Verify token invite
   */
  async function verifyToken(token: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(`/api/invite/verify?token=${encodeURIComponent(token)}`)
      const json = await res.json()

      if (!res.ok) {
        error.value = json.statusMessage || 'Token tidak valid'
        return null
      }

      return json.data
    } catch (e: any) {
      error.value = e.message || 'Terjadi kesalahan'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Accept invitation (set password)
   */
  async function acceptInvite(token: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const json = await res.json()

      if (!res.ok) {
        error.value = json.statusMessage || 'Gagal menerima undangan'
        return false
      }

      return true
    } catch (e: any) {
      error.value = e.message || 'Terjadi kesalahan'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    createInvite,
    verifyToken,
    acceptInvite,
    loading,
    error
  }
}
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/composables/useInvite.ts
  git commit -m "feat: add useInvite composable"
  ```

---

### Task 6: UI Component — InviteForm

**Files:**
- Create: `F:\Coding\KostHub\app\components\invite\InviteForm.vue`

- [ ] **Step 1: Tulis komponen InviteForm**

```vue
<!-- app/components/invite/InviteForm.vue -->
<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <!-- Error banner -->
    <div
      v-if="localError"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
    >
      {{ localError }}
    </div>

    <!-- Success banner -->
    <div
      v-if="success"
      class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
    >
      ✅ Undangan berhasil dikirim ke <strong>{{ email }}</strong>
      <p class="mt-1 text-green-600 text-xs">
        Link: <code class="bg-green-100 px-1 rounded">{{ inviteLink }}</code>
      </p>
    </div>

    <!-- Form -->
    <template v-if="!success">
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email Penghuni
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="penghuni@example.com"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          :disabled="loading"
        />
      </div>

      <div>
        <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
          Nama Lengkap
        </label>
        <input
          id="fullName"
          v-model="fullName"
          type="text"
          required
          minlength="2"
          placeholder="Nama penghuni"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          :disabled="loading"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Mengirim...' : 'Kirim Undangan' }}
      </button>
    </template>
  </form>
</template>

<script setup lang="ts">
const { createInvite, loading, error } = useInvite()

const email = ref('')
const fullName = ref('')
const localError = ref<string | null>(null)
const success = ref(false)
const inviteLink = ref('')

watch(error, (val) => {
  localError.value = val
})

async function handleSubmit() {
  localError.value = null
  success.value = false

  if (!email.value || !fullName.value) {
    localError.value = 'Email dan nama lengkap wajib diisi'
    return
  }

  if (!fullName.value || fullName.value.trim().length < 2) {
    localError.value = 'Nama lengkap minimal 2 karakter'
    return
  }

  const result = await createInvite({
    email: email.value,
    full_name: fullName.value
  })

  if (result) {
    success.value = true
    inviteLink.value = result.invite_url
  }
}
</script>
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/components/invite/InviteForm.vue
  git commit -m "feat: add InviteForm component"
  ```

---

### Task 7: UI Component — InviteStatus

**Files:**
- Create: `F:\Coding\KostHub\app\components\invite\InviteStatus.vue`

- [ ] **Step 1: Tulis komponen InviteStatus**

```vue
<!-- app/components/invite/InviteStatus.vue -->
<template>
  <div class="flex items-center gap-1.5">
    <span
      class="inline-block w-2 h-2 rounded-full"
      :class="colorClass"
    />
    <span class="text-sm font-medium" :class="textClass">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}>()

const statusConfig: Record<string, { label: string; color: string; text: string }> = {
  pending: {
    label: 'Menunggu',
    color: 'bg-yellow-400',
    text: 'text-yellow-700'
  },
  accepted: {
    label: 'Diterima',
    color: 'bg-green-500',
    text: 'text-green-700'
  },
  expired: {
    label: 'Kedaluwarsa',
    color: 'bg-gray-400',
    text: 'text-gray-500'
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-500',
    text: 'text-red-700'
  }
}

const config = $computed(() => statusConfig[props.status] || statusConfig.pending)
const label = $computed(() => config.label)
const colorClass = $computed(() => config.color)
const textClass = $computed(() => config.text)
</script>
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/components/invite/InviteStatus.vue
  git commit -m "feat: add InviteStatus component"
  ```

---

### Task 8: Halaman Invite di Dashboard Pengelola

**Files:**
- Create: `F:\Coding\KostHub\app\pages\dashboard\pengelola\invite.vue`

- [ ] **Step 1: Tulis halaman invite**

```vue
<!-- app/pages/dashboard/pengelola/invite.vue -->
<template>
  <div class="max-w-2xl mx-auto space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Undang Penghuni</h1>
      <p class="text-gray-500 mt-1">
        Kirim undangan email ke penghuni baru untuk bergabung ke kost Anda
      </p>
    </div>

    <!-- Form -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 class="text-lg font-semibold text-gray-900 mb-4">Form Undangan</h2>
      <InviteForm />
    </div>

    <!-- Info box -->
    <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
      <p class="font-medium mb-1">📌 Bagaimana cara kerjanya?</p>
      <ol class="list-decimal list-inside space-y-1 text-blue-600">
        <li>Masukkan email dan nama lengkap penghuni</li>
        <li>Sistem akan mengirimkan link undangan ke email tersebut</li>
        <li>Penghuni membuka link dan membuat password sendiri</li>
        <li>Setelah selesai, penghuni bisa login ke dashboard</li>
      </ol>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'role'],
  roles: ['admin']
})
</script>
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/pages/dashboard/pengelola/invite.vue
  git commit -m "feat: add invite page for pengelola dashboard"
  ```

---

### Task 9: Halaman Accept Invite (Publik)

**Files:**
- Create: `F:\Coding\KostHub\app\pages\invite\accept.vue`

- [ ] **Step 1: Tulis halaman accept invite**

```vue
<!-- app/pages/invite/accept.vue -->
<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Loading -->
      <div v-if="loading && !invitation" class="text-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p class="text-gray-500">Memvalidasi undangan...</p>
      </div>

      <!-- Error -->
      <div v-else-if="verifyError" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div class="text-4xl mb-4">😕</div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Link Tidak Valid</h1>
        <p class="text-gray-500 mb-6">{{ verifyError }}</p>
        <NuxtLink
          to="/login"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Ke Halaman Login
        </NuxtLink>
      </div>

      <!-- Form set password -->
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Terima Undangan</h1>
          <p class="text-gray-500 mt-1">Anda diundang untuk bergabung sebagai penghuni kost</p>
        </div>

        <!-- Info invitation -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
          <div class="flex justify-between mb-2">
            <span class="text-gray-500">Email</span>
            <span class="text-gray-900 font-medium">{{ invitation.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Nama</span>
            <span class="text-gray-900 font-medium">{{ invitation.full_name }}</span>
          </div>
        </div>

        <!-- Error banner -->
        <div
          v-if="submitError"
          class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4"
        >
          {{ submitError }}
        </div>

        <!-- Form -->
        <form @submit.prevent="handleAccept">
          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Buat Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="8"
              placeholder="Minimal 8 karakter"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              :disabled="submitting"
            />
          </div>

          <div class="mb-6">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              :class="{ 'border-red-300': passwordMismatch }"
              placeholder="Ketik ulang password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              :disabled="submitting"
            />
            <p v-if="passwordMismatch" class="text-red-600 text-xs mt-1">
              Password tidak cocok
            </p>
          </div>

          <button
            type="submit"
            :disabled="submitting || passwordMismatch"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Membuat akun...' : 'Buat Akun & Masuk' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false // layout sendiri, tanpa navbar/sidebar
})

const route = useRoute()
const router = useRouter()

const { verifyToken, acceptInvite, loading, error } = useInvite()

const token = ref(route.query.token as string || '')
const invitation = ref<{ email: string; full_name: string } | null>(null)
const verifyError = ref<string | null>(null)
const submitError = ref<string | null>(null)
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const passwordMismatch = computed(() => {
  return confirmPassword.value.length > 0 && password.value !== confirmPassword.value
})

// Verify token on mount
onMounted(async () => {
  if (!token.value) {
    verifyError.value = 'Token tidak ditemukan di URL'
    return
  }

  const result = await verifyToken(token.value)

  if (result) {
    invitation.value = result
  } else {
    verifyError.value = error.value || 'Token tidak valid'
  }
})

async function handleAccept() {
  if (password.value.length < 8) {
    submitError.value = 'Password minimal 8 karakter'
    return
  }

  if (password.value !== confirmPassword.value) {
    submitError.value = 'Password tidak cocok'
    return
  }

  submitError.value = null
  submitting.value = true

  const success = await acceptInvite(token.value, password.value)

  if (success) {
    router.push('/login')
  } else {
    submitError.value = error.value || 'Gagal membuat akun'
  }

  submitting.value = false
}
</script>
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/pages/invite/accept.vue
  git commit -m "feat: add public accept invite page"
  ```

---

### Task 10: Navigasi & Polish

**Files:**
- Modify: `F:\Coding\KostHub\app\pages\dashboard\pengelola.vue` (tambah menu invite/sidebar)

- [ ] **Step 1: Tambah navigasi invite di dashboard pengelola**

Baca file dashboard pengelola eksisting:

```bash
type F:\Coding\KostHub\app\pages\dashboard\pengelola.vue
```

Cari area navigasi/sidebar dan tambah menu "Undang Penghuni" yang mengarah ke `/dashboard/pengelola/invite`.

Contoh tambahan (sesuaikan dengan struktur existing):
```vue
<NuxtLink
  to="/dashboard/pengelola/invite"
  class="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
>
  <span>➕</span>
  <span>Undang Penghuni</span>
</NuxtLink>
```

- [ ] **Step 2: Commit**

  ```bash
  git add app/pages/dashboard/pengelola.vue
  git commit -m "feat: add invite menu link to pengelola dashboard"
  ```

---

### Task 11: Integrasi & Test End-to-End

**Files:**
- Test: Semua file yang sudah dibuat

- [ ] **Step 1: Build Nuxt**

  ```bash
  cd F:\Coding\KostHub
  npm run build
  ```

  Expected: Build berhasil tanpa error.

- [ ] **Step 2: Jalankan SQL migration di Supabase Dashboard**

  Buka Supabase Dashboard → SQL Editor → Paste isi `sql/003_invitations.sql` → Run.

- [ ] **Step 3: Test flow — login sebagai pengelola**

  - Buka `http://localhost:3000/login`
  - Login dengan akun pengelola (admin)
  - Verifikasi redirect ke `/dashboard/pengelola`

- [ ] **Step 4: Test flow — buka halaman invite**

  - Navigasi ke `/dashboard/pengelola/invite`
  - Verifikasi form invite muncul

- [ ] **Step 5: Test flow — kirim invite**

  - Isi email (belum terdaftar) + nama lengkap
  - Klik "Kirim Undangan"
  - Verifikasi muncul pesan sukses
  - Catat invite URL yang muncul

- [ ] **Step 6: Test flow — buka link invite di tab incognito/baru**

  - Buka URL invite yang tercatat
  - Verifikasi muncul form set password dengan email & nama sesuai

- [ ] **Step 7: Test flow — set password & accept**

  - Input password (min 8 karakter)
  - Klik "Buat Akun & Masuk"
  - Verifikasi redirect ke `/login`

- [ ] **Step 8: Test flow — login sebagai penghuni baru**

  - Login dengan email + password yang tadi dibuat
  - Verifikasi redirect ke `/dashboard/penghuni`
  - Verifikasi role middleware blocked dari `/dashboard/pengelola`

- [ ] **Step 9: Test error — link expired/invalid**

  - Buka `/invite/accept?token=random-invalid`
  - Verifikasi pesan "Link tidak valid"

---

### Task 12: Commit Final

- [ ] **Step 1: Git status & commit**

  ```bash
  git status
  git add .
  git commit -m "feat: complete invite-only registration flow"
  ```
