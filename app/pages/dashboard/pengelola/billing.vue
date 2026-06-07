<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'admin'
})

const { fetchAllBills, verifyPayment, deleteBill } = useBilling()

const bills = ref<any[]>([])
const loading = ref(true)
const error = ref('')
const searchQuery = ref('')
const statusFilter = ref('all')
const showBillModal = ref(false)
const editingBillId = ref<string | null>(null)
const editAmount = ref(0)

async function loadBills() {
  try {
    bills.value = await fetchAllBills()
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

const stats = computed(() => {
  const paid = bills.value.filter(b => b.status === 'paid')
  const pending = bills.value.filter(b => b.status === 'pending')
  const overdue = bills.value.filter(b => b.status === 'overdue')
  
  return {
    totalPaid: paid.reduce((sum, b) => sum + b.amount, 0),
    totalPending: pending.reduce((sum, b) => sum + b.amount, 0),
    pendingCount: pending.length,
    totalOverdue: overdue.reduce((sum, b) => sum + b.amount, 0),
    overdueCount: overdue.length
  }
})

const filteredBills = computed(() => {
  let filtered = bills.value
  
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(b => b.status === statusFilter.value)
  }
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(b =>
      b.tenants?.name?.toLowerCase().includes(query) ||
      b.tenants?.room_number?.toLowerCase().includes(query) ||
      b.title?.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

function startEdit(bill: any) {
  editingBillId.value = bill.id
  editAmount.value = bill.amount
}

function cancelEdit() {
  editingBillId.value = null
  editAmount.value = 0
}

async function saveEdit(billId: string) {
  if (editAmount.value <= 0) {
    error.value = 'Nominal tidak boleh 0 atau kurang'
    return
  }

  try {
    const client = useSupabaseClient()
    const { error: updateError } = await client
      .from('bills')
      .update({ amount: editAmount.value })
      .eq('id', billId)

    if (updateError) throw updateError

    await loadBills()
    editingBillId.value = null
    editAmount.value = 0
    error.value = ''
  } catch (e: any) {
    error.value = e.message || 'Gagal mengupdate tagihan'
  }
}

async function handleVerify(billId: string, status: 'paid' | 'pending') {
  try {
    await verifyPayment(billId, status)
    await loadBills()
  } catch (e: any) {
    error.value = e.message
  }
}

async function handleDelete(bill: any) {
  const tenantName = bill.tenants?.name || 'penghuni ini'
  const amount = formatCurrency(bill.amount)
  
  if (!confirm(`Hapus tagihan ${amount} untuk ${tenantName}?\n\nTindakan ini tidak dapat dibatalkan.`)) {
    return
  }
  
  try {
    await deleteBill(bill.id)
    await loadBills()
    error.value = ''
  } catch (e: any) {
    error.value = e.message || 'Gagal menghapus tagihan'
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
  if (!date) return '-'
  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function exportToCSV() {
  const headers = ['Penghuni', 'Kamar', 'Nominal', 'Jatuh Tempo', 'Tanggal Bayar', 'Status']
  const rows = filteredBills.value.map(b => [
    b.tenants?.name || '-',
    b.tenants?.room_number || '-',
    b.amount,
    b.due_date,
    b.paid_at || '-',
    b.status
  ])
  
  const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tagihan-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

function handleModalSuccess() {
  loadBills()
}

await loadBills()
</script>

<template>
  <div>
    <div class="flex items-start justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900">Tagihan</h1>
        <p class="text-gray-500 mt-1">Kelola pembayaran dan tagihan penghuni</p>
      </div>
      <button
        @click="showBillModal = true"
        class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium shadow-lg shadow-blue-600/30"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Buat Tagihan
      </button>
    </div>

    <p v-if="loading" class="text-gray-500">Memuat data...</p>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminStatCard
          title="Total Terbayar"
          :value="formatCurrency(stats.totalPaid)"
          subtitle="Bulan ini"
          variant="success"
        />
        <AdminStatCard
          title="Pending"
          :value="formatCurrency(stats.totalPending)"
          :subtitle="`${stats.pendingCount} tagihan`"
          variant="warning"
        />
        <AdminStatCard
          title="Terlambat"
          :value="formatCurrency(stats.totalOverdue)"
          :subtitle="`${stats.overdueCount} tagihan`"
          variant="danger"
        />
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <div class="flex-1 relative">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Cari tagihan..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          <select
            v-model="statusFilter"
            class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          >
            <option value="all">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="pending">Pending</option>
            <option value="overdue">Terlambat</option>
          </select>

          <button
            @click="exportToCSV"
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm text-gray-700"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>

        <p v-if="error" class="px-6 py-4 text-red-500 text-sm border-b border-gray-100">{{ error }}</p>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Penghuni
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Kamar
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nominal
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Metode
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Bukti
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Jatuh Tempo
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Tanggal Bayar
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
              <tr v-if="filteredBills.length === 0">
                <td colspan="7" class="px-6 py-8 text-center text-gray-400">
                  {{ searchQuery || statusFilter !== 'all' ? 'Tidak ada hasil pencarian' : 'Belum ada tagihan' }}
                </td>
              </tr>
              <tr v-for="bill in filteredBills" :key="bill.id" class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ bill.tenants?.name || '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ bill.tenants?.room_number || '-' }}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                  <div v-if="editingBillId === bill.id" class="flex items-center gap-2">
                    <input
                      v-model.number="editAmount"
                      type="number"
                      min="1"
                      step="1000"
                      class="w-full px-3 py-1.5 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                  <span v-else>{{ formatCurrency(bill.amount) }}</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <span v-if="bill.payment_method" class="capitalize">
                    {{ bill.payment_method === 'transfer' ? 'Transfer Bank' : bill.payment_method === 'ewallet' ? 'E-Wallet' : 'Kartu Kredit/Debit' }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 text-sm">
                  <a
                    v-if="bill.proof_url"
                    :href="bill.proof_url"
                    target="_blank"
                    class="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Lihat
                  </a>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  <div class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {{ formatDate(bill.due_date) }}
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ bill.paid_at ? formatDate(bill.paid_at) : '-' }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-700': bill.status === 'paid',
                      'bg-yellow-100 text-yellow-700': bill.status === 'pending',
                      'bg-red-100 text-red-700': bill.status === 'overdue'
                    }"
                  >
                    {{ bill.status === 'paid' ? 'Lunas' : bill.status === 'pending' ? 'Pending' : 'Terlambat' }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div v-if="bill.proof_url && bill.status === 'pending'" class="flex items-center gap-2">
                    <button
                      @click="handleVerify(bill.id, 'paid')"
                      class="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      title="Verifikasi Pembayaran"
                    >
                      Verifikasi
                    </button>
                    <button
                      @click="handleVerify(bill.id, 'pending')"
                      class="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      title="Tolak Pembayaran"
                    >
                      Tolak
                    </button>
                  </div>
                  <div v-else-if="editingBillId === bill.id" class="flex items-center gap-2">
                    <button
                      @click="saveEdit(bill.id)"
                      class="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition"
                      title="Simpan"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <button
                      @click="cancelEdit"
                      class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Batal"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div v-else class="flex items-center gap-2">
                    <button
                      @click="startEdit(bill)"
                      class="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="handleDelete(bill)"
                      class="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Hapus"
                    >
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
    </template>

    <AdminBillModal
      :show="showBillModal"
      @close="showBillModal = false"
      @success="handleModalSuccess"
    />
  </div>
</template>
