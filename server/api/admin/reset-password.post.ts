import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const { userId, newPassword } = await readBody(event)

  if (!userId || !newPassword) {
    throw createError({
      statusCode: 400,
      message: 'userId dan password baru diperlukan'
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { error } = await supabase.auth.admin.updateUserById(
    userId,
    { password: newPassword }
  )

  if (error) {
    throw createError({
      statusCode: 500,
      message: 'Gagal reset password: ' + error.message
    })
  }

  return {
    success: true,
    userId,
    message: 'Password berhasil direset'
  }
})
