<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'tenant'
})

const { fetchProfile } = useRole()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const payments = ref<any[]>([])
const loading = ref(true)

async function loadPayments() {
  if (!profile?.tenant_id) return
  
  try {
    const { data } = await client
      .from('bills')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })
    
    if (data) {
      payments.value = data
    }
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function getTransactionId(id: string) {
  return id.substring(0, 8).toUpperCase()
}

await loadPayments()
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <NuxtLink to="/dashboard/penghuni" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="font-medium">Riwayat Pembayaran</span>
      </NuxtLink>
    </div>

    <p v-if="loading" class="text-gray-500 text-center py-8">Memuat data...</p>

    <template v-else>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <p class="text-sm text-gray-500 mb-1">Total Pembayaran</p>
        <p class="text-3xl font-bold text-gray-900">{{ payments.length }}</p>
        <p class="text-sm text-gray-500 mt-1">transaksi berhasil</p>
      </div>

      <div v-if="payments.length === 0" class="text-center py-12 text-gray-400">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-sm">Belum ada riwayat pembayaran</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="payment in payments"
          :key="payment.id"
          class="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
        >
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span class="text-sm font-medium text-green-700">Pembayaran Berhasil</span>
            </div>
            <button class="p-1 text-blue-600 hover:bg-blue-50 rounded transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          <p class="text-2xl font-bold text-gray-900 mb-4">{{ formatCurrency(payment.amount) }}</p>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-500">Metode Pembayaran</span>
              <span class="text-gray-900 font-medium">Transfer Bank</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">Tanggal Pembayaran</span>
              <span class="text-gray-900 font-medium">{{ formatDate(payment.paid_at || payment.updated_at) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500">ID Transaksi</span>
              <span class="text-gray-900 font-medium font-mono">{{ getTransactionId(payment.id) }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
