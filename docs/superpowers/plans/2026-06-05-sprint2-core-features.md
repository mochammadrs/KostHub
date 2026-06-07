# Sprint 2 Implementation Plan: Core Features & MVP Polish

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementasi fitur inti (Tagihan, Ticketing, Pengumuman) yang berfungsi 100% dengan data real, siap untuk MVP testing.

**Architecture:** Memanfaatkan Nuxt 4 server routes untuk API endpoints, Supabase untuk database & storage, dan composables untuk state management. Setiap modul berdiri sendiri sebagai domain terpisah.

**Tech Stack:** Nuxt 4, Nuxt Supabase, Supabase Storage, Tailwind CSS, TypeScript

---

## File Structure Mapping

### New Files
```
app/
  components/
    billing/
      BillCard.vue            # Card tagihan untuk penghuni
      BillPaymentProof.vue    # Upload bukti bayar
    tickets/
      TicketCard.vue          # Card laporan kerusakan
      TicketForm.vue          # Form buat laporan baru
    announcements/
      AnnouncementCard.vue    # Card pengumuman
  pages/
    dashboard/
      penghuni/
        billing.vue           # Halaman tagihan penghuni
        tickets.vue           # Halaman laporan penghuni
      pengelola/
        billing.vue           # Halaman manajemen tagihan admin
        billing/
          [id].vue            # Detail tagihan + verifikasi
        tickets.vue           # Halaman manajemen tiket admin
        tickets/
          [id].vue            # Detail tiket + update status
        announcements.vue     # Halaman buat pengumuman
        announcements/
          index.vue           # List semua pengumuman
  composables/
    useBilling.ts             # Composable billing operations
    useTickets.ts             # Composable ticket operations
    useAnnouncements.ts       # Composable announcement operations
  server/
    api/
      upload.ts               # API upload file ke Supabase Storage
```

### Modified Files
```
app/
  pages/
    dashboard/
      penghuni.vue            # + navigasi ke billing & tickets
      pengelola.vue           # + navigasi ke billing, tickets, announcements
  layouts/
    default.vue               # Sidebar/nav untuk mobile-friendly
  composables/
    useRole.ts                # Tambah fetchTenantId helper
sql/
  004_bills_storage.sql       # Migration: storage bucket config + RLS
```

---

### Task 1: Billing Storage & Database Migration

**Files:**
- Create: `sql/004_bills_storage.sql`
- Create: `app/server/api/upload.ts`

- [ ] **Step 1: Buat migration storage untuk bukti bayar**

```sql
-- 004_bills_storage.sql
-- Migration: Add storage support for payment proofs

-- Add proof_url column to bills
alter table bills add column if not exists proof_url text;
alter table bills add column if not exists paid_at timestamptz;

-- Allow authenticated users to upload files
insert into storage.buckets (id, name, public) values ('payment-proofs', 'payment-proofs', true);

create policy "Authenticated users can upload payment proofs"
  on storage.objects for insert
  with check (
    bucket_id = 'payment-proofs'
    and auth.role() = 'authenticated'
  );

create policy "Anyone can view payment proofs"
  on storage.objects for select
  using (bucket_id = 'payment-proofs');

-- Add RLS policy for tenants to update their own bills proof
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
```

- [ ] **Step 2: Buat API upload endpoint**

```typescript
// app/server/api/upload.ts
export default defineEventHandler(async (event) => {
  const client = serverSupabaseClient(event)
  const formData = await readMultipartFormData(event)
  
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const file = formData[0]
  const filename = `${Date.now()}-${file.filename}`
  
  const { data, error } = await client.storage
    .from('payment-proofs')
    .upload(filename, file.data, {
      contentType: file.type || 'image/jpeg',
    })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const { data: { publicUrl } } = client.storage
    .from('payment-proofs')
    .getPublicUrl(data.path)

  return { url: publicUrl, path: data.path }
})
```

- [ ] **Step 3: Verify migration is syntactically correct**

Read the file once more to confirm no obvious issues.

---

### Task 2: Composable Billing

**Files:**
- Create: `app/composables/useBilling.ts`

- [ ] **Step 1: Create composable billing**

