<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchProfile } = useRole()
const { fetchBills, updatePaymentProof } = useBilling()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const bills = ref<any[]>([])
const loading = ref(true)
const error = ref('')

async function loadBills() {
  if (!profile?.tenant_id) {
    loading.value = false
    return
  }
  try {
    bills.value = await fetchBills(profile.tenant_id)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleProofUploaded(billId: string, url: string) {
  try {
    await updatePaymentProof(billId, url)
    await loadBills()
  } catch (e: any) {
    error.value = e.message
  }
}

await loadBills()
</script>

<template>
  <div>
    <nav class="flex gap-1 mb-6 border-b border-gray-200 overflow-x-auto">
      <NuxtLink
        to="/dashboard/penghuni"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path === '/dashboard/penghuni'
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        to="/dashboard/penghuni/billing"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/penghuni/billing')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Tagihan
      </NuxtLink>
      <NuxtLink
        to="/dashboard/penghuni/tickets"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition whitespace-nowrap"
        :class="$route.path.startsWith('/dashboard/penghuni/tickets')
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Laporan
      </NuxtLink>
    </nav>

    <h2 class="text-2xl font-bold text-gray-900 mb-6">Tagihan Saya</h2>

    <p v-if="loading" class="text-gray-500">Memuat tagihan...</p>
    <p v-else-if="bills.length === 0" class="text-gray-400 italic">
      Belum ada tagihan.
    </p>

    <div v-else class="space-y-4">
      <BillingBillCard v-for="bill in bills" :key="bill.id" :bill="bill">
        <template #actions="{ bill: b }">
          <div v-if="b.status === 'pending' || b.status === 'overdue'" class="mt-4">
            <BillingBillPaymentProof @uploaded="(url) => handleProofUploaded(b.id, url)" />
          </div>
          <p v-else-if="b.status === 'paid'" class="text-sm text-green-600 mt-2">
            Pembayaran telah diverifikasi
          </p>
        </template>
      </BillingBillCard>
    </div>

    <p v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</p>
  </div>
</template>
