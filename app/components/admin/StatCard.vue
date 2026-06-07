<template>
  <div class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between mb-3">
      <p class="text-sm font-medium text-gray-600">{{ title }}</p>
      <div v-if="icon" class="w-10 h-10 rounded-lg flex items-center justify-center" :class="iconBgClass">
        <component :is="icon" class="w-5 h-5" :class="iconColorClass" />
      </div>
    </div>
    
    <div class="mb-2">
      <p class="text-3xl font-bold" :class="valueColorClass">{{ value }}</p>
    </div>
    
    <p class="text-sm text-gray-500">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  subtitle: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  icon?: any
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const valueColorClass = computed(() => {
  const colors = {
    default: 'text-gray-900',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }
  return colors[props.variant]
})

const iconBgClass = computed(() => {
  const colors = {
    default: 'bg-gray-100',
    success: 'bg-green-50',
    warning: 'bg-orange-50',
    danger: 'bg-red-50',
    info: 'bg-blue-50'
  }
  return colors[props.variant]
})

const iconColorClass = computed(() => {
  const colors = {
    default: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-orange-600',
    danger: 'text-red-600',
    info: 'text-blue-600'
  }
  return colors[props.variant]
})
</script>
