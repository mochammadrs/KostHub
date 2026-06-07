export const useAnnouncements = () => {
  const client = useSupabaseClient()

  async function fetchAnnouncements(tenantId?: string | null) {
    let query = client
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })

    if (tenantId) {
      query = query.or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
    }

    const { data, error } = await query
    if (error) throw error
    return data
  }

  async function createAnnouncement(announcement: {
    tenant_id?: string | null
    title: string
    content: string
  }) {
    const { data, error } = await client
      .from('announcements')
      .insert(announcement)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async function deleteAnnouncement(id: string) {
    const { error } = await client
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  return {
    fetchAnnouncements,
    createAnnouncement,
    deleteAnnouncement,
  }
}
