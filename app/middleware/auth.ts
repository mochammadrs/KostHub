export default defineNuxtRouteMiddleware((to) => {
  const user = useSupabaseUser()

  // Allow unauthenticated access only to /login
  if (!user.value && to.path !== '/login') {
    return navigateTo('/login')
  }

  // If already logged in and trying to access /login, redirect to dashboard
  if (user.value && to.path === '/login') {
    return navigateTo('/dashboard/penghuni')
  }
})
