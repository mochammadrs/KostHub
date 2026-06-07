<template>
  <div class="flex min-h-screen bg-gray-50">
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col relative">
      <div class="p-6 border-b border-gray-100">
        <button @click="toggleSidebar" class="mb-4 text-gray-400 hover:text-gray-600 transition lg:hidden">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-xl font-bold text-gray-900">KostHub</h1>
        <p class="text-sm text-gray-500 mt-1">Panel Pengelola</p>
      </div>

      <nav class="flex-1 p-4 space-y-1 overflow-y-auto pb-24">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
          :class="isActive(item.path) ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'text-gray-700 hover:bg-gray-100'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          <span class="font-medium">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="fixed bottom-0 left-0 w-64 p-4 bg-white border-t border-gray-100">
        <button @click="showLogoutConfirm = true" class="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span class="font-medium">Keluar</span>
        </button>
      </div>
    </aside>

    <div class="flex-1 flex flex-col">
      <header class="bg-white border-b border-gray-200 px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex-1 max-w-xl">
            <div class="relative">
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                :placeholder="searchPlaceholder"
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
          </div>

          <div class="flex items-center gap-4 ml-6">
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900">Admin</p>
              <p class="text-xs text-gray-500">admin@kosthub.com</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold">
              A
            </div>
          </div>
        </div>
      </header>

      <main class="flex-1 p-8 overflow-auto">
        <slot />
      </main>
    </div>

    <div v-if="showLogoutConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" @click.self="showLogoutConfirm = false">
      <div class="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Konfirmasi Keluar</h3>
        <p class="text-gray-600 mb-6">Apakah Anda yakin ingin keluar dari akun Anda?</p>
        <div class="flex gap-3 justify-end">
          <button
            @click="showLogoutConfirm = false"
            class="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
          >
            Batal
          </button>
          <button
            @click="logout"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition ease-out duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="showSuccessToast" class="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <span class="font-medium">Anda berhasil keluar</span>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const searchPlaceholder = computed(() => {
  const path = route.path
  if (path.includes('penghuni')) return 'Cari penghuni, kamar...'
  if (path.includes('billing')) return 'Cari tagihan...'
  if (path.includes('tickets')) return 'Cari laporan...'
  if (path.includes('announcements')) return 'Cari pengumuman...'
  return 'Cari penghuni, kamar...'
})

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard/pengelola',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 13a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z" /></svg>'
    })
  },
  {
    label: 'Penghuni',
    path: '/dashboard/pengelola/penghuni',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>'
    })
  },
  {
    label: 'Tagihan',
    path: '/dashboard/pengelola/billing',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>'
    })
  },
  {
    label: 'Laporan',
    path: '/dashboard/pengelola/tickets',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>'
    })
  },
  {
    label: 'Pengumuman',
    path: '/dashboard/pengelola/announcements',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>'
    })
  },
  {
    label: 'Invite Penghuni Baru',
    path: '/dashboard/pengelola/invite',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>'
    })
  }
]

function isActive(path: string) {
  if (path === '/dashboard/pengelola') {
    return route.path === path
  }
  return route.path.startsWith(path)
}

const sidebarOpen = ref(true)
const showLogoutConfirm = ref(false)
const showSuccessToast = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

async function logout() {
  const client = useSupabaseClient()
  await client.auth.signOut()
  showLogoutConfirm.value = false
  showSuccessToast.value = true
  
  setTimeout(() => {
    showSuccessToast.value = false
    router.push('/login')
  }, 2000)
}
</script>