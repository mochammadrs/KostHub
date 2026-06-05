import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: profile } = await client
    .from('profiles')
    .select('role, tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Hanya pengelola yang bisa mengundang' })
  }

  const body = await readBody(event)
  const { email, full_name } = body

  if (!email || !full_name) {
    throw createError({ statusCode: 400, statusMessage: 'Email dan nama lengkap wajib diisi' })
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({ statusCode: 400, statusMessage: 'Format email tidak valid' })
  }

  if (full_name.length < 2) {
    throw createError({ statusCode: 400, statusMessage: 'Nama lengkap minimal 2 karakter' })
  }

  const { data: existingUser } = await client
    .from('profiles')
    .select('user_id')
    .eq('email', email)
    .maybeSingle()

  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'Email ini sudah terdaftar sebagai pengguna' })
  }

  const { data: existingInvite } = await client
    .from('invitations')
    .select('id, status')
    .eq('email', email)
    .in('status', ['pending'])
    .maybeSingle()

  if (existingInvite) {
    throw createError({ statusCode: 409, statusMessage: 'Undangan sudah dikirim ke email ini sebelumnya' })
  }

  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invitation, error } = await client
    .from('invitations')
    .insert({
      email,
      full_name,
      tenant_id: profile.tenant_id,
      role: 'tenant',
      token,
      created_by: user.id,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Gagal membuat invitation:', error)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat undangan' })
  }

  const inviteUrl = `${getRequestURL(event).origin}/invite/accept?token=${token}`
  console.log('📧 Invite link:', inviteUrl)

  return {
    success: true,
    data: {
      id: invitation.id,
      email: invitation.email,
      full_name: invitation.full_name,
      status: invitation.status,
      created_at: invitation.created_at,
      invite_url: inviteUrl
    }
  }
})
