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
