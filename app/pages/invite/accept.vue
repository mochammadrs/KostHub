<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <div v-if="loading && !invitation" class="text-center py-12">
        <div class="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p class="text-gray-500">Memvalidasi undangan...</p>
      </div>

      <div v-else-if="verifyError" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div class="text-4xl mb-4">😕</div>
        <h1 class="text-xl font-bold text-gray-900 mb-2">Link Tidak Valid</h1>
        <p class="text-gray-500 mb-6">{{ verifyError }}</p>
        <NuxtLink
          to="/login"
          class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
        >
          Ke Halaman Login
        </NuxtLink>
      </div>

      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900">Terima Undangan</h1>
          <p class="text-gray-500 mt-1">Anda diundang untuk bergabung sebagai penghuni kost</p>
        </div>

        <div class="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
          <div class="flex justify-between mb-2">
            <span class="text-gray-500">Email</span>
            <span class="text-gray-900 font-medium">{{ invitation.email }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Nama</span>
            <span class="text-gray-900 font-medium">{{ invitation.full_name }}</span>
          </div>
        </div>

        <div
          v-if="submitError"
          class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4"
        >
          {{ submitError }}
        </div>

        <form @submit.prevent="handleAccept">
          <div class="mb-4">
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              Buat Password
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="8"
              placeholder="Minimal 8 karakter"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              :disabled="submitting"
            />
          </div>

          <div class="mb-6">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">
              Konfirmasi Password
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              minlength="8"
              :class="{ 'border-red-300': passwordMismatch }"
              placeholder="Ketik ulang password"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              :disabled="submitting"
            />
            <p v-if="passwordMismatch" class="text-red-600 text-xs mt-1">
              Password tidak cocok
            </p>
          </div>

          <button
            type="submit"
            :disabled="submitting || passwordMismatch"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ submitting ? 'Membuat akun...' : 'Buat Akun & Masuk' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

definePageMeta({
  layout: false
})

const route = useRoute()
const router = useRouter()

const { verifyToken, acceptInvite, loading, error } = useInvite()

const token = ref(route.query.token as string || '')
const invitation = ref<{ email: string; full_name: string } | null>(null)
const verifyError = ref<string | null>(null)
const submitError = ref<string | null>(null)
const password = ref('')
const confirmPassword = ref('')
const submitting = ref(false)

const passwordMismatch = computed(() => {
  return confirmPassword.value.length > 0 && password.value !== confirmPassword.value
})

onMounted(async () => {
  if (!token.value) {
    verifyError.value = 'Token tidak ditemukan di URL'
    return
  }

  const result = await verifyToken(token.value)

  if (result) {
    invitation.value = result
  } else {
    verifyError.value = error.value || 'Token tidak valid'
  }
})

async function handleAccept() {
  if (password.value.length < 8) {
    submitError.value = 'Password minimal 8 karakter'
    return
  }

  if (password.value !== confirmPassword.value) {
    submitError.value = 'Password tidak cocok'
    return
  }

  submitError.value = null
  submitting.value = true

  const success = await acceptInvite(token.value, password.value)

  if (success) {
    router.push('/login')
  } else {
    submitError.value = error.value || 'Gagal membuat akun'
  }

  submitting.value = false
}
</script>
