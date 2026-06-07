<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'admin'
})

const { fetchAllTickets, updateTicketStatus } = useTickets()

const tickets = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const statusFilter = ref('all')
const showRejectModal = ref(false)
const selectedTicketId = ref<string | null>(null)
const showGraceToast = ref(false)
const graceTicketId = ref<string | null>(null)
const graceTimeoutId = ref<number | null>(null)

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

function handleComplete(ticketId: string) {
  graceTicketId.value = ticketId
  showGraceToast.value = true
  
  graceTimeoutId.value = window.setTimeout(async () => {
    await handleStatusUpdate(ticketId, 'selesai')
    showGraceToast.value = false
    graceTicketId.value = null
  }, 5000)
}

function handleUndoComplete() {
  if (graceTimeoutId.value) {
    clearTimeout(graceTimeoutId.value)
    graceTimeoutId.value = null
  }
  showGraceToast.value = false
  graceTicketId.value = null
}

function openRejectModal(ticketId: string) {
  selectedTicketId.value = ticketId
  showRejectModal.value = true
}

function handleRejectSuccess() {
  loadTickets()
}

const stats = computed(() => {
  return {
    menunggu: tickets.value.filter(t => t.status === 'menunggu').length,
    diproses: tickets.value.filter(t => t.status === 'diproses').length,
    selesai: tickets.value.filter(t => t.status === 'selesai').length
  }
})

const statusLabels: Record<string, string> = {
  menunggu: 'Menunggu',
  diproses: 'Diproses',
  selesai: 'Selesai',
  ditolak: 'Ditolak',
}

const statusColors: Record<string, string> = {
  menunggu: 'bg-orange-100 text-orange-700',
  diproses: 'bg-blue-100 text-blue-700',
  selesai: 'bg-green-100 text-green-700',
  ditolak: 'bg-red-100 text-red-700',
}

const filteredTickets = computed(() => {
  let filtered = tickets.value
  
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(t => t.status === statusFilter.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t =>
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.tenants?.name?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const categoryLabels: Record<string, string> = {
  listrik: 'Listrik',
  air: 'Air',
  ac: 'AC',
  wifi: 'WiFi',
  kebersihan: 'Kebersihan',
  lainnya: 'Lainnya',
}

const categoryIcons: Record<string, string> = {
  ac: 'bg-blue-100 text-blue-600',
  listrik: 'bg-yellow-100 text-yellow-600',
  air: 'bg-cyan-100 text-cyan-600',
  wifi: 'bg-purple-100 text-purple-600',
  kebersihan: 'bg-green-100 text-green-600',
  lainnya: 'bg-gray-100 text-gray-600',
}

function getTimeAgo(date: string) {
  const now = new Date()
  const past = new Date(date)
  const diffInMs = now.getTime() - past.getTime()
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInHours / 24)
  
  if (diffInDays > 0) {
    return `${diffInDays} hari lalu`
  } else if (diffInHours > 0) {
    return `${diffInHours} jam lalu`
  } else {
    return 'Baru saja'
  }
}

await loadTickets()
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Laporan Perbaikan</h1>
      <p class="text-gray-500 mt-1">Kelola laporan kerusakan dari penghuni</p>
    </div>

    <p v-if="loading" class="text-gray-500">Memuat data...</p>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminStatCard
          title="Menunggu"
          :value="stats.menunggu"
          subtitle="laporan baru"
          variant="warning"
        />
        <AdminStatCard
          title="Diproses"
          :value="stats.diproses"
          subtitle="sedang ditangani"
          variant="info"
        />
        <AdminStatCard
          title="Selesai"
          :value="stats.selesai"
          subtitle="bulan ini"
          variant="success"
        />
      </div>

      <div class="mb-6 flex items-center gap-4">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari laporan..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <select
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
        >
          <option value="all">Semua Status</option>
          <option value="menunggu">Menunggu</option>
          <option value="diproses">Diproses</option>
          <option value="selesai">Selesai</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>

      <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>

      <div v-if="filteredTickets.length === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
        <p class="text-gray-400">
          {{ searchQuery || statusFilter !== 'all' ? 'Tidak ada hasil pencarian' : 'Belum ada laporan' }}
        </p>
      </div>

      <div v-else class="space-y-4">
        <div v-for="ticket in filteredTickets" :key="ticket.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
          <div class="p-6">
            <div class="flex items-start gap-4">
              <div class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-lg"
                :class="categoryIcons[ticket.category] || categoryIcons.lainnya">
                {{ (categoryLabels[ticket.category] || 'L').substring(0, 2).toUpperCase() }}
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-4 mb-2">
                  <h4 class="font-semibold text-gray-900 text-lg">{{ ticket.title }}</h4>
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium flex-shrink-0"
                    :class="statusColors[ticket.status]">
                    {{ statusLabels[ticket.status] }}
                  </span>
                </div>

                <p v-if="ticket.description" class="text-sm text-gray-600 mb-3">{{ ticket.description }}</p>

                <div v-if="ticket.photo_url" class="mb-3">
                  <a 
                    :href="ticket.photo_url" 
                    target="_blank"
                    class="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Lihat Foto
                  </a>
                </div>

                <div class="flex items-center justify-between">
                  <p class="text-sm text-gray-500">
                    <span class="font-medium text-gray-700">{{ ticket.tenants?.name || 'Unknown' }}</span>
                    <span class="mx-1">•</span>
                    <span>Kamar {{ ticket.tenants?.room_number || '-' }}</span>
                    <span class="mx-1">•</span>
                    <span>{{ getTimeAgo(ticket.created_at) }}</span>
                  </p>

                  <div class="flex items-center gap-2">
                    <template v-if="ticket.status !== 'selesai' && ticket.status !== 'ditolak'">
                      <button
                        v-if="ticket.status === 'menunggu'"
                        @click="handleStatusUpdate(ticket.id, 'diproses')"
                        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                      >
                        Proses
                      </button>
                      <button
                        v-if="ticket.status === 'diproses'"
                        @click="handleComplete(ticket.id)"
                        class="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
                      >
                        Tandai Selesai
                      </button>
                      <button
                        v-if="ticket.status === 'menunggu'"
                        @click="openRejectModal(ticket.id)"
                        class="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      >
                        Tolak
                      </button>
                    </template>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <AdminTicketRejectModal
      v-if="selectedTicketId"
      :show="showRejectModal"
      :ticket-id="selectedTicketId"
      @close="showRejectModal = false"
      @success="handleRejectSuccess"
    />

    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="showGraceToast" class="fixed bottom-4 right-4 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-4 z-50">
        <div class="flex items-center gap-3">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="font-medium">Ticket akan ditandai selesai...</span>
        </div>
        <button
          @click="handleUndoComplete"
          class="px-3 py-1 bg-white text-blue-600 rounded font-medium hover:bg-gray-100 transition"
        >
          Batal
        </button>
      </div>
    </transition>
  </div>
</template>
