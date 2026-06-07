<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'tenant'
})

const router = useRouter()
const { fetchProfile } = useRole()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const tenant = ref<any>(null)
const loading = ref(true)
const editing = ref(false)
const editName = ref('')
const editEmail = ref('')
const editPhone = ref('')
const submitting = ref(false)
const error = ref('')

async function loadTenant() {
  if (!profile?.tenant_id) return
  try {
    const { data } = await client
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single()
    
    if (data) {
      tenant.value = data
      editName.value = data.name || ''
      editEmail.value = data.email || ''
      editPhone.value = data.phone || ''
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function getInitials(name: string) {
  return name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

async function handleSaveProfile() {
  if (!editName.value) {
    error.value = 'Nama tidak boleh kosong'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    const { error: updateError } = await client
      .from('tenants')
      .update({
        name: editName.value,
        email: editEmail.value || null,
        phone: editPhone.value || null
      })
      .eq('id', tenant.value.id)

    if (updateError) throw updateError

    tenant.value.name = editName.value
    tenant.value.email = editEmail.value || null
    tenant.value.phone = editPhone.value || null
    editing.value = false
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}

async function logout() {
  const supabase = useSupabaseClient()
  await supabase.auth.signOut()
  router.push('/login')
}

await loadTenant()
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <NuxtLink to="/dashboard/penghuni" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="font-medium">Profil</span>
      </NuxtLink>
    </div>

    <p v-if="loading" class="text-gray-500 text-center py-8">Memuat data...</p>

    <template v-else-if="tenant">
      <div class="text-center mb-6">
        <div class="w-24 h-24 rounded-full bg-blue-600 text-white text-3xl font-bold flex items-center justify-center mx-auto mb-4">
          {{ getInitials(tenant.name) }}
        </div>
        <h2 class="text-xl font-bold text-gray-900">{{ tenant.name }}</h2>
        <p class="text-gray-500 mt-1">Penghuni Kamar {{ tenant.room_number || '-' }}</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5 mb-6">
        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Nama Lengkap</p>
            <p class="font-medium text-gray-900">{{ tenant.name }}</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Email</p>
            <p class="font-medium text-gray-900">{{ tenant.email || '-' }}</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Nomor Telepon</p>
            <p class="font-medium text-gray-900">{{ tenant.phone || '-' }}</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Nomor Kamar</p>
            <p class="font-medium text-gray-900">{{ tenant.room_number || '-' }}</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p class="text-sm text-gray-500">Tanggal Masuk</p>
            <p class="font-medium text-gray-900">{{ tenant.move_in_date ? formatDate(tenant.move_in_date) : '-' }}</p>
          </div>
        </div>
      </div>

      <button
        @click="editing = true"
        class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition mb-4"
      >
        Edit Profil
      </button>

      <button
        @click="logout"
        class="w-full py-3 text-red-600 font-medium hover:bg-red-50 rounded-xl transition"
      >
        Keluar
      </button>
    </template>

    <div v-if="editing" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="editing = false">
      <div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div class="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 class="text-lg font-semibold text-gray-900">Edit Profil</h3>
          <button @click="editing = false" class="text-gray-400 hover:text-gray-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input v-model="editName" required placeholder="Nama lengkap" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input v-model="editEmail" type="email" placeholder="Email" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
            <input v-model="editPhone" placeholder="Nomor telepon" class="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>
          <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
        </div>
        <div class="flex gap-3 p-6 border-t border-gray-100">
          <button @click="editing = false" class="flex-1 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg font-medium">Batal</button>
          <button @click="handleSaveProfile" :disabled="submitting" class="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{{ submitting ? 'Menyimpan...' : 'Simpan' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
