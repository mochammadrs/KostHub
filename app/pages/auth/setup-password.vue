<script setup lang="ts">
definePageMeta({
  layout: false
})

const router = useRouter()
const route = useRoute()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')

const token = computed(() => route.query.token as string)

async function handleSetPassword() {
  error.value = ''

  if (!token.value) {
    error.value = 'Token tidak valid. Silakan klik link undangan lagi.'
    return
  }

  if (!password.value || password.value.length < 8) {
    error.value = 'Password minimal 8 karakter'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Password tidak cocok'
    return
  }

  loading.value = true

  try {
    const response = await $fetch('/api/invite/set-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: password.value
      }
    })

    if (response.success) {
      router.push('/login?setup=success')
    }
  } catch (e: any) {
    console.error('Setup password error:', e)
    error.value = e.data?.message || e.message || 'Terjadi kesalahan'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">KostHub</h1>
        <p class="text-gray-600">Buat Password Anda</p>
      </div>

      <form @submit.prevent="handleSetPassword" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Password Baru</label>
          <input
            v-model="password"
            type="password"
            required
            placeholder="Masukkan password (min. 8 karakter)"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Konfirmasi Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            placeholder="Masukkan ulang password"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ loading ? 'Menyimpan...' : 'Buat Password' }}
        </button>
      </form>

      <div class="mt-6 text-center text-sm text-gray-500">
        <p>Setelah membuat password, Anda akan diarahkan ke halaman login</p>
      </div>
    </div>
  </div>
</template>
