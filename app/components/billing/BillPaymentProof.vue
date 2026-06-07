<script setup lang="ts">
const emit = defineEmits<{
  uploaded: [url: string]
}>()

const uploading = ref(false)
const error = ref('')

async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  error.value = ''

  try {
    const formData = new FormData()
    formData.append('file', file)

    const { data, error: uploadError } = await useFetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (uploadError.value) throw new Error(uploadError.value.message)

    emit('uploaded', data.value.url)
  } catch (e: any) {
    error.value = e.message || 'Gagal mengunggah bukti'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>

<template>
  <div>
    <label class="relative cursor-pointer">
      <div
        class="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
        :class="{ 'opacity-50 pointer-events-none': uploading }"
      >
        <span v-if="uploading" class="text-sm text-gray-500">Mengunggah...</span>
        <span v-else class="text-sm text-gray-600">Upload Bukti Pembayaran</span>
      </div>
      <input
        type="file"
        accept="image/*"
        class="hidden"
        @change="handleFileUpload"
        :disabled="uploading"
      />
    </label>
    <p v-if="error" class="text-xs text-red-500 mt-1">{{ error }}</p>
  </div>
</template>
