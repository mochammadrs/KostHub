# Sprint 1 — Foundation, Auth & Core Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap a working KostHub Nuxt 4 app with Supabase auth, role-based route protection, and shell UIs for login, dashboard penghuni, and dashboard pengelola — ready to start Sprint 2 feature development.

**Architecture:**
- Nuxt 4 with `app/` directory convention. Supabase auth handled by `@nuxtjs/supabase` module (SSR-safe sessions via cookie). Role stored in `profiles.role` (source of truth) with optional JWT metadata mirror for fast checks in middleware. Tailwind CSS v4 via `@tailwindcss/vite` Vite plugin.
- Route protection uses Nuxt route middleware. `middleware/auth.ts` checks `useSupabaseUser()`, `middleware/role.ts` queries the profile to grant/deny admin routes.
- All database tables have RLS enabled from day one. Tenant-owned rows scoped by `tenant_id`.

**Tech Stack:** Nuxt 4, Tailwind CSS v4, Supabase (Auth + PostgreSQL + RLS), `@nuxtjs/supabase`, `@tailwindcss/vite`

---

## File Structure (to be created)

```
KostHub/
├── nuxt.config.ts              # Module registration, Tailwind, Supabase config
├── .env.example                # Supabase env vars template
├── sql/
│   ├── 001_schema.sql          # Tables + RLS policies
│   └── 002_seed.sql            # Development seed data
├── app/
│   ├── app.vue                 # Root component
│   ├── assets/css/main.css     # Tailwind entrypoint
│   ├── layouts/default.vue     # Base layout (navbar placeholder)
│   ├── pages/
│   │   ├── login.vue           # Login form
│   │   └── dashboard/
│   │       ├── penghuni.vue    # Tenant dashboard shell
│   │       └── pengelola.vue   # Admin dashboard shell
│   ├── middleware/
│   │   ├── auth.ts             # Redirect unauthenticated users
│   │   └── role.ts             # Role-based route access
│   └── composables/
│       └── useRole.ts          # Helper: fetch profile role from DB
├── docs/                       # Existing planning docs kept in repo root
├── mvp_kosthub.md
└── sprint1_checklist.md
```

---

### Task 1: Project Bootstrap

**Files:**
- Create: `nuxt.config.ts`
- Create: `app/assets/css/main.css`
- Create: `.env.example`

- [ ] **Step 1.1: Scaffold Nuxt 4 project in the current repository root**

Run from workspace root (`F:\Coding\KostHub/`):

```bash
npx nuxi@latest init . --force
```

This scaffolds the Nuxt app directly inside `F:\Coding\KostHub` while preserving the existing planning docs already in the repository.

- [ ] **Step 1.2: Install dependencies**

```bash
npm install @nuxtjs/supabase
npm install -D tailwindcss @tailwindcss/vite
```

Lockfile `package-lock.json` and `node_modules/` are generated.

- [ ] **Step 1.3: Write `nuxt.config.ts`**

Overwrite the auto-generated `nuxt.config.ts`:

```typescript
import tailwindcss from '@tailwindcss/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/supabase'],
  supabase: {
    redirect: false,
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      exclude: ['/', '/login'],
    },
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  compatibilityDate: '2024-11-01',
})
```

- [ ] **Step 1.4: Write Tailwind entrypoint `app/assets/css/main.css`**

```css
@import "tailwindcss";
```

- [ ] **Step 1.5: Write `.env.example`**

```
NUXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 1.6: Verify dev server runs**

```bash
npm run dev
```

Expected: Dev server starts at `http://localhost:3000` without errors. Page renders (blank Nuxt default is OK).

---

### Task 2: Database Schema & Supabase Setup

**Files:**
- Create: `sql/001_schema.sql`
- Create: `sql/002_seed.sql`