```typescript
// app/composables/useBilling.ts
export const useBilling = () => {
  const client = useSupabaseClient()

  async function fetchBills(tenantId: string) {
    const { data, error } = await client
      .from('bills')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false })

    if (error) throw error
    return data
  }

  async function fetchCurrentBill(tenantId: string) {
    const now = new Date().toISOString()
    const { data, error } = await client
      .from('bills')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('due_date', now.split('T')[0])
      .order('due_date', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async function updatePaymentProof(billId: string, proofUrl: string) {
    const { error } = await client
      .from('bills')
      .update({ 
        proof_url: proofUrl, 
        status: 'paid',
        paid_at: new Date().toISOString()
      })
      .eq('id', billId)

    if (error) throw error
  }

  // Admin functions
  async function fetchAllBills(tenantId?: string) {
    let query = client.from('bills').select('*, tenants(name)')
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  }

  async function verifyPayment(billId: string, status: 'paid' | 'pending') {
    const { error } = await client
      .from('bills')
      .update({ status })
      .eq('id', billId)

    if (error) throw error
  }

  async function createBill(bill: {
    tenant_id: string
    title: string
    amount: number
    due_date: string
  }) {
    const { data, error } = await client
      .from('bills')
      .insert(bill)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function deleteBill(billId: string) {
    const { error } = await client
      .from('bills')
      .delete()
      .eq('id', billId)

    if (error) throw error
  }

  return {
    fetchBills,
    fetchCurrentBill,
    updatePaymentProof,
    fetchAllBills,
    verifyPayment,
    createBill,
    deleteBill,
  }
}
```

---

### Task 3: Composable Tickets

**Files:**
- Create: `app/composables/useTickets.ts`

- [ ] **Step 1: Create composable tickets**

```typescript
// app/composables/useTickets.ts
export const useTickets = () => {
  const client = useSupabaseClient()

  async function fetchTickets(tenantId: string) {
    const { data, error } = await client
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async function createTicket(ticket: {
    tenant_id: string
    title: string
    description?: string
    category?: string
  }) {
    const { data, error } = await client
      .from('tickets')
      .insert(ticket)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Admin functions
  async function fetchAllTickets() {
    const { data, error } = await client
      .from('tickets')
      .select('*, tenants(name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async function updateTicketStatus(ticketId: string, status: 'menunggu' | 'diproses' | 'selesai') {
    const { error } = await client
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)

    if (error) throw error
  }

  return {
    fetchTickets,
    createTicket,
    fetchAllTickets,
    updateTicketStatus,
  }
}
```

---

### Task 4: Composable Announcements

**Files:**
- Create: `app/composables/useAnnouncements.ts`

- [ ] **Step 1: Create composable announcements**

```typescript
// app/composables/useAnnouncements.ts
export const useAnnouncements = () => {
  const client = useSupabaseClient()

  async function fetchAnnouncements(tenantId?: string | null) {
    let query = client
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async function createAnnouncement(announcement: {
    tenant_id?: string | null
    title: string
    content: string
  }) {
    const { data, error } = await client
      .from('announcements')
      .insert(announcement)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function deleteAnnouncement(id: string) {
    const { error } = await client
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return {
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
  }
}
```

---

### Task 5: Billing UI - Penghuni

**Files:**
- Create: `app/components/billing/BillCard.vue`
- Create: `app/components/billing/BillPaymentProof.vue`
- Create: `app/pages/dashboard/penghuni/billing.vue`

- [ ] **Step 1: Create BillCard component**

```vue
<!-- app/components/billing/BillCard.vue -->
<script setup lang="ts">
defineProps<{
  bill: {
    id: string
    title: string
    amount: number
    due_date: string
    status: string
    proof_url?: string | null
  }
}>()

const statusLabels: Record<string, string> = {
  pending: 'Belum Dibayar',
  paid: 'Lunas',
  overdue: 'Terlambat',
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  paid: 'text-green-600 bg-green-50 border-green-200',
  overdue: 'text-red-600 bg-red-50 border-red-200',
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-sm border">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h4 class="font-semibold text-gray-900">{{ bill.title }}</h4>
        <p class="text-sm text-gray-500 mt-1">Jatuh tempo: {{ formatDate(bill.due_date) }}</p>
      </div>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
        :class="statusColors[bill.status] || statusColors.pending"
      >
        {{ statusLabels[bill.status] || bill.status }}
      </span>
    </div>

    <p class="text-2xl font-bold text-gray-900 mb-4">
      {{ formatCurrency(bill.amount) }}
    </p>

    <div v-if="bill.proof_url" class="mb-4">
      <p class="text-sm text-gray-500 mb-2">Bukti Pembayaran:</p>
      <a
        :href="bill.proof_url"
        target="_blank"
        class="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
      >
        Lihat Bukti
      </a>
    </div>

    <slot name="actions" :bill="bill" />
  </div>
</template>
```

