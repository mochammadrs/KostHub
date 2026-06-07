<template>
  <BaseModal :show="show" title="Tolak Laporan" size="md" @close="emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <p class="text-sm text-gray-600">
        Berikan alasan penolakan untuk laporan ini. Alasan akan terlihat oleh penghuni.
      </p>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Alasan Penolakan *</label>
        <textarea
          v-model="reason"
          required
          rows="4"
          placeholder="Contoh: Masalah ini di luar tanggung jawab pengelola..."
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
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
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50"
        >
          {{ submitting ? 'Menolak...' : 'Tolak Laporan' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  ticketId: string | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  success: []
}>()

const reason = ref('')
const error = ref('')
const submitting = ref(false)

watch(() => props.show, (show) => {
  if (show) {
    reason.value = ''
    error.value = ''
  }
})

async function handleSubmit() {
  if (!props.ticketId) return
  
  error.value = ''
  submitting.value = true

  try {
    const client = useSupabaseClient()
    
    const { error: updateError } = await client
      .from('tickets')
      .update({
        status: 'ditolak',
        rejection_reason: reason.value
      })
      .eq('id', props.ticketId)

    if (updateError) throw updateError

    emit('success')
    emit('close')
  } catch (e: any) {
    error.value = e.message || 'Terjadi kesalahan'
  } finally {
    submitting.value = false
  }
}
</script>
