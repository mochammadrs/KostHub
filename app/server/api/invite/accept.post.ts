import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const body = await readBody(event)
  const { token, password } = body

  if (!token || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Token dan password wajib diisi' })
  }

  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password minimal 8 karakter' })
  }

  const { data: invitation } = await client
    .from('invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (!invitation) {
    throw createError({ statusCode: 404, statusMessage: 'Link tidak valid. Hubungi pengelola kost Anda' })
  }

  if (invitation.status !== 'pending') {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah tidak berlaku' })
  }

  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)
  if (now > expiresAt) {
    throw createError({ statusCode: 400, statusMessage: 'Link sudah kedaluwarsa. Minta pengelola mengirim ulang undangan' })
  }

  const adminClient = serverSupabaseServiceRole(event)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email: invitation.email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: invitation.full_name,
      role: invitation.role
    }
  })

  if (authError) {
    if (authError.message?.includes('already')) {
      throw createError({ statusCode: 409, statusMessage: 'Email ini sudah terdaftar' })
    }
    console.error('Gagal register auth:', authError)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat akun' })
  }

  if (!authData.user) {
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat akun' })
  }

  const { error: profileError } = await adminClient
    .from('profiles')
    .insert({
      user_id: authData.user.id,
      email: invitation.email,
      full_name: invitation.full_name,
      role: invitation.role,
      tenant_id: invitation.tenant_id
    })

  if (profileError) {
    console.error('Gagal membuat profile:', profileError)
    await adminClient.auth.admin.deleteUser(authData.user.id)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat profile' })
  }

  const { error: updateError } = await client
    .from('invitations')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', invitation.id)

  if (updateError) {
    console.error('Gagal update invitation:', updateError)
  }

  return {
    success: true,
    message: 'Akun berhasil dibuat. Silakan login'
  }
})
