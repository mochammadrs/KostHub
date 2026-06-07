<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Undang Penghuni</h1>
      <p class="text-gray-500 mt-1">
        Kirim undangan email ke penghuni baru untuk bergabung ke kost Anda
      </p>
    </div>

    <div class="max-w-2xl space-y-6">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Form Undangan</h2>
        <InviteForm />
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
        <p class="font-medium mb-1">Bagaimana cara kerjanya?</p>
        <ol class="list-decimal list-inside space-y-1 text-blue-600">
          <li>Masukkan email dan nama lengkap penghuni</li>
          <li>Sistem akan mengirimkan link undangan ke email tersebut</li>
          <li>Penghuni membuka link dan membuat password sendiri</li>
          <li>Setelah selesai, penghuni bisa login ke dashboard</li>
        </ol>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  roles: ['admin']
})
</script>
