import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { token, password } = await readBody(event)

  if (!token || !password) {
    throw createError({
      statusCode: 400,
      message: 'Token dan password diperlukan'
    })
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Password minimal 8 karakter'
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('email, user_id, status, expires_at')
    .eq('token', token)
    .single()

  if (inviteError || !invitation) {
    throw createError({
      statusCode: 404,
      message: 'Token tidak valid'
    })
  }

  if (invitation.status !== 'pending') {
    throw createError({
      statusCode: 400,
      message: 'Undangan sudah digunakan'
    })
  }

  const now = new Date()
  const expiresAt = new Date(invitation.expires_at)
  if (now > expiresAt) {
    throw createError({
      statusCode: 400,
      message: 'Token sudah kadaluarsa'
    })
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    invitation.user_id,
    { password }
  )

  if (updateError) {
    throw createError({
      statusCode: 500,
      message: 'Gagal set password: ' + updateError.message
    })
  }

  const { error: statusError } = await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('token', token)

  if (statusError) {
    console.error('Gagal update status invitation:', statusError)
  }

  return {
    success: true,
    email: invitation.email
  }
})
