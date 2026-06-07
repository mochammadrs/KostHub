<script setup lang="ts">
const router = useRouter()

function goToLogin(role: 'penghuni' | 'pengelola') {
  router.push(`/login/${role}`)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
    <div class="bg-white rounded-2xl shadow-xl p-8 md:p-12 w-full max-w-md mx-4">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">KostHub</h1>
        <p class="text-gray-600">Kelola properti kost dengan mudah</p>
      </div>

      <div class="mb-8">
        <p class="text-center text-sm text-gray-500 mb-6">Masuk sebagai:</p>

        <div class="space-y-4">
          <button
            @click="goToLogin('penghuni')"
            class="w-full flex items-center justify-center gap-3 bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-600/30"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>Penghuni</span>
          </button>

          <button
            @click="goToLogin('pengelola')"
            class="w-full flex items-center justify-center gap-3 bg-white text-blue-600 py-4 px-6 rounded-xl font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span>Pengelola</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
