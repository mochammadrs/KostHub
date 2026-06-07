<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div
      v-if="localError"
      class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
    >
      {{ localError }}
    </div>

    <div
      v-if="success"
      class="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm"
    >
      Undangan berhasil dikirim ke <strong>{{ invitedEmail }}</strong>
      <p class="mt-1 text-green-600 text-xs">
        Penghuni harus klik link di email untuk set password sebelum bisa login.
      </p>
    </div>

    <template v-if="!success">
      <div>
        <label for="fullName" class="block text-sm font-medium text-gray-700 mb-1">
          Nama Lengkap
        </label>
        <input
          id="fullName"
          v-model="fullName"
          type="text"
          required
          minlength="2"
          placeholder="Nama penghuni"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          :disabled="loading"
        />
      </div>

      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="penghuni@example.com"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          :disabled="loading"
        />
      </div>

      <div>
        <label for="phone" class="block text-sm font-medium text-gray-700 mb-1">
          No. Telepon
        </label>
        <input
          id="phone"
          v-model="phone"
          type="tel"
          required
          placeholder="08xxxxxxxxxx"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          :disabled="loading"
        />
      </div>

      <div>
        <label for="roomNumber" class="block text-sm font-medium text-gray-700 mb-1">
          Nomor Kamar
        </label>
        <input
          id="roomNumber"
          v-model="roomNumber"
          type="text"
          required
          placeholder="A1, B2, dll"
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          :disabled="loading"
        />
      </div>

      <div>
        <label for="moveInDate" class="block text-sm font-medium text-gray-700 mb-1">
          Tanggal Masuk
        </label>
        <input
          id="moveInDate"
          v-model="moveInDate"
          type="date"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
          :disabled="loading"
        />
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ loading ? 'Mengirim...' : 'Kirim Undangan' }}
      </button>
    </template>
  </form>
</template>

<script setup lang="ts">
const { createInvite, loading, error } = useInvite()

const email = ref('')
const fullName = ref('')
const phone = ref('')
const roomNumber = ref('')
const moveInDate = ref('')
const localError = ref<string | null>(null)
const success = ref(false)
const invitedEmail = ref('')

watch(error, (val) => {
  localError.value = val
})

async function handleSubmit() {
  localError.value = null
  success.value = false

  if (!email.value || !fullName.value || !phone.value || !roomNumber.value || !moveInDate.value) {
    localError.value = 'Semua field wajib diisi'
    return
  }

  if (fullName.value.trim().length < 2) {
    localError.value = 'Nama lengkap minimal 2 karakter'
    return
  }

  const result = await createInvite({
    email: email.value,
    full_name: fullName.value,
    phone: phone.value,
    room_number: roomNumber.value,
    move_in_date: moveInDate.value
  })

  if (result) {
    success.value = true
    invitedEmail.value = email.value
    
    email.value = ''
    fullName.value = ''
    phone.value = ''
    roomNumber.value = ''
    moveInDate.value = ''
  }
}
</script>
