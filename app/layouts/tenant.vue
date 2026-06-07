<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <button @click="toggleMenu" class="p-2 text-gray-600 hover:text-gray-900 transition">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <h1 class="text-xl font-bold text-gray-900">
            KostHub
          </h1>
        </div>

        <button @click="showProfile = true" class="w-10 h-10 rounded-full bg-blue-600 text-white font-semibold flex items-center justify-center flex-shrink-0">
          {{ initials }}
        </button>
      </div>
    </header>

    <transition
      enter-active-class="transition ease-out duration-200"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <div v-if="menuOpen" class="fixed inset-0 z-50">
        <div class="absolute inset-0 bg-black/50" @click="toggleMenu"></div>
        <nav class="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl flex flex-col">
          <div class="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">Menu</h2>
            <button @click="toggleMenu" class="p-2 text-gray-400 hover:text-gray-600 transition">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 p-4 space-y-2 overflow-y-auto">
            <NuxtLink
              v-for="item in menuItems"
              :key="item.path"
              :to="item.path"
              @click="toggleMenu"
              class="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
              :class="isActive(item.path) ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'"
            >
              <component :is="item.icon" class="w-5 h-5" />
              <span class="font-medium">{{ item.label }}</span>
            </NuxtLink>
          </div>

          <div class="p-4 border-t border-gray-100">
            <button
              @click="showLogoutConfirm = true"
              class="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-600 hover:bg-red-50 transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span class="font-medium">Keluar</span>
            </button>
          </div>
        </nav>
      </div>
    </transition>

    <main class="max-w-7xl mx-auto px-4 py-6">
      <slot />
    </main>

    <div v-if="showLogoutConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" @click.self="showLogoutConfirm = false">
      <div class="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Konfirmasi Keluar</h3>
        <p class="text-gray-600 mb-6">Apakah Anda yakin ingin keluar dari akun Anda?</p>
        <div class="flex gap-3">
          <button
            @click="showLogoutConfirm = false"
            class="flex-1 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition font-medium"
          >
            Batal
          </button>
          <button
            @click="logout"
            class="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
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
const user = useSupabaseUser()

const menuOpen = ref(false)
const showLogoutConfirm = ref(false)
const showSuccessToast = ref(false)
const showProfile = ref(false)

const initials = computed(() => {
  if (!user.value?.email) return 'U'
  return user.value.email.substring(0, 2).toUpperCase()
})

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard/penghuni',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>'
    })
  },
  {
    label: 'Riwayat Pembayaran',
    path: '/dashboard/penghuni/riwayat',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>'
    })
  },
  {
    label: 'Profil',
    path: '/dashboard/penghuni/profil',
    icon: defineComponent({
      template: '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>'
    })
  }
]

function isActive(path: string) {
  if (path === '/dashboard/penghuni') {
    return route.path === path
  }
  return route.path.startsWith(path)
}

function toggleMenu() {
  menuOpen.value = !menuOpen.value
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
