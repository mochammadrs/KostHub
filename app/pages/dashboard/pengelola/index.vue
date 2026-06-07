<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'admin'
})

const { fetchAllBills } = useBilling()
const { fetchAllTickets } = useTickets()
const client = useSupabaseClient()

const totalTenants = ref(0)
const totalRooms = ref(30)
const pendingBills = ref(0)
const activeTickets = ref(0)
const recentPayments = ref<any[]>([])
const loading = ref(true)

async function loadData() {
  try {
    const { count: tenantCount } = await client.from('tenants').select('*', { count: 'exact', head: true })
    totalTenants.value = tenantCount || 0

    const [bills, tickets] = await Promise.all([
      fetchAllBills(),
      fetchAllTickets(),
    ])
    
    pendingBills.value = bills.filter((b: any) => b.status === 'pending' || b.status === 'overdue').length
    activeTickets.value = tickets.filter((t: any) => t.status !== 'selesai').length
    
    // Get recent paid bills for this month
    recentPayments.value = bills
      .filter((b: any) => b.status === 'paid' || b.status === 'pending')
      .sort((a: any, b: any) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime())
      .slice(0, 5)
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

await loadData()
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
      <p class="text-gray-500 mt-1">Ringkasan status properti Anda</p>
    </div>

    <p v-if="loading" class="text-gray-500">Memuat data...</p>

    <template v-else>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <AdminStatCard
          title="Total Penghuni"
          :value="totalTenants"
          :subtitle="`dari ${totalRooms} kamar`"
          variant="default"
        />
        <AdminStatCard
          title="Menunggak"
          :value="pendingBills"
          subtitle="belum bayar bulan ini"
          variant="warning"
        />
        <AdminStatCard
          title="Laporan Aktif"
          :value="activeTickets"
          subtitle="perlu ditindaklanjuti"
          variant="info"
        />
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100">
        <div class="px-6 py-5 border-b border-gray-100">
          <h2 class="text-lg font-semibold text-gray-900">Status Pembayaran Bulan Ini</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="bg-gray-50 border-b border-gray-100">
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nama Penghuni
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nomor Kamar
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nominal
                </th>
                <th class="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="recentPayments.length === 0">
                <td colspan="4" class="px-6 py-8 text-center text-gray-400">
                  Belum ada data pembayaran
                </td>
              </tr>
              <tr v-for="payment in recentPayments" :key="payment.id" class="hover:bg-gray-50 transition">
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ payment.tenants?.name || '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-600">
                  {{ payment.tenants?.room_number || '-' }}
                </td>
                <td class="px-6 py-4 text-sm font-semibold text-gray-900">
                  {{ formatCurrency(payment.amount) }}
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                    :class="{
                      'bg-green-100 text-green-700': payment.status === 'paid',
                      'bg-yellow-100 text-yellow-700': payment.status === 'pending',
                      'bg-red-100 text-red-700': payment.status === 'overdue'
                    }"
                  >
                    {{ payment.status === 'paid' ? 'Lunas' : payment.status === 'pending' ? 'Pending' : 'Terlambat' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>
