<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'tenant'
})

const router = useRouter()
const { fetchProfile } = useRole()
const client = useSupabaseClient()

const { data: { user } } = await client.auth.getUser()
const profile = await fetchProfile(user!.id)

const category = ref('')
const description = ref('')
const uploadedFile = ref<File | null>(null)
const submitting = ref(false)
const error = ref('')

const categories = [
  'AC',
  'Listrik',
  'Air',
  'Furniture',
  'Kamar Mandi',
  'Kebersihan',
  'Keamanan',
  'Lainnya'
]

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    if (file.size > 5 * 1024 * 1024) {
      error.value = 'Ukuran file maksimal 5MB'
      return
    }
    uploadedFile.value = file
    error.value = ''
  }
}

async function submitReport() {
  if (!category.value || !description.value) {
    error.value = 'Mohon lengkapi semua field'
    return
  }

  submitting.value = true
  error.value = ''

  try {
    let photoUrl = null

    if (uploadedFile.value) {
      const fileExt = uploadedFile.value.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `tickets/${fileName}`

      const { error: uploadError } = await client.storage
        .from('bills')
        .upload(filePath, uploadedFile.value)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = client.storage
        .from('bills')
        .getPublicUrl(filePath)

      photoUrl = publicUrl
    }

    const { error: insertError } = await client
      .from('tickets')
      .insert({
        tenant_id: profile?.tenant_id,
        title: category.value,
        category: category.value,
        description: description.value,
        photo_url: photoUrl,
        status: 'menunggu'
      })

    if (insertError) throw insertError

    router.push('/dashboard/penghuni?ticket=created')
  } catch (e: any) {
    error.value = e.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <NuxtLink to="/dashboard/penghuni" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="font-medium">Buat Laporan</span>
      </NuxtLink>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <form @submit.prevent="submitReport" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Kategori Kerusakan</label>
          <select
            v-model="category"
            required
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="" disabled>Pilih kategori</option>
            <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Deskripsi Masalah</label>
          <textarea
            v-model="description"
            required
            rows="6"
            placeholder="Jelaskan masalah yang Anda alami secara detail..."
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Unggah Foto</label>
          <div class="border-2 border-dashed border-gray-300 rounded-xl p-8">
            <input
              type="file"
              @change="handleFileSelect"
              accept="image/*"
              class="hidden"
              id="photo-upload"
            />
            <label for="photo-upload" class="cursor-pointer block text-center">
              <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p class="text-sm font-medium text-gray-900 mb-1">
                {{ uploadedFile ? uploadedFile.name : 'Klik untuk unggah foto' }}
              </p>
              <p class="text-xs text-gray-500">PNG, JPG hingga 5MB</p>
            </label>
          </div>
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="submitting"
          class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? 'Mengirim...' : 'Kirim Laporan' }}
        </button>
      </form>
    </div>
  </div>
</template>
