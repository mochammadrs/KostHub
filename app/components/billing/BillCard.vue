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
