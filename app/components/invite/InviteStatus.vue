<template>
  <div class="flex items-center gap-1.5">
    <span
      class="inline-block w-2 h-2 rounded-full"
      :class="colorClass"
    />
    <span class="text-sm font-medium" :class="textClass">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
}>()

const statusConfig: Record<string, { label: string; color: string; text: string }> = {
  pending: {
    label: 'Menunggu',
    color: 'bg-yellow-400',
    text: 'text-yellow-700'
  },
  accepted: {
    label: 'Diterima',
    color: 'bg-green-500',
    text: 'text-green-700'
  },
  expired: {
    label: 'Kedaluwarsa',
    color: 'bg-gray-400',
    text: 'text-gray-500'
  },
  cancelled: {
    label: 'Dibatalkan',
    color: 'bg-red-500',
    text: 'text-red-700'
  }
}

const config = computed(() => statusConfig[props.status] || statusConfig.pending)
const label = computed(() => config.value.label)
const colorClass = computed(() => config.value.color)
const textClass = computed(() => config.value.text)
</script>
