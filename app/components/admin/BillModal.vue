<template>
  <BaseModal :show="show" title="Buat Tagihan Baru" size="lg" @close="emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Pilih Penghuni *</label>
        <select
          v-model="form.tenant_id"
          required
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        >
          <option value="">-- Pilih Penghuni --</option>
          <option v-for="tenant in tenants" :key="tenant.id" :value="tenant.id">
            {{ tenant.name }} - Kamar {{ tenant.room_number }}
          </option>
        </select>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Judul Tagihan *</label>
        <input
          v-model="form.title"
          type="text"
          required
          placeholder="Misal: Sewa Kamar Bulan Juni 2026"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nominal (Rp) *</label>
          <input
            v-model.number="form.amount"
            type="number"
            required
            min="0"
            step="1000"
            placeholder="1500000"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Jatuh Tempo *</label>
          <input
            v-model="form.due_date"
            type="date"
            required
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
      </div>

      <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>
    </form>

    <template #footer>
      <div class="flex gap-3 justify-end">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
        >
          Batal
        </button>
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          {{ submitting ? 'Membuat...' : 'Buat Tagihan' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  success: []
}>()

const tenants = ref<any[]>([])
const form = ref({
  tenant_id: '',
  title: '',
  amount: 0,
  due_date: ''
})

const error = ref('')
const submitting = ref(false)

watch(() => props.show, async (show) => {
  if (show) {
    await loadTenants()
    form.value = {
      tenant_id: '',
      title: '',
      amount: 0,
      due_date: ''
    }
  }
}, { immediate: true })

async function loadTenants() {
  try {
    const client = useSupabaseClient()
    const { data, error: fetchError } = await client
      .from('tenants')
      .select('id, name, room_number')
      .order('room_number')

    if (fetchError) throw fetchError
    tenants.value = data || []
  } catch (e: any) {
    error.value = e.message
  }
}

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  try {
    const client = useSupabaseClient()
    
    const { error: insertError } = await client
      .from('bills')
      .insert([{
        tenant_id: form.value.tenant_id,
        title: form.value.title,
        amount: form.value.amount,
        due_date: form.value.due_date,
        status: 'pending'
      }])

    if (insertError) throw insertError

    emit('success')
    emit('close')
  } catch (e: any) {
    error.value = e.message || 'Terjadi kesalahan'
  } finally {
    submitting.value = false
  }
}
</script>
