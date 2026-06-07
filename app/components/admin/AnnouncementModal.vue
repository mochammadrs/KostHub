<template>
  <BaseModal :show="show" :title="isEdit ? 'Edit Pengumuman' : 'Buat Pengumuman'" size="lg" @close="emit('close')">
    <form @submit.prevent="handleSubmit" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Judul *</label>
        <input
          v-model="form.title"
          type="text"
          required
          placeholder="Judul pengumuman"
          class="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Isi Pengumuman *</label>
        <textarea
          v-model="form.content"
          required
          rows="6"
          placeholder="Tulis isi pengumuman di sini..."
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
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50"
        >
          {{ submitting ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Terbitkan' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
interface Props {
  show: boolean
  announcement?: any
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  success: []
}>()

const isEdit = computed(() => !!props.announcement)

const form = ref({
  title: '',
  content: ''
})

const error = ref('')
const submitting = ref(false)

watch(() => props.announcement, (newAnnouncement) => {
  if (newAnnouncement) {
    form.value = {
      title: newAnnouncement.title || '',
      content: newAnnouncement.content || ''
    }
  } else {
    form.value = {
      title: '',
      content: ''
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
        .from('announcements')
        .update({
          title: form.value.title,
          content: form.value.content
        })
        .eq('id', props.announcement.id)

      if (updateError) throw updateError
    } else {
      const { error: insertError } = await client
        .from('announcements')
        .insert([{
          title: form.value.title,
          content: form.value.content
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
