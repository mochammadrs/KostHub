export const useTickets = () => {
  const client = useSupabaseClient()

  async function fetchTickets(tenantId: string) {
    const { data, error } = await client
      .from('tickets')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async function createTicket(ticket: {
    tenant_id: string
    title: string
    description?: string
    category?: string
  }) {
    const { data, error } = await client
      .from('tickets')
      .insert(ticket)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function fetchAllTickets() {
    const { data, error } = await client
      .from('tickets')
      .select('*, tenants(name)')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  async function updateTicketStatus(ticketId: string, status: 'menunggu' | 'diproses' | 'selesai' | 'ditolak') {
    const { error } = await client
      .from('tickets')
      .update({ status })
      .eq('id', ticketId)

    if (error) throw error
  }

  return {
    fetchTickets,
    createTicket,
    fetchAllTickets,
    updateTicketStatus,
  }
}