- [ ] **Step 2: Create BillPaymentProof component**

```vue
<!-- app/components/billing/BillPaymentProof.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  uploaded: [url: string]
}>()

const uploading = ref(false)
const error = ref('')

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const { data, error: uploadError } = await useFetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (uploadError.value) throw new Error(uploadError.value.message)

    emit('uploaded', data.value.url)
  } catch (e: any) {
    error.value = e.message || 'Gagal mengunggah bukti'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div>
    <label class="relative cursor-pointer">
      <div
        class="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
        :class="{ 'opacity-50 pointer-events-none': uploading }"
      >
        <span v-if="uploading" class="text-sm text-gray-500">Mengunggah...</span>
        <span v-else class="text-sm text-gray-600">Upload Bukti Pembayaran</span>
      </div>
      <input
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileUpload"
        :disabled="uploading"
      />
    </label>
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
  </div>
</template>
```

- [ ] **Step 3: Create billing page for penghuni**

```vue
<!-- app/pages/dashboard/penghuni/billing.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchProfile } = useRole()
const { fetchBills, updatePaymentProof } = useBilling()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const bills = ref<any[]>([])
const loading = ref(true)
const error = ref('')

async function loadBills() {
  if (!profile?.tenant_id) {
    loading.value = false
    return
  }
  try {
    bills.value = await fetchBills(profile.tenant_id)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleProofUploaded(billId: string, url: string) {
  try {
    await updatePaymentProof(billId, url)
    await loadBills()
  } catch (e: any) {
    error.value = e.message
  }
}

await loadBills()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Tagihan Saya</h2>

    <p v-if="loading" class="text-gray-500">Memuat tagihan...</p>
    <p v-else-if="bills.length === 0" class="text-gray-400 italic">
      Belum ada tagihan.
    </p>

    <div v-else class="space-y-4">
      <BillCard v-for="bill in bills" :key="bill.id" :bill="bill">
        <template #actions="{ bill: b }">
          <div v-if="b.status === 'pending' || b.status === 'overdue'" class="mt-4">
            <BillPaymentProof @uploaded="(url) => handleProofUploaded(b.id, url)" />
          </div>
          <p v-else-if="b.status === 'paid'" class="text-sm text-green-600 mt-2">
            ✓ Pembayaran telah diverifikasi
          </p>
        </template>
      </BillCard>
    </div>

    <p v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</p>
  </div>
</template>
```

---

### Task 6: Tickets UI - Penghuni

**Files:**
- Create: `app/components/tickets/TicketForm.vue`
- Create: `app/components/tickets/TicketCard.vue`
- Create: `app/pages/dashboard/penghuni/tickets.vue`

- [ ] **Step 1: Create TicketForm component**

```vue
<!-- app/components/tickets/TicketForm.vue -->
<script setup lang="ts">
const emit = defineEmits<{
  created: []
}>()

const categories = [
  { value: 'listrik', label: 'Listrik' },
  { value: 'air', label: 'Air / PAM' },
  { value: 'ac', label: 'AC' },
  { value: 'wifi', label: 'WiFi / Internet' },
  { value: 'kebersihan', label: 'Kebersihan' },
  { value: 'lainnya', label: 'Lainnya' },
]

const showForm = ref(false)
const title = ref('')
const description = ref('')
const category = ref('')
const submitting = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!title.value || !category.value) return

  submitting.value = true
  error.value = ''

  try {
    const { fetchProfile } = useRole()
    const { createTicket } = useTickets()
    const client = useSupabaseClient()
    const { data: { user } } = await client.auth.getUser()
    const profile = await fetchProfile(user!.id)

    if (!profile?.tenant_id) {
      throw new Error('Profil tidak ditemukan')
    }

    await createTicket({
      tenant_id: profile.tenant_id,
      title: title.value,
      description: description.value,
      category: category.value,
    })

    title.value = ''
    description.value = ''
    category.value = ''
    showForm.value = false
    emit('created')
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <button
      v-if="!showForm"
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
      @click="showForm = true"
    >
      + Buat Laporan Baru
    </button>

    <form v-else @submit.prevent="handleSubmit" class="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      <h4 class="font-semibold text-gray-900">Laporan Kerusakan Baru</h4>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <select
          v-model="category"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>Pilih kategori</option>
          <option v-for="cat in categories" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Judul</label>
        <input
          v-model="title"
          type="text"
          required
          placeholder="Contoh: AC tidak dingin"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="Jelaskan detail kerusakan..."
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <div class="flex gap-2">
        <button
          type="submit"
          :disabled="submitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {{ submitting ? 'Mengirim...' : 'Kirim Laporan' }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          @click="showForm = false"
        >
          Batal
        </button>
      </div>
    </form>
  </div>
</template>
```

