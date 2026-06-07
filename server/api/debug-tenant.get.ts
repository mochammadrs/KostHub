import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const query = getQuery(event)
  const billId = query.billId as string
  
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
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, email, role, tenant_id')
      .eq('email', 'penghuni2@test.com')
      .single()

    const { data: bill } = await supabase
      .from('bills')
      .select('id, tenant_id, amount, status')
      .eq('id', billId)
      .single()

    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, name, room_number, user_id')
      .eq('user_id', profiles?.user_id)
      .single()

    return {
      profile: profiles,
      tenant: tenant,
      bill: bill,
      match: profiles?.tenant_id === bill?.tenant_id
    }
  } catch (e: any) {
    return {
      error: e.message
    }
  }
})
