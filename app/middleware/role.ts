export default defineNuxtRouteMiddleware(async (to) => {
  const client = useSupabaseClient()
  const { fetchProfile } = useRole()
  const {
    data: { user },
  } = await client.auth.getUser()

  if (!user) {
    return navigateTo('/login')
  }

  const profile = await fetchProfile(user.id)

  if (!profile) {
    return navigateTo('/login')
  }

  // Admin-only routes
  if (to.path.startsWith('/dashboard/pengelola') && profile.role !== 'admin') {
    return navigateTo('/dashboard/penghuni')
  }

  // Tenant-only routes
  if (to.path.startsWith('/dashboard/penghuni') && profile.role !== 'tenant') {
    return navigateTo('/dashboard/pengelola')
  }
})