- [ ] **Step 2: Create TicketCard component**

```vue
<!-- app/components/tickets/TicketCard.vue -->
<script setup lang="ts">
defineProps<{
  ticket: {
    id: string
    title: string
    description?: string
    category?: string
    status: string
    created_at: string
  }
}>()

const statusLabels: Record<string, string> = {
  menunggu: 'Menunggu',
  diproses: 'Diproses',
  selesai: 'Selesai',
}

const statusColors: Record<string, string> = {
  menunggu: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  diproses: 'text-blue-600 bg-blue-50 border-blue-200',
  selesai: 'text-green-600 bg-green-50 border-green-200',
}

const categoryLabels: Record<string, string> = {
  listrik: 'Listrik',
  air: 'Air',
  ac: 'AC',
  wifi: 'WiFi',
  kebersihan: 'Kebersihan',
  lainnya: 'Lainnya',
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="bg-white p-6 rounded-lg shadow-sm border">
    <div class="flex items-start justify-between mb-2">
      <h4 class="font-semibold text-gray-900">{{ ticket.title }}</h4>
      <span
        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap"
        :class="statusColors[ticket.status] || statusColors.menunggu"
      >
        {{ statusLabels[ticket.status] || ticket.status }}
      </span>
    </div>

    <div class="flex gap-2 mb-3">
      <span
        v-if="ticket.category"
        class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600"
      >
        {{ categoryLabels[ticket.category] || ticket.category }}
      </span>
      <span class="text-xs text-gray-400">
        {{ formatDate(ticket.created_at) }}
      </span>
    </div>

    <p v-if="ticket.description" class="text-sm text-gray-600">
      {{ ticket.description }}
    </p>
  </div>
</template>
```

- [ ] **Step 3: Create tickets page for penghuni**

```vue
<!-- app/pages/dashboard/penghuni/tickets.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchProfile } = useRole()
const { fetchTickets } = useTickets()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const tickets = ref<any[]>([])
const loading = ref(true)
const error = ref('')

async function loadTickets() {
  if (!profile?.tenant_id) return
  try {
    tickets.value = await fetchTickets(profile.tenant_id)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function onTicketCreated() {
  await loadTickets()
}

await loadTickets()
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Laporan Kerusakan</h2>
    </div>

    <TicketForm @created="onTicketCreated" class="mb-6" />

    <p v-if="loading" class="text-gray-500">Memuat laporan...</p>
    <p v-else-if="tickets.length === 0" class="text-gray-400 italic">
      Belum ada laporan kerusakan.
    </p>

    <div v-else class="space-y-4">
      <TicketCard v-for="ticket in tickets" :key="ticket.id" :ticket="ticket" />
    </div>

    <p v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</p>
  </div>
</template>
```

---

### Task 7: Admin Billing Management

**Files:**
- Create: `app/pages/dashboard/pengelola/billing.vue`

- [ ] **Step 1: Create billing management page for admin**

