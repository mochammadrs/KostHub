<template>
  <BaseModal :show="show" :title="isEdit ? 'Edit Penghuni' : 'Tambah Penghuni'" size="lg" @close="emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
          <input
            v-model="form.name"
            type="text"
            required
            placeholder="Nama lengkap penghuni"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
          <input
            v-model="form.email"
            type="email"
            required
            placeholder="email@example.com"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">No. Telepon *</label>
          <input
            v-model="form.phone"
            type="tel"
            required
            placeholder="08123456789"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Nomor Kamar *</label>
          <input
            v-model="form.room_number"
            type="text"
            required
            placeholder="101"
            class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk *</label>
          <input
            v-model="form.move_in_date"
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
          {{ submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Penghuni' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  tenant?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  success: []
}>()

const isEdit = computed(() => !!props.tenant)

const form = ref({
  name: '',
  email: '',
  phone: '',
  room_number: '',
  move_in_date: ''
})

const error = ref('')
const submitting = ref(false)

watch(() => props.tenant, (newTenant) => {
  if (newTenant) {
    form.value = {
      name: newTenant.name || '',
      email: newTenant.email || '',
      phone: newTenant.phone || '',
      room_number: newTenant.room_number || '',
      move_in_date: newTenant.move_in_date || ''
    }
  } else {
    form.value = {
      name: '',
      email: '',
      phone: '',
      room_number: '',
      move_in_date: ''
    }
  }
}, { immediate: true })

async function handleSubmit() {
  error.value = ''
  submitting.value = true

  try {
    const client = useSupabaseClient()
    
    if (isEdit.value) {
      const { error: updateError } = await client
        .from('tenants')
        .update({
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          room_number: form.value.room_number,
          move_in_date: form.value.move_in_date
        })
        .eq('id', props.tenant.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await client
        .from('tenants')
        .insert([{
          name: form.value.name,
          email: form.value.email,
          phone: form.value.phone,
          room_number: form.value.room_number,
          move_in_date: form.value.move_in_date
        }])

      if (insertError) throw insertError
    }

    emit('success')
    emit('close')
  } catch (e: any) {
    error.value = e.message || 'Terjadi kesalahan'
  } finally {
    submitting.value = false
  }
}
</script>
