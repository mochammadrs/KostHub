import { serverSupabaseClient, serverSupabaseServiceRole, serverSupabaseUser } from '#supabase/server'
import { randomUUID } from 'crypto'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const adminClient = serverSupabaseServiceRole(event)
  const user = await serverSupabaseUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { data: profile } = await client
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Hanya pengelola yang bisa mengundang' })
  }

  const body = await readBody(event)
  const { email, full_name, phone, room_number, move_in_date } = body

  if (!email || !full_name || !phone || !room_number || !move_in_date) {
    throw createError({ statusCode: 400, statusMessage: 'Semua field wajib diisi' })
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

  const { data: tenant, error: tenantError } = await client
    .from('tenants')
    .insert({
      name: full_name,
      email,
      phone,
      room_number,
      move_in_date
    })
    .select()
    .single()

  if (tenantError) {
    console.error('Gagal membuat tenant:', tenantError)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat data penghuni' })
  }

  const token = randomUUID()
  
  const { data: invitation, error: invitationError } = await adminClient
    .from('invitations')
    .insert({
      email,
      full_name,
      role: 'tenant',
      tenant_id: tenant.id,
      token,
      status: 'pending',
      created_by: user.id
    })
    .select()
    .single()

  if (invitationError) {
    console.error('Gagal membuat invitation record:', invitationError)
    await client.from('tenants').delete().eq('id', tenant.id)
    throw createError({ statusCode: 500, statusMessage: 'Gagal membuat invitation record' })
  }

  const { data: authData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
    email,
    {
      data: {
        tenant_id: tenant.id,
        full_name: full_name,
        role: 'tenant',
        room_number,
        phone
      },
      redirectTo: `${getRequestURL(event).origin}/auth/setup-password`
    }
  )

  if (inviteError) {
    console.error('Gagal mengirim invitation email:', inviteError)
    await client.from('tenants').delete().eq('id', tenant.id)
    await adminClient.from('invitations').delete().eq('id', invitation.id)
    throw createError({ statusCode: 500, statusMessage: `Gagal mengirim undangan: ${inviteError.message}` })
  }

  console.log('✅ Invitation email sent to:', email)
  console.log('📧 Supabase will send email with invitation link')

  return {
    success: true,
    data: {
      email: email,
      full_name: full_name,
      room_number,
      tenant_id: tenant.id,
      invitation_id: invitation.id,
      message: 'Undangan berhasil dikirim via email'
    }
  }
})