```vue
<!-- app/pages/dashboard/pengelola/billing.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchAllBills, verifyPayment, createBill } = useBilling()

const bills = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// New bill form
const showForm = ref(false)
const tenantId = ref('')
const title = ref('')
const amount = ref(0)
const dueDate = ref('')
const submitting = ref(false)
const tenants = ref<any[]>([])

async function loadBills() {
  try {
    bills.value = await fetchAllBills()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadTenants() {
  const client = useSupabaseClient()
  const { data } = await client.from('tenants').select('*')
  if (data) tenants.value = data
}

async function handleVerify(billId: string, status: 'paid' | 'pending') {
  try {
    await verifyPayment(billId, status)
    await loadBills()
  } catch (e: any) {
    error.value = e.message
  }
}

async function handleCreateBill() {
  if (!title.value || !amount.value || !dueDate.value) return

  submitting.value = true
  try {
    await createBill({
      tenant_id: tenantId.value || undefined,
      title: title.value,
      amount: amount.value,
      due_date: dueDate.value,
    })
    showForm.value = false
    title.value = ''
    amount.value = 0
    dueDate.value = ''
    tenantId.value = ''
    await loadBills()
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

await Promise.all([loadBills(), loadTenants()])
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Manajemen Tagihan</h2>
      <button
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        @click="showForm = !showForm"
      >
        + Tagihan Baru
      </button>
    </div>

    <!-- New bill form -->
    <form v-if="showForm" @submit.prevent="handleCreateBill" class="bg-white p-6 rounded-lg shadow-sm border mb-6 space-y-4">
      <h3 class="font-semibold text-gray-900">Buat Tagihan Baru</h3>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Penghuni</label>
        <select v-model="tenantId" required class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
          <option value="" disabled>Pilih penghuni</option>
          <option v-for="t in tenants" :key="t.id" :value="t.id">{{ t.name }}</option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Judul Tagihan</label>
        <input v-model="title" type="text" required placeholder="Contoh: Tagihan Bulan Juni"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
        <input v-model.number="amount" type="number" required min="0"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo</label>
        <input v-model="dueDate" type="date" required
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
      </div>

      <div class="flex gap-2">
        <button type="submit" :disabled="submitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
          {{ submitting ? 'Menyimpan...' : 'Simpan' }}
        </button>
        <button type="button" class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm" @click="showForm = false">
          Batal
        </button>
      </div>
    </form>

    <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>
    <p v-if="loading" class="text-gray-500">Memuat tagihan...</p>
    <p v-else-if="bills.length === 0" class="text-gray-400 italic">Belum ada tagihan.</p>

    <div v-else class="overflow-x-auto">
      <table class="w-full bg-white rounded-lg shadow-sm border text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Penghuni</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Judul</th>
            <th class="text-right px-4 py-3 font-medium text-gray-600">Jumlah</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Jatuh Tempo</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Status</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Bukti</th>
            <th class="text-left px-4 py-3 font-medium text-gray-600">Aksi</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="bill in bills" :key="bill.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">{{ bill.tenants?.name || '-' }}</td>
            <td class="px-4 py-3">{{ bill.title }}</td>
            <td class="px-4 py-3 text-right font-medium">
              {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bill.amount) }}
            </td>
            <td class="px-4 py-3">{{ new Date(bill.due_date).toLocaleDateString('id-ID') }}</td>
            <td class="px-4 py-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                :class="{
                  'text-yellow-600 bg-yellow-50 border-yellow-200': bill.status === 'pending',
                  'text-green-600 bg-green-50 border-green-200': bill.status === 'paid',
                  'text-red-600 bg-red-50 border-red-200': bill.status === 'overdue',
                }">
                {{ bill.status === 'pending' ? 'Pending' : bill.status === 'paid' ? 'Lunas' : 'Terlambat' }}
              </span>
            </td>
            <td class="px-4 py-3">
              <a v-if="bill.proof_url" :href="bill.proof_url" target="_blank" class="text-blue-600 hover:underline text-xs">
                Lihat
              </a>
              <span v-else class="text-gray-400 text-xs">-</span>
            </td>
            <td class="px-4 py-3">
              <button v-if="bill.status === 'pending' || bill.status === 'overdue'"
                @click="handleVerify(bill.id, 'paid')"
                class="text-xs text-green-600 hover:text-green-800 font-medium">
                Verifikasi Lunas
              </button>
              <button v-if="bill.status === 'paid'"
                @click="handleVerify(bill.id, 'pending')"
                class="text-xs text-yellow-600 hover:text-yellow-800 font-medium">
                Batalkan
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
```

---

### Task 8: Admin Tickets Management

**Files:**
- Create: `app/pages/dashboard/pengelola/tickets.vue`

- [ ] **Step 1: Create tickets management page for admin**

