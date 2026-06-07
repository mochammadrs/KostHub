<script setup lang="ts">
const emit = defineEmits<{
  created: []
}>()

const categories = [
  { value: 'listrik', label: 'Listrik' },
  { value: 'air', label: 'Air / PAM' },
  { value: 'ac', label: 'AC' },
  { value: 'wifi', label: 'WiFi / Internet' },
  { value: 'kebersihan', label: 'Kebersihan' },
  { value: 'lainnya', label: 'Lainnya' },
]

const showForm = ref(false)
const title = ref('')
const description = ref('')
const category = ref('')
const submitting = ref(false)
const error = ref('')

async function handleSubmit() {
  if (!title.value || !category.value) return

  submitting.value = true
  error.value = ''

  try {
    const { fetchProfile } = useRole()
    const { createTicket } = useTickets()
    const client = useSupabaseClient()
    const { data: { user } } = await client.auth.getUser()
    const profile = await fetchProfile(user!.id)

    if (!profile?.tenant_id) {
      throw new Error('Profil tidak ditemukan')
    }

    await createTicket({
      tenant_id: profile.tenant_id,
      title: title.value,
      description: description.value,
      category: category.value,
    })

    title.value = ''
    description.value = ''
    category.value = ''
    showForm.value = false
    emit('created')
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <button
      v-if="!showForm"
      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
      @click="showForm = true"
    >
      + Buat Laporan Baru
    </button>

    <form v-else @submit.prevent="handleSubmit" class="bg-white p-6 rounded-lg shadow-sm border space-y-4">
      <h4 class="font-semibold text-gray-900">Laporan Kerusakan Baru</h4>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
        <select
          v-model="category"
          required
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="" disabled>Pilih kategori</option>
          <option v-for="cat in categories" :key="cat.value" :value="cat.value">
            {{ cat.label }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Judul</label>
        <input
          v-model="title"
          type="text"
          required
          placeholder="Contoh: AC tidak dingin"
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Deskripsi (opsional)</label>
        <textarea
          v-model="description"
          rows="3"
          placeholder="Jelaskan detail kerusakan..."
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

      <div class="flex gap-2">
        <button
          type="submit"
          :disabled="submitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
        >
          {{ submitting ? 'Mengirim...' : 'Kirim Laporan' }}
        </button>
        <button
          type="button"
          class="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
          @click="showForm = false"
        >
          Batal
        </button>
      </div>
    </form>
  </div>
</template>
