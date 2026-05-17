<script setup lang="ts">
const user = useSupabaseUser()

if (!user.value) {
  await navigateTo('/login')
}

const { fetchProfile } = useRole()
const profile = await fetchProfile(user.value.id)

if (profile?.role === 'admin') {
  await navigateTo('/dashboard/pengelola')
} else {
  await navigateTo('/dashboard/penghuni')
}
</script>

<template>
  <div />
</template>