```vue
<!-- app/pages/dashboard/pengelola/tickets.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchAllTickets, updateTicketStatus } = useTickets()

const tickets = ref<any[]>([])
const loading = ref(true)
const error = ref('')

async function loadTickets() {
  try {
    tickets.value = await fetchAllTickets()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleStatusUpdate(ticketId: string, status: 'menunggu' | 'diproses' | 'selesai') {
  try {
    await updateTicketStatus(ticketId, status)
    await loadTickets()
  } catch (e: any) {
    error.value = e.message
  }
}

const statusLabels: Record<string, string> = {
  menunggu: 'Menunggu',
  diproses: 'Diproses',
  selesai: 'Selesai',
}

const statusColors: Record<string, string> = {
  menunggu: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  diproses: 'text-blue-600 bg-blue-50 border-blue-200',
  selesai: 'text-green-600 bg-green-50 border-green-200',
}

const categoryLabels: Record<string, string> = {
  listrik: 'Listrik',
  air: 'Air',
  ac: 'AC',
  wifi: 'WiFi',
  kebersihan: 'Kebersihan',
  lainnya: 'Lainnya',
}

await loadTickets()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Laporan Kerusakan</h2>

    <p v-if="loading" class="text-gray-500">Memuat laporan...</p>
    <p v-else-if="tickets.length === 0" class="text-gray-400 italic">Belum ada laporan.</p>

    <div v-else class="space-y-4">
      <div v-for="ticket in tickets" :key="ticket.id"
        class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-start justify-between mb-2">
          <div>
            <h4 class="font-semibold text-gray-900">{{ ticket.title }}</h4>
            <p class="text-xs text-gray-400 mt-1">
              {{ ticket.tenants?.name || 'Unknown' }} •
              {{ new Date(ticket.created_at).toLocaleDateString('id-ID') }}
            </p>
          </div>
          <select
            :value="ticket.status"
            @change="(e) => handleStatusUpdate(ticket.id, (e.target as HTMLSelectElement).value as any)"
            class="text-xs rounded-md border border-gray-300 px-2 py-1"
            :class="statusColors[ticket.status]"
          >
            <option value="menunggu">Menunggu</option>
            <option value="diproses">Diproses</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>

        <div class="flex gap-2 mb-2">
          <span v-if="ticket.category"
            class="inline-flex items-center px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">
            {{ categoryLabels[ticket.category] || ticket.category }}
          </span>
        </div>

        <p v-if="ticket.description" class="text-sm text-gray-600">{{ ticket.description }}</p>
      </div>
    </div>

    <p v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</p>
  </div>
</template>
```

---

### Task 9: Admin Announcements Management

**Files:**
- Create: `app/pages/dashboard/pengelola/announcements.vue`

- [ ] **Step 1: Create announcements management page for admin**

```vue
<!-- app/pages/dashboard/pengelola/announcements.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchAnnouncements, createAnnouncement, deleteAnnouncement } = useAnnouncements()

const announcements = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// Form
const title = ref('')
const content = ref('')
const submitting = ref(false)

async function loadAnnouncements() {
  try {
    announcements.value = await fetchAnnouncements()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleCreate() {
  if (!title.value || !content.value) return

  submitting.value = true
  try {
    await createAnnouncement({
      title: title.value,
      content: content.value,
    })
    title.value = ''
    content.value = ''
    await loadAnnouncements()
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: string) {
  if (!confirm('Hapus pengumuman ini?')) return
  try {
    await deleteAnnouncement(id)
    await loadAnnouncements()
  } catch (e: any) {
    error.value = e.message
  }
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

await loadAnnouncements()
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">Pengumuman</h2>

    <!-- Create form -->
    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="font-semibold text-gray-900 mb-4">Buat Pengumuman Baru</h3>
      <form @submit.prevent="handleCreate" class="space-y-4">
        <div>
          <input v-model="title" type="text" required placeholder="Judul pengumuman"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <textarea v-model="content" required rows="4" placeholder="Isi pengumuman..."
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        <button type="submit" :disabled="submitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50">
          {{ submitting ? 'Mengirim...' : 'Terbitkan' }}
        </button>
      </form>
    </div>

    <!-- List -->
    <p v-if="loading" class="text-gray-500">Memuat pengumuman...</p>
    <p v-else-if="announcements.length === 0" class="text-gray-400 italic">Belum ada pengumuman.</p>

    <div v-else class="space-y-4">
      <div v-for="ann in announcements" :key="ann.id"
        class="bg-white p-6 rounded-lg shadow-sm border">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-semibold text-gray-900">{{ ann.title }}</h4>
            <p class="text-xs text-gray-400 mt-1">{{ formatDate(ann.created_at) }}</p>
          </div>
          <button @click="handleDelete(ann.id)"
            class="text-xs text-red-500 hover:text-red-700">
            Hapus
          </button>
        </div>
        <p class="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{{ ann.content }}</p>
      </div>
    </div>
  </div>
</template>
```

