<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'tenant'
})

const route = useRoute()
const router = useRouter()
const { fetchProfile } = useRole()
const { fetchCurrentBill } = useBilling()
const { fetchTickets } = useTickets()
const { fetchAnnouncements } = useAnnouncements()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const tenant = ref<any>(null)
const currentBill = ref<any>(null)
const tickets = ref<any[]>([])
const announcements = ref<any[]>([])
const loading = ref(true)
const currentAnnouncementIndex = ref(0)
const showNotification = ref(false)
const notificationMessage = ref('')
const notificationType = ref<'success' | 'info'>('success')

// Check for notification query params
if (route.query.payment === 'success') {
  showNotification.value = true
  notificationMessage.value = 'Pembayaran berhasil dikirim! Menunggu verifikasi dari pengelola.'
  notificationType.value = 'success'
  // Auto dismiss after 8 seconds
  setTimeout(() => {
    showNotification.value = false
  }, 8000)
} else if (route.query.ticket === 'created') {
  showNotification.value = true
  notificationMessage.value = 'Laporan berhasil dikirim! Pengelola akan segera menindaklanjuti.'
  notificationType.value = 'info'
  // Auto dismiss after 8 seconds
  setTimeout(() => {
    showNotification.value = false
  }, 8000)
}

function closeNotification() {
  showNotification.value = false
  // Clean up URL
  router.replace({ query: {} })
}