> **Manual step:** User must create a Supabase project at [supabase.com](https://supabase.com) and copy the URL + anon key into `.env`. SQL files are run in Supabase SQL Editor.

- [ ] **Step 2.1: Write `sql/001_schema.sql`**

```sql
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
```

- [ ] **Step 2.2: Write `sql/002_seed.sql`**

```sql
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
```

- [ ] **Step 2.3: Create Supabase project and link**

User action:
1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Copy `Project URL` (e.g. `https://xxxxx.supabase.co`) and `anon public key`
3. Paste into `.env` file (copy from `.env.example`)
4. Open Supabase SQL Editor → Run `sql/001_schema.sql`
5. Run `sql/002_seed.sql`
6. In Supabase Auth → Settings → enable email/password sign-up
7. Create 2 test users manually via Authentication > Users > Add User:
   - `admin@kosthub.com` / `password123`
   - `penghuni@kosthub.com` / `password123`
8. After creating users, manually insert their profile rows (use their UUID from Auth > Users):

```sql
-- Replace <ADMIN_UUID> and <PENGHUNI_UUID> with actual IDs from Auth > Users
insert into profiles (user_id, email, full_name, role, tenant_id)
values ('<ADMIN_UUID>', 'admin@kosthub.com', 'Admin KostHub', 'admin', null);

insert into profiles (user_id, email, full_name, role, tenant_id)
values ('<PENGHUNI_UUID>', 'penghuni@kosthub.com', 'Andi Penghuni', 'tenant', '00000000-0000-0000-0000-000000000001');
```

---

### Task 3: Auth Flow & Login UI

**Files:**
- Create: `app/pages/login.vue`
- Create: `app/middleware/auth.ts`

- [ ] **Step 3.1: Write `app/pages/login.vue`**

```vue
<script setup lang="ts">
const client = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''

  const { data, error: authError } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
    return
  }

  // Fetch profile for role-based redirect
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    router.push('/dashboard/pengelola')
  } else {
    router.push('/dashboard/penghuni')
  }

  loading.value = false
}

function handleLogout() {
  const client = useSupabaseClient()
  client.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Masuk ke KostHub</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="******"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>
```

- [ ] **Step 3.2: Write `app/middleware/auth.ts`**

```typescript
export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Allow unauthenticated access only to /login
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // If already logged in and trying to access /login, redirect to dashboard
  if (user.value && to.path === '/login') {
    return navigateTo('/dashboard/penghuni')
  }
})
```

- [ ] **Step 3.3: Protect dashboard routes with auth middleware**

In each dashboard page file (created in Task 4), add at the top:

```typescript
definePageMeta({
  middleware: 'auth',
})
```

---

### Task 4: Role Middleware & useRole Composable

**Files:**
- Create: `app/middleware/role.ts`
- Create: `app/composables/useRole.ts`

- [ ] **Step 4.1: Write `app/composables/useRole.ts`**

```typescript
import type { User } from '@supabase/supabase-js'

export const useRole = () => {
  const client = useSupabaseClient()

  async function fetchProfile(userId: string) {
    const { data } = await client
      .from('profiles')
      .select('role, tenant_id')
      .eq('user_id', userId)
      .single()

    return data as { role: string; tenant_id: string | null } | null
  }

  return {
    fetchProfile,
  }
}
```

- [ ] **Step 4.2: Write `app/middleware/role.ts`**

```typescript
export default defineNuxtRouteMiddleware(async (to) => {
  const user = useSupabaseUser()
  const { fetchProfile } = useRole()

  if (!user.value) {
    return navigateTo('/login')
  }

  const profile = await fetchProfile(user.value.id)

  if (!profile) {
    return navigateTo('/login')
  }

  // Admin-only routes
  if (to.path.startsWith('/dashboard/pengelola') && profile.role !== 'admin') {
    return navigateTo('/dashboard/penghuni')
  }

  // Tenant-only routes
  if (to.path.startsWith('/dashboard/penghuni') && profile.role !== 'tenant') {
    return navigateTo('/dashboard/pengelola')
  }
})
```

---

### Task 5: UI Shell — Layout & Dashboard Pages

**Files:**
- Create: `app/app.vue`
- Create: `app/layouts/default.vue`
- Create: `app/pages/dashboard/penghuni.vue`
- Create: `app/pages/dashboard/pengelola.vue`

- [ ] **Step 5.1: Write `app/app.vue`**

```vue
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
```

- [ ] **Step 5.2: Write `app/layouts/default.vue`**

```vue
<script setup lang="ts">
const user = useSupabaseUser()
const client = useSupabaseClient()

async function handleLogout() {
  await client.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top navigation bar -->
    <header v-if="user" class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-lg font-semibold text-gray-800">KostHub</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">{{ user.email }}</span>
          <button
            @click="handleLogout"
            class="text-sm text-red-600 hover:text-red-800"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
```

- [ ] **Step 5.3: Write `app/pages/dashboard/penghuni.vue`**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      Dashboard Penghuni
    </h2>

    <!-- Placeholder cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Tagihan Bulan Ini</p>
        <p class="text-2xl font-bold mt-1">Rp--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Status Pembayaran</p>
        <p class="text-sm font-medium mt-1 text-yellow-600">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Laporan Aktif</p>
        <p class="text-2xl font-bold mt-1">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
    </div>

    <!-- Placeholder sections -->
    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Pengumuman</h3>
      <p class="text-gray-400 italic">Belum ada pengumuman.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Tagihan Terbaru</h3>
      <p class="text-gray-400 italic">Data tagihan akan tersedia di Sprint 2.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold mb-3">Laporan Kerusakan</h3>
      <p class="text-gray-400 italic">Data laporan akan tersedia di Sprint 2.</p>
    </div>
  </div>
</template>
```

- [ ] **Step 5.4: Write `app/pages/dashboard/pengelola.vue`**

```vue
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      Dashboard Pengelola
    </h2>

    <!-- Placeholder metric cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Total Penghuni</p>
        <p class="text-2xl font-bold mt-1">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Menunggak</p>
        <p class="text-2xl font-bold mt-1 text-red-600">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Laporan Aktif</p>
        <p class="text-2xl font-bold mt-1 text-yellow-600">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
    </div>

    <!-- Placeholder management sections -->
    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Status Pembayaran</h3>
      <p class="text-gray-400 italic">Tabel tagihan akan tersedia di Sprint 2.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Laporan Kerusakan</h3>
      <p class="text-gray-400 italic">Daftar tiket akan tersedia di Sprint 2.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold mb-3">Buat Pengumuman</h3>
      <p class="text-gray-400 italic">Form pengumuman akan tersedia di Sprint 2.</p>
    </div>
  </div>
</template>
```

---

### Task 6: Seed Data & Validation

**Files:**
- No new files. Uses `sql/002_seed.sql` from Task 2 and manual Supabase dashboard setup.

- [ ] **Step 6.1: Create test users in Supabase**

Action in Supabase Dashboard → Authentication → Users → Add User:
1. `admin@kosthub.com` / `password123`
2. `penghuni@kosthub.com` / `password123`

- [ ] **Step 6.2: Insert profile rows**

Run in Supabase SQL Editor (replace UUIDs with actual values from Users list):

```sql
insert into profiles (user_id, email, full_name, role, tenant_id)
values ('<ADMIN_UUID>', 'admin@kosthub.com', 'Admin KostHub', 'admin', null);

insert into profiles (user_id, email, full_name, role, tenant_id)
values ('<PENGHUNI_UUID>', 'penghuni@kosthub.com', 'Andi Penghuni', 'tenant', '00000000-0000-0000-0000-000000000001');
```

- [ ] **Step 6.3: Run validation checkpoint**

Start dev server: `npm run dev`

Verify each:

| # | Check | Expected Result |
|---|-------|----------------|
| 1 | Visit `http://localhost:3000` | Redirected to `/login` |
| 2 | Login as `penghuni@kosthub.com` | Redirected to `/dashboard/penghuni` |
| 3 | Dashboard penghuni | 3 placeholder cards + 3 sections visible |
| 4 | Manually navigate to `/dashboard/pengelola` | Redirected back to `/dashboard/penghuni` |
| 5 | Logout | Redirected to `/login` |
| 6 | Login as `admin@kosthub.com` | Redirected to `/dashboard/pengelola` |
| 7 | Dashboard pengelola | 3 placeholder metric cards + 3 sections visible |
| 8 | Manually navigate to `/dashboard/penghuni` | Stays on `/dashboard/pengelola` (or allowed, depending on policy — both OK) |
| 9 | Refresh page while logged in | Session persists (cookie-based) |
| 10 | Logout again | Returns to `/login` |

---

## Self-Review Checklist

- [ ] **Spec coverage**: Sprint 1 DoD items covered:
  - Project bootstrap → Task 1
  - Supabase connected + env vars → Task 1 (.env.example) + Task 2 (SQL)
  - Tables ready (profiles, bills, tickets, announcements) → Task 2
  - Login/logout → Task 3 + layout logout button
  - Redirect + route protection → Task 3 (auth middleware) + Task 4 (role middleware)
  - Shell UI pages → Task 5
  - Seed/mock data → Task 6
  - Happy path → Task 6 validation
- [ ] **No placeholder code** — every file has complete, working content
- [ ] **Type consistency** — `useRole().fetchProfile()` returns `{ role, tenant_id }`, middleware uses it consistently
- [ ] **No assumptions about Nuxt 4 project init** — uses `nuxi@latest init`
- [ ] **Scope discipline** — no CRUD operations, no billing logic, no announcement create/edit
