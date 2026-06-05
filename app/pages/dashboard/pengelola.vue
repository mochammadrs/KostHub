<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})
</script>

<template>
  <div>
    <!-- Navigation tabs -->
    <nav class="flex gap-1 mb-6 border-b border-gray-200">
      <NuxtLink
        to="/dashboard/pengelola"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition"
        :class="$route.path === '/dashboard/pengelola'
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Dashboard
      </NuxtLink>
      <NuxtLink
        to="/dashboard/pengelola/invite"
        class="px-4 py-2 text-sm font-medium rounded-t-lg transition"
        :class="$route.path === '/dashboard/pengelola/invite'
          ? 'bg-white text-blue-600 border border-gray-200 border-b-white -mb-px'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'"
      >
        Undang Penghuni
      </NuxtLink>
    </nav>

    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      Dashboard Pengelola
    </h2>

    <!-- Placeholder metric cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Total Penghuni</p>
        <p class="text-2xl font-bold mt-1">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Menunggak</p>
        <p class="text-2xl font-bold mt-1 text-red-600">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Laporan Aktif</p>
        <p class="text-2xl font-bold mt-1 text-yellow-600">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
    </div>

    <!-- Placeholder management sections -->
    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Status Pembayaran</h3>
      <p class="text-gray-400 italic">Tabel tagihan akan tersedia di Sprint 2.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Laporan Kerusakan</h3>
      <p class="text-gray-400 italic">Daftar tiket akan tersedia di Sprint 2.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold mb-3">Buat Pengumuman</h3>
      <p class="text-gray-400 italic">Form pengumuman akan tersedia di Sprint 2.</p>
    </div>
  </div>
</template>
