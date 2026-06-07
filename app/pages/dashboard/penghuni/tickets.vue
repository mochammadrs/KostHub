<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})

const { fetchProfile } = useRole()
const { fetchTickets } = useTickets()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const tickets = ref<any[]>([])
const loading = ref(true)
const error = ref('')

async function loadTickets() {
  if (!profile?.tenant_id) return
  try {
    tickets.value = await fetchTickets(profile.tenant_id)
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function onTicketCreated() {
  await loadTickets()
}

await loadTickets()
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

    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-gray-900">Laporan Kerusakan</h2>
    </div>

    <TicketsTicketForm @created="onTicketCreated" class="mb-6" />

    <p v-if="loading" class="text-gray-500">Memuat laporan...</p>
    <p v-else-if="tickets.length === 0" class="text-gray-400 italic">
      Belum ada laporan kerusakan.
    </p>

    <div v-else class="space-y-4">
      <TicketsTicketCard v-for="ticket in tickets" :key="ticket.id" :ticket="ticket" />
    </div>

    <p v-if="error" class="text-red-500 text-sm mt-4">{{ error }}</p>
  </div>
</template>
