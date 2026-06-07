import { serverSupabaseClient } from '#supabase/server'

export default defineEventHandler(async (event) => {
  const client = await serverSupabaseClient(event)
  const formData = await readMultipartFormData(event)

  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  const file = formData[0]!
  const filename = `${Date.now()}-${file.filename}`

  const { data, error } = await client.storage
    .from('payment-proofs')
    .upload(filename, file.data, {
      contentType: file.type || 'image/jpeg',
    })

  if (error) {
    throw createError({ statusCode: 500, statusMessage: error.message })
  }

  const { data: { publicUrl } } = client.storage
    .from('payment-proofs')
    .getPublicUrl(data.path)

  return { url: publicUrl, path: data.path }
})
