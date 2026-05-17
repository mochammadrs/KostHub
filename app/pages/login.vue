<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

const client = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  error.value = ''

  const { data, error: authError } = await client.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (authError) {
    error.value = authError.message
    loading.value = false
    return
  }

  // Fetch profile for role-based redirect
  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('user_id', data.user.id)
    .single()

  if (profile?.role === 'admin') {
    router.push('/dashboard/pengelola')
  } else {
    router.push('/dashboard/penghuni')
  }

  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
      <h1 class="text-2xl font-bold mb-6 text-center">Masuk ke KostHub</h1>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Email</label>
          <input
            v-model="email"
            type="email"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="email@example.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Password</label>
          <input
            v-model="password"
            type="password"
            required
            class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="******"
          />
        </div>

        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Memproses...' : 'Masuk' }}
        </button>
      </form>
    </div>
  </div>
</template>
