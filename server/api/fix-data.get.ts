import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const supabaseUrl = config.public.supabaseUrl
  const serviceRoleKey = config.supabaseSecretKey

  if (!serviceRoleKey) {
    return { success: false, error: 'Service role key not configured' }
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })
  const results: string[] = []

  const targetUserId = '5fa7b1d1-2660-46c4-8efc-26400413c7f9'
  const targetTenantId = '776ac678-bfdf-4a68-9636-5b4c702c260c'

  const { data: allProfiles, error: profilesErr } = await adminClient
    .from('profiles')
    .select('user_id, tenant_id, role, email')

  if (profilesErr) {
    results.push(`Profiles list error: ${profilesErr.message}`)
  } else {
    results.push(`Total profiles: ${allProfiles?.length || 0}`)
    allProfiles?.forEach(p => {
      results.push(`  - ${p.email} (user_id: ${p.user_id}, tenant_id: ${p.tenant_id}, role: ${p.role})`)
    })
  }

  const { data: allTenants, error: tenantsErr } = await adminClient
    .from('tenants')
    .select('id, name, room_number')

  if (tenantsErr) {
    results.push(`Tenants list error: ${tenantsErr.message}`)
  } else {
    results.push(`Total tenants: ${allTenants?.length || 0}`)
    allTenants?.forEach(t => {
      results.push(`  - ${t.name}, room ${t.room_number} (id: ${t.id}, user_id: ${t.user_id})`)
    })
  }

  const profileCheck = allProfiles?.find(p => p.user_id === targetUserId)
  const tenantCheck = allTenants?.find(t => t.id === targetTenantId)

  if (profileCheck && profileCheck.tenant_id === null && tenantCheck) {
    const { error: updateErr } = await adminClient
      .from('profiles')
      .update({ tenant_id: targetTenantId })
      .eq('user_id', targetUserId)
      .is('tenant_id', null)

    if (updateErr) {
      results.push(`Profile update failed: ${updateErr.message}`)
    } else {
      results.push('Profile updated successfully')
    }
  } else if (profileCheck?.tenant_id) {
    results.push(`Profile already has tenant_id: ${profileCheck.tenant_id}`)
  }

  if (tenantCheck) {
    const { error: billsErr } = await adminClient.from('bills').insert([
      { tenant_id: targetTenantId, title: 'Tagihan Bulan Juni 2026', amount: 750000, due_date: '2026-06-15', status: 'pending' },
      { tenant_id: targetTenantId, title: 'Tagihan Bulan Mei 2026', amount: 750000, due_date: '2026-05-15', status: 'paid' },
    ])
    if (billsErr) {
      results.push(`Bills insert error: ${billsErr.message}`)
    } else {
      results.push('Bills inserted')
    }

    const { error: ticketsErr } = await adminClient.from('tickets').insert([
      { tenant_id: targetTenantId, title: 'AC kamar tidak dingin', description: 'AC tidak mengeluarkan udara dingin', category: 'ac', status: 'menunggu' },
    ])
    if (ticketsErr) {
      results.push(`Tickets insert error: ${ticketsErr.message}`)
    } else {
      results.push('Tickets inserted')
    }
  }

  return { success: true, results }
})
