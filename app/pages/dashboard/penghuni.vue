<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
})
</script>

<template>
  <div>
    <h2 class="text-2xl font-bold text-gray-900 mb-6">
      Dashboard Penghuni
    </h2>

    <!-- Placeholder cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Tagihan Bulan Ini</p>
        <p class="text-2xl font-bold mt-1">Rp--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Status Pembayaran</p>
        <p class="text-sm font-medium mt-1 text-yellow-600">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
      <div class="bg-white p-6 rounded-lg shadow-sm border">
        <p class="text-sm text-gray-500">Laporan Aktif</p>
        <p class="text-2xl font-bold mt-1">--</p>
        <p class="text-xs text-gray-400 mt-2">Data akan muncul di Sprint 2</p>
      </div>
    </div>

    <!-- Placeholder sections -->
    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Pengumuman</h3>
      <p class="text-gray-400 italic">Belum ada pengumuman.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border mb-6">
      <h3 class="text-lg font-semibold mb-3">Tagihan Terbaru</h3>
      <p class="text-gray-400 italic">Data tagihan akan tersedia di Sprint 2.</p>
    </div>

    <div class="bg-white p-6 rounded-lg shadow-sm border">
      <h3 class="text-lg font-semibold mb-3">Laporan Kerusakan</h3>
      <p class="text-gray-400 italic">Data laporan akan tersedia di Sprint 2.</p>
    </div>
  </div>
</template>
