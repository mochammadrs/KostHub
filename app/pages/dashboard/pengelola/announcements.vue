<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'admin'
})

const { fetchAnnouncements, createAnnouncement, deleteAnnouncement } = useAnnouncements()

const announcements = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedAnnouncement = ref<any>(null)

async function loadAnnouncements() {
  try {
    announcements.value = await fetchAnnouncements()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
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

function openEditModal(announcement: any) {
  selectedAnnouncement.value = announcement
  showEditModal.value = true
}

function handleModalSuccess() {
  loadAnnouncements()
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

await loadAnnouncements()
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Pengumuman</h1>
        <p class="text-gray-500 mt-1">Kelola pengumuman untuk penghuni kost</p>
      </div>
      <button
        @click="showCreateModal = true"
        class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-600/30"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Buat Pengumuman
      </button>
    </div>

    <p v-if="loading" class="text-gray-500">Memuat data...</p>

    <template v-else>
      <div class="mb-4">
        <h2 class="text-xl font-semibold text-gray-900">Daftar Pengumuman</h2>
      </div>

      <div v-if="announcements.length === 0" class="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
        <p class="text-gray-400">Belum ada pengumuman</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="ann in announcements"
          :key="ann.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition p-6"
        >
          <div class="flex items-start justify-between mb-3">
            <h4 class="font-semibold text-gray-900 text-lg">{{ ann.title }}</h4>
            <span class="text-xs text-gray-500">{{ getTimeAgo(ann.created_at) }}</span>
          </div>

          <p class="text-sm text-gray-600 mb-4">{{ ann.content }}</p>

          <div class="flex items-center justify-end gap-2">
            <button 
              @click="openEditModal(ann)"
              class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              @click="handleDelete(ann.id)"
              class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </template>

    <AdminAnnouncementModal
      :show="showCreateModal"
      @close="showCreateModal = false"
      @success="handleModalSuccess(); showCreateModal = false"
    />

    <AdminAnnouncementModal
      v-if="selectedAnnouncement"
      :show="showEditModal"
      :announcement="selectedAnnouncement"
      @close="showEditModal = false"
      @success="handleModalSuccess(); showEditModal = false"
    />
  </div>
</template>
