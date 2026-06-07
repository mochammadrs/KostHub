<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'role'],
  layout: 'tenant'
})

const route = useRoute()
const router = useRouter()
const client = useSupabaseClient()

const billId = route.query.billId as string
const bill = ref<any>(null)
const tenant = ref<any>(null)
const loading = ref(true)
const selectedMethod = ref('')
const uploadedFile = ref<File | null>(null)
const uploading = ref(false)
const error = ref('')

const paymentMethods = [
  {
    id: 'transfer',
    name: 'Transfer Bank',
    description: 'BCA, Mandiri, BNI, BRI',
    icon: 'bank'
  },
  {
    id: 'ewallet',
    name: 'E-Wallet',
    description: 'GoPay, OVO, Dana, ShopeePay',
    icon: 'phone'
  },
  {
    id: 'card',
    name: 'Kartu Kredit/Debit',
    description: 'Visa, Mastercard',
    icon: 'card'
  }
]

async function loadBill() {
  try {
    const { data: billData } = await client
      .from('bills')
      .select('*, tenants(*)')
      .eq('id', billId)
      .single()
    
    if (billData) {
      bill.value = billData
      tenant.value = billData.tenants
    }
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    uploadedFile.value = target.files[0]
  }
}

async function submitPayment() {
  if (!selectedMethod.value) {
    error.value = 'Pilih metode pembayaran'
    return
  }

  if (!uploadedFile.value) {
    error.value = 'Upload bukti pembayaran'
    return
  }

  uploading.value = true
  error.value = ''

  try {
    const fileExt = uploadedFile.value.name.split('.').pop()
    const fileName = `${bill.value.id}-${Date.now()}.${fileExt}`
    const filePath = `payment-proofs/${fileName}`

    const { error: uploadError } = await client.storage
      .from('payment-proofs')
      .upload(filePath, uploadedFile.value)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = client.storage
      .from('payment-proofs')
      .getPublicUrl(filePath)

    const { data: { session } } = await client.auth.getSession()
    console.log('Auth session:', session)
    console.log('User ID:', session?.user?.id)

    const { error: updateError } = await client
      .from('bills')
      .update({
        proof_url: publicUrl,
        payment_method: selectedMethod.value,
        status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', bill.value.id)

    if (updateError) throw updateError

    router.push('/dashboard/penghuni?payment=success')
  } catch (e: any) {
    error.value = e.message
  } finally {
    uploading.value = false
  }
}

await loadBill()
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <div class="mb-6">
      <NuxtLink to="/dashboard/penghuni" class="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition mb-4">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        <span class="font-medium">Pembayaran</span>
      </NuxtLink>
    </div>

    <p v-if="loading" class="text-gray-500 text-center py-8">Memuat data...</p>

    <template v-else-if="bill">
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <p class="text-sm text-gray-500 mb-1">Total Pembayaran</p>
        <p class="text-3xl font-bold text-gray-900 mb-2">
          {{ new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(bill.amount) }}
        </p>
        <p class="text-sm text-gray-500">
          Kamar {{ tenant?.room_number || '-' }} - {{ new Date(bill.due_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) }}
        </p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">Pilih Metode Pembayaran</h3>
        <div class="space-y-3">
          <label
            v-for="method in paymentMethods"
            :key="method.id"
            class="flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition"
            :class="selectedMethod === method.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
          >
            <input
              type="radio"
              :value="method.id"
              v-model="selectedMethod"
              class="w-5 h-5 text-blue-600"
            />
            <div class="flex items-center gap-3 flex-1">
              <div class="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                <svg v-if="method.icon === 'bank'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <svg v-else-if="method.icon === 'phone'" class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <svg v-else class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ method.name }}</p>
                <p class="text-sm text-gray-500">{{ method.description }}</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
        <h3 class="font-semibold text-gray-900 mb-4">Upload Bukti Pembayaran</h3>
        <div class="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
          <input
            type="file"
            @change="handleFileSelect"
            accept="image/*"
            class="hidden"
            id="file-upload"
          />
          <label for="file-upload" class="cursor-pointer">
            <svg class="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p class="text-sm font-medium text-gray-900 mb-1">
              {{ uploadedFile ? uploadedFile.name : 'Klik untuk unggah foto' }}
            </p>
            <p class="text-xs text-gray-500">PNG, JPG hingga 5MB</p>
          </label>
        </div>
      </div>

      <p v-if="error" class="text-red-500 text-sm mb-4">{{ error }}</p>

      <button
        @click="submitPayment"
        :disabled="!selectedMethod || !uploadedFile || uploading"
        class="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {{ uploading ? 'Mengirim...' : 'Bayar Sekarang' }}
      </button>
    </template>
  </div>
</template>
