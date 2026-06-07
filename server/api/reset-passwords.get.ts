import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  
  const supabase = createClient(
    config.public.supabaseUrl,
    config.supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  const usersToReset = [
    { email: 'admin@kosthub.com', password: 'Admin123!' },
    { email: 'penghuni2@test.com', password: 'test123' },
    { email: 'rizky1212t@gmail.com', password: 'password123' }
  ]

  const results = []

  for (const user of usersToReset) {
    try {
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
      
      if (listError) {
        results.push({ email: user.email, success: false, error: listError.message })
        continue
      }

      const foundUser = users.find(u => u.email === user.email)
      
      if (!foundUser) {
        results.push({ email: user.email, success: false, error: 'User not found' })
        continue
      }

      const { data, error } = await supabase.auth.admin.updateUserById(
        foundUser.id,
        { 
          password: user.password,
          email_confirm: true
        }
      )

      if (error) {
        results.push({ email: user.email, success: false, error: error.message })
      } else {
        results.push({ email: user.email, success: true, userId: data.user.id })
      }
    } catch (err: any) {
      results.push({ email: user.email, success: false, error: err.message })
    }
  }

  return {
    success: results.every(r => r.success),
    results
  }
})