---

### Task 10: Update Dashboard Navigasi

**Files:**
- Modify: `app/pages/dashboard/penghuni.vue`
- Modify: `app/pages/dashboard/pengelola.vue`

- [ ] **Step 1: Update penghuni dashboard with navigation tabs**

```vue
<!-- app/pages/dashboard/penghuni.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchProfile } = useRole()
const { fetchCurrentBill } = useBilling()
const { fetchTickets } = useTickets()
const { fetchAnnouncements } = useAnnouncements()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const currentBill = ref<any>(null)
const activeTickets = ref(0)
const announcements = ref<any[]>([])
const loading = ref(true)

async function loadData() {
  if (!profile?.tenant_id) return
  try {
    const [bill, tickets, anns] = await Promise.all([
      fetchCurrentBill(profile.tenant_id),
      fetchTickets(profile.tenant_id),
      fetchAnnouncements(profile.tenant_id),
    ])
    currentBill.value = bill
    activeTickets.value = tickets.filter((t: any) => t.status !== 'selesai').length
    announcements.value = anns
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

await loadData()
</script>

<template>
  <div>
    <!-- Navigation tabs -->
    <nav class="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
      <NuxtLink
        to="/dashboard/penghuni"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path === '/dashboard/penghuni'
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        to="/dashboard/penghuni/billing"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/penghuni/billing')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Tagihan
      </NuxtLink>
      <NuxtLink
        to="/dashboard/penghuni/tickets"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/penghuni/tickets')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Laporan
      </NuxtLink>
    </nav>

    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      Dashboard Penghuni
    </h2>

    <p v-if="loading" class="text-gray-500">Memuat data...</p>

    <template v-else>
      <!-- Metric cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <p class="text-sm text-gray-500">Tagihan Bulan Ini</p>
          <p class="text-2xl font-bold mt-1">
            {{ currentBill
              ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(currentBill.amount)
              : 'Tidak ada' }}
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <p class="text-sm text-gray-500">Status Pembayaran</p>
          <p class="text-sm font-medium mt-1"
            :class="currentBill?.status === 'paid' ? 'text-green-600' : currentBill?.status === 'overdue' ? 'text-red-600' : 'text-yellow-600'">
            {{ currentBill ? (currentBill.status === 'paid' ? '✓ Lunas' : currentBill.status === 'overdue' ? 'Terlambat' : 'Belum Dibayar') : '-' }}
          </p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <p class="text-sm text-gray-500">Laporan Aktif</p>
          <p class="text-2xl font-bold mt-1" :class="activeTickets > 0 ? 'text-yellow-600' : ''">
            {{ activeTickets }}
          </p>
        </div>
      </div>

      <!-- Announcements -->
      <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 class="text-lg font-semibold mb-3">Pengumuman</h3>
        <div v-if="announcements.length === 0" class="text-gray-400 italic">Belum ada pengumuman.</div>
        <div v-else class="space-y-4">
          <div v-for="ann in announcements.slice(0, 5)" :key="ann.id"
            class="pb-3 border-b border-gray-100 last:border-0">
            <h4 class="font-medium text-gray-900">{{ ann.title }}</h4>
            <p class="text-xs text-gray-400 mt-1">{{ new Date(ann.created_at).toLocaleDateString('id-ID') }}</p>
            <p class="text-sm text-gray-600 mt-1">{{ ann.content }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
```

- [ ] **Step 2: Update pengelola dashboard with navigation tabs**

