import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = query.token as string

  if (!token) {
    throw createError({ statusCode: 400, statusMessage: 'Token tidak ditemukan' })
  }

  const client = await serverSupabaseClient(event)

  const { data: invitation } = await client
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Link tidak valid. Hubungi pengelola kost Anda' })
  }

  if (invitation.status === 'accepted') {
    throw createError({ statusCode: 400, statusMessage: 'Akun sudah aktif. Silakan login' })
  }

  if (invitation.status === 'expired' || invitation.status === 'cancelled') {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah tidak berlaku. Minta pengelola mengirim ulang undangan' })
  }

  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)

  if (now > expiresAt) {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah kedaluwarsa. Minta pengelola mengirim ulang undangan' })
  }

  return {
    success: true,
    data: {
      email: invitation.email,
      full_name: invitation.full_name,
      status: invitation.status
    }
  }
})
