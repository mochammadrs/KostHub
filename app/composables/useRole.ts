export const useRole = () => {
  const client = useSupabaseClient()

  async function fetchProfile(userId: string) {
    const { data } = await client
      .from('profiles')
      .select('role, tenant_id')
      .eq('user_id', userId)
      .single()

    return data as { role: string; tenant_id: string | null } | null
  }

  return {
    fetchProfile,
  }
}
