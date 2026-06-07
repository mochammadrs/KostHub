import { serverSupabaseServiceRole } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const email = query.email as string

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email diperlukan'
    })
  }

  const supabase = serverSupabaseServiceRole(event)

  const { data, error } = await supabase
    .from('invitations')
    .select('token, email, status, expires_at')
    .eq('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw createError({
      statusCode: 404,
      message: 'Invitation tidak ditemukan'
    })
  }

  return data
})