```vue
<!-- app/pages/dashboard/pengelola.vue -->
<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchAllBills } = useBilling()
const { fetchAllTickets } = useTickets()
const { fetchAnnouncements } = useAnnouncements()
const client = useSupabaseClient()

const totalTenants = ref(0)
const pendingBills = ref(0)
const activeTickets = ref(0)
const announcements = ref<any[]>([])
const loading = ref(true)

async function loadData() {
  try {
    const { count: tenantCount } = await client.from('tenants').select('*', { count: 'exact', head: true })
    totalTenants.value = tenantCount || 0

    const [bills, tickets, anns] = await Promise.all([
      fetchAllBills(),
      fetchAllTickets(),
      fetchAnnouncements(),
    ])
    pendingBills.value = bills.filter((b: any) => b.status === 'pending' || b.status === 'overdue').length
    activeTickets.value = tickets.filter((t: any) => t.status !== 'selesai').length
    announcements.value = anns
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

await loadData()
</script>

<template>
  <div>
    <!-- Navigation tabs -->
    <nav class="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
      <NuxtLink
        to="/dashboard/pengelola"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path === '/dashboard/pengelola'
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        to="/dashboard/pengelola/billing"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/pengelola/billing')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Tagihan
      </NuxtLink>
      <NuxtLink
        to="/dashboard/pengelola/tickets"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/pengelola/tickets')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Laporan
      </NuxtLink>
      <NuxtLink
        to="/dashboard/pengelola/announcements"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/pengelola/announcements')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Pengumuman
      </NuxtLink>
      <NuxtLink
        to="/dashboard/pengelola/invite"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/pengelola/invite')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Undang
      </NuxtLink>
    </nav>

    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      Dashboard Pengelola
    </h2>

    <p v-if="loading" class="text-gray-500">Memuat data...</p>

    <template v-else>
      <!-- Metric cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <p class="text-sm text-gray-500">Total Penghuni</p>
          <p class="text-2xl font-bold mt-1">{{ totalTenants }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <p class="text-sm text-gray-500">Menunggak</p>
          <p class="text-2xl font-bold mt-1 text-red-600">{{ pendingBills }}</p>
        </div>
        <div class="bg-white p-6 rounded-lg shadow-sm border">
          <p class="text-sm text-gray-500">Laporan Aktif</p>
          <p class="text-2xl font-bold mt-1 text-yellow-600">{{ activeTickets }}</p>
        </div>
      </div>

      <!-- Announcements -->
      <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <h3 class="text-lg font-semibold mb-3">Pengumuman Terbaru</h3>
        <div v-if="announcements.length === 0" class="text-gray-400 italic">Belum ada pengumuman.</div>
        <div v-else class="space-y-3">
          <div v-for="ann in announcements.slice(0, 3)" :key="ann.id"
            class="pb-2 border-b border-gray-100 last:border-0">
            <h4 class="font-medium text-gray-900 text-sm">{{ ann.title }}</h4>
            <p class="text-xs text-gray-500 mt-1">{{ ann.content }}</p>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
```

---

### Task 11: Add Navigation Tabs to Penghuni Dashboard Pages

**Files:**
- Modify: `app/pages/dashboard/penghuni/billing.vue` (add nav tabs)
- Modify: `app/pages/dashboard/penghuni/tickets.vue` (add nav tabs)

- [ ] **Step 1: Update billing page with nav tabs**

Edit `app/pages/dashboard/penghuni/billing.vue` - add the navigation tabs section before the `h2`:

```vue
    <!-- Navigation tabs -->
    <nav class="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
      <NuxtLink
        to="/dashboard/penghuni"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path === '/dashboard/penghuni'
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        to="/dashboard/penghuni/billing"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/penghuni/billing')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Tagihan
      </NuxtLink>
      <NuxtLink
        to="/dashboard/penghuni/tickets"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/penghuni/tickets')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Laporan
      </NuxtLink>
    </nav>
```

- [ ] **Step 2: Update tickets page with nav tabs**

Same nav tabs as above for `app/pages/dashboard/penghuni/tickets.vue`.

---

### Task 12: Validation Checkpoint

**Files:**
- Run validation commands

- [ ] **Step 1: Run lsp_diagnostics on all changed files**

```bash
# From project root - check Nuxt build
npm run build
```

- [ ] **Step 2: Verify all routes work**

Checklist:
- [ ] `/login` renders login form
- [ ] `/dashboard/penghuni` shows penghuni dashboard with data
- [ ] `/dashboard/penghuni/billing` shows tagihan with upload
- [ ] `/dashboard/penghuni/tickets` shows laporan with create form
- [ ] `/dashboard/pengelola` shows pengelola dashboard with metrics
- [ ] `/dashboard/pengelola/billing` shows tagihan management with verification
- [ ] `/dashboard/pengelola/tickets` shows tiket management with status updates
- [ ] `/dashboard/pengelola/announcements` shows pengumuman management with create
- [ ] `/dashboard/pengelola/invite` still works (invitation system)

- [ ] **Step 3: Clean build**

```bash
npm run build
```
Expected: Exit code 0, no errors
