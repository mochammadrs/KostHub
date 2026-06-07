import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async () => {
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

  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('schemaname, tablename, policyname')
      .eq('schemaname', 'public')
      .in('tablename', ['bills', 'tickets', 'announcements'])

    if (error) throw error

    return {
      success: true,
      policies: data
    }
  } catch (e: any) {
    return {
      success: false,
      error: e.message
    }
  }
})
