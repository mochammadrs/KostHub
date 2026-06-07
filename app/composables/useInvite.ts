export const useInvite = () => {
  const client = useSupabaseClient()
  const user = useSupabaseUser()

  const loading = ref(false)
  const error = ref<string | null>(null)

  type InvitePayload = {
    email: string
    full_name: string
    phone: string
    room_number: string
    move_in_date: string
  }

  async function createInvite(payload: InvitePayload) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const json = await res.json()

      if (!res.ok) {
        error.value = json.statusMessage || 'Gagal membuat undangan'
        return null
      }

      return json.data
    } catch (e: any) {
      error.value = e.message || 'Terjadi kesalahan'
      return null
    } finally {
      loading.value = false
    }
  }

  async function verifyToken(token: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch(`/api/invite/verify?token=${encodeURIComponent(token)}`)
      const json = await res.json()

      if (!res.ok) {
        error.value = json.statusMessage || 'Token tidak valid'
        return null
      }

      return json.data
    } catch (e: any) {
      error.value = e.message || 'Terjadi kesalahan'
      return null
    } finally {
      loading.value = false
    }
  }

  async function acceptInvite(token: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      const json = await res.json()

      if (!res.ok) {
        error.value = json.statusMessage || 'Gagal menerima undangan'
        return false
      }

      return true
    } catch (e: any) {
      error.value = e.message || 'Terjadi kesalahan'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    createInvite,
    verifyToken,
    acceptInvite,
    loading,
    error
  }
}
