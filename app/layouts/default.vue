<script setup lang="ts">
const user = useSupabaseUser()
const client = useSupabaseClient()

async function handleLogout() {
  await client.auth.signOut()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Top navigation bar -->
    <header v-if="user" class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <h1 class="text-lg font-semibold text-gray-800">KostHub</h1>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">{{ user.email }}</span>
          <button
            @click="handleLogout"
            class="text-sm text-red-600 hover:text-red-800"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- Page content -->
    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>
  </div>
</template>
