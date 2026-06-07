export const useBilling = () => {
  const client = useSupabaseClient()

  async function fetchBills(tenantId: string) {
    const { data, error } = await client
      .from('bills')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('due_date', { ascending: false })

    if (error) throw error
    return data
  }

  async function fetchCurrentBill(tenantId: string) {
    const now = new Date().toISOString().split('T')[0]
    const { data, error } = await client
      .from('bills')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('due_date', now)
      .order('due_date', { ascending: true })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  }

  async function updatePaymentProof(billId: string, proofUrl: string) {
    const { error } = await client
      .from('bills')
      .update({
        proof_url: proofUrl,
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', billId)

    if (error) throw error
  }

  async function fetchAllBills(tenantId?: string) {
    let query = client.from('bills').select('*, tenants(name, room_number)')
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  }

  async function verifyPayment(billId: string, status: 'paid' | 'pending') {
    const updates: any = { status }
    
    if (status === 'paid') {
      updates.paid_at = new Date().toISOString()
    } else {
      updates.proof_url = null
      updates.payment_method = null
      updates.paid_at = null
    }
    
    const { error } = await client
      .from('bills')
      .update(updates)
      .eq('id', billId)

    if (error) throw error
  }

  async function createBill(bill: {
    tenant_id: string
    title: string
    amount: number
    due_date: string
  }) {
    const { data, error } = await client
      .from('bills')
      .insert(bill)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function deleteBill(billId: string) {
    const { error } = await client
      .from('bills')
      .delete()
      .eq('id', billId)

    if (error) throw error
  }

  async function updateBill(billId: string, updates: { amount?: number; title?: string; status?: string }) {
    const { error } = await client
      .from('bills')
      .update(updates)
      .eq('id', billId)

    if (error) throw error
  }

  return {
    fetchBills,
    fetchCurrentBill,
    updatePaymentProof,
    fetchAllBills,
    verifyPayment,
    createBill,
    deleteBill,
    updateBill,
  }
}