async function loadData() {
  if (!profile?.tenant_id) {
    loading.value = false
    return
  }
  try {
    const { data: tenantData } = await client
      .from('tenants')
      .select('*')
      .eq('id', profile.tenant_id)
      .single()
    
    tenant.value = tenantData

    const [bill, ticketsData, anns] = await Promise.all([
      fetchCurrentBill(profile.tenant_id),
      fetchTickets(profile.tenant_id),
      fetchAnnouncements(),
    ])
    currentBill.value = bill
    tickets.value = ticketsData
    announcements.value = anns
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

function nextAnnouncement() {
  if (currentAnnouncementIndex.value < announcements.value.length - 1) {
    currentAnnouncementIndex.value++
  }
}

function prevAnnouncement() {
  if (currentAnnouncementIndex.value > 0) {
    currentAnnouncementIndex.value--
  }
}

function goToBayar() {
  if (currentBill.value) {
    router.push(`/dashboard/penghuni/pembayaran?billId=${currentBill.value.id}`)
  }
}

await loadData()
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <p class="text-gray-500 text-sm mb-1">Halo,</p>
      <h1 class="text-2xl font-bold text-gray-900">{{ tenant?.name || profile?.full_name || 'Penghuni' }}</h1>
    </div>

    <!-- Notification Banner -->
    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 transform -translate-y-2"
      enter-to-class="opacity-100 transform translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 transform translate-y-0"
      leave-to-class="opacity-0 transform -translate-y-2"
    >
      <div
        v-if="showNotification"
        class="mb-6 rounded-xl shadow-sm border p-4 flex items-start gap-3"
        :class="notificationType === 'success' ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'"
      >
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          :class="notificationType === 'success' ? 'bg-green-100' : 'bg-blue-100'"
        >
          <svg 
            v-if="notificationType === 'success'" 
            class="w-5 h-5 text-green-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg 
            v-else 
            class="w-5 h-5 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="flex-1 min-w-0">
          <p 
            class="text-sm font-medium leading-relaxed"
            :class="notificationType === 'success' ? 'text-green-800' : 'text-blue-800'"
          >
            {{ notificationMessage }}
          </p>
        </div>
        <button
          @click="closeNotification"
          class="flex-shrink-0 rounded-lg p-1.5 transition"
          :class="notificationType === 'success' ? 'text-green-600 hover:bg-green-100' : 'text-blue-600 hover:bg-blue-100'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </transition>

    <p v-if="loading" class="text-gray-500 text-center py-8">Memuat data...</p>

    <template v-else>
      <div v-if="announcements.length > 0" class="mb-6">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <h2 class="font-semibold text-gray-900">Pengumuman</h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="prevAnnouncement"
              :disabled="currentAnnouncementIndex === 0"
              class="p-1 rounded-full hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              @click="nextAnnouncement"
              :disabled="currentAnnouncementIndex === announcements.length - 1"
              class="p-1 rounded-full hover:bg-gray-100 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div class="relative overflow-hidden">
          <div class="flex transition-transform duration-300" :style="{ transform: `translateX(-${currentAnnouncementIndex * 100}%)` }">
            <div
              v-for="(ann, index) in announcements"
              :key="ann.id"
              class="w-full flex-shrink-0 px-1"
            >
              <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div class="flex gap-3">
                  <div class="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-900 mb-1">{{ ann.title }}</h3>
                    <p class="text-sm text-gray-600 line-clamp-2 mb-2">{{ ann.content }}</p>
                    <div class="flex items-center gap-1 text-xs text-gray-400">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{{ getTimeAgo(ann.created_at) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-center gap-1.5 mt-3">
          <button
            v-for="(_, index) in announcements"
            :key="index"
            @click="currentAnnouncementIndex = index"
            class="w-2 h-2 rounded-full transition"
            :class="currentAnnouncementIndex === index ? 'bg-blue-600 w-6' : 'bg-gray-300'"
          />
        </div>
      </div>

      <div v-if="currentBill" class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <p class="text-sm text-gray-500 mb-2">Tagihan Bulan Ini</p>
        <div class="flex items-end justify-between mb-3">
          <div>
            <p class="text-3xl font-bold text-gray-900">{{ formatCurrency(currentBill.amount) }}</p>
            <p class="text-sm text-gray-500 mt-1">Kamar {{ tenant?.room_number || '-' }}</p>
          </div>
          <span
            class="px-3 py-1 rounded-full text-xs font-medium"
            :class="currentBill.status === 'paid' ? 'bg-green-100 text-green-700' : currentBill.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'"
          >
            {{ currentBill.status === 'paid' ? 'Lunas' : currentBill.status === 'overdue' ? 'Terlambat' : 'Belum Lunas' }}
          </span>
        </div>
        <button
          v-if="currentBill.status !== 'paid'"
          @click="goToBayar"
          class="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Bayar Sekarang
        </button>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-gray-900">Laporan Perbaikan</h2>
          <NuxtLink
            to="/dashboard/penghuni/laporan/buat"
            class="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Buat Laporan
          </NuxtLink>
        </div>

        <div v-if="tickets.length === 0" class="text-center py-8 text-gray-400 text-sm">
          Belum ada laporan aktif
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="ticket in tickets.slice(0, 5)"
            :key="ticket.id"
            class="border rounded-lg p-4 hover:shadow-sm transition"
            :class="ticket.status === 'ditolak' ? 'border-red-200 bg-red-50' : 'border-gray-100'"
          >
            <div class="flex gap-3">
              <div 
                class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                :class="ticket.status === 'ditolak' ? 'bg-red-100' : 'bg-blue-100'"
              >
                <svg 
                  v-if="ticket.status === 'ditolak'"
                  class="w-5 h-5 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg 
                  v-else-if="ticket.status === 'selesai'"
                  class="w-5 h-5 text-green-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg 
                  v-else
                  class="w-5 h-5 text-blue-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between gap-2 mb-1">
                  <h3 class="font-semibold text-gray-900">{{ ticket.category || ticket.title }}</h3>
                  <span
                    class="px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0"
                    :class="{
                      'bg-yellow-100 text-yellow-700': ticket.status === 'menunggu',
                      'bg-blue-100 text-blue-700': ticket.status === 'diproses',
                      'bg-green-100 text-green-700': ticket.status === 'selesai',
                      'bg-red-100 text-red-700': ticket.status === 'ditolak'
                    }"
                  >
                    {{ ticket.status === 'menunggu' ? 'Menunggu' : ticket.status === 'diproses' ? 'Diproses' : ticket.status === 'selesai' ? 'Selesai' : 'Ditolak' }}
                  </span>
                </div>
                <p class="text-sm text-gray-600 mb-2 line-clamp-1">{{ ticket.description }}</p>
                
                <a 
                  v-if="ticket.photo_url"
                  :href="ticket.photo_url" 
                  target="_blank"
                  class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium mb-2"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Lihat Foto
                </a>
                
                <div 
                  v-if="ticket.status === 'ditolak' && ticket.rejection_reason"
                  class="mb-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800"
                >
                  <span class="font-medium">Alasan penolakan:</span> {{ ticket.rejection_reason }}
                </div>

                <p class="text-xs text-gray-400">Dilaporkan {{ getTimeAgo(ticket.created_at) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
