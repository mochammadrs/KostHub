<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'admin'
})

const client = useSupabaseClient()
const tenants = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')
const showModal = ref(false)
const selectedTenant = ref<any>(null)

async function loadTenants() {
  try {
    const { data, error } = await client
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    tenants.value = data || []
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const filteredTenants = computed(() => {
  if (!searchQuery.value) return tenants.value
  
  const query = searchQuery.value.toLowerCase()
  return tenants.value.filter(tenant =>
    tenant.name?.toLowerCase().includes(query) ||
    tenant.room_number?.toLowerCase().includes(query) ||
    tenant.email?.toLowerCase().includes(query) ||
    tenant.phone?.toLowerCase().includes(query)
  )
})

function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function openCreateModal() {
  selectedTenant.value = null
  showModal.value = true
}

function openEditModal(tenant: any) {
  selectedTenant.value = tenant
  showModal.value = true
}

async function handleDelete(tenant: any) {
  if (!confirm(`Hapus data ${tenant.name}?`)) return
  
  try {
    const { error } = await client
      .from('tenants')
      .delete()
      .eq('id', tenant.id)
    
    if (error) throw error
    await loadTenants()
  } catch (e: any) {
    alert('Gagal menghapus: ' + e.message)
  }
}

function handleModalSuccess() {
  loadTenants()
}

await loadTenants()
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Penghuni</h1>
        <p class="text-gray-500 mt-1">Kelola data penghuni kost Anda</p>
      </div>
      <button @click="openCreateModal" class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-600/30">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah Penghuni
      </button>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="px-6 py-4 border-b border-gray-100">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari penghuni..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>
      </div>

      <p v-if="loading" class="px-6 py-8 text-center text-gray-500">Memuat data...</p>

      <div v-else class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="bg-gray-50 border-b border-gray-100">
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Nama
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Kamar
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Kontak
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Tanggal Masuk
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filteredTenants.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-gray-400">
                {{ searchQuery ? 'Tidak ada hasil pencarian' : 'Belum ada data penghuni' }}
              </td>
            </tr>
            <tr v-for="tenant in filteredTenants" :key="tenant.id" class="hover:bg-gray-50 transition">
              <td class="px-6 py-4 text-sm font-medium text-gray-900">
                {{ tenant.name }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ tenant.room_number || '-' }}
              </td>
              <td class="px-6 py-4">
                <div class="space-y-1">
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>{{ tenant.email || '-' }}</span>
                  </div>
                  <div class="flex items-center gap-2 text-sm text-gray-600">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{{ tenant.phone || '-' }}</span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-600">
                {{ formatDate(tenant.move_in_date) }}
              </td>
              <td class="px-6 py-4">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                  Aktif
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button @click="openEditModal(tenant)" class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button @click="handleDelete(tenant)" class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <AdminTenantModal
      :show="showModal"
      :tenant="selectedTenant"
      @close="showModal = false"
      @success="handleModalSuccess"
    />
  </div>
</template>
