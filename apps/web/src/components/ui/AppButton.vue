<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  loading?: boolean
  color?: string
  variant?: 'flat' | 'tonal' | 'elevated' | 'outlined' | 'text' | 'plain'
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  color: 'primary',
  variant: 'flat',
  block: true,
})

const classes = computed(() => ({
  'w-100': props.block,
}))
</script>

<template>
  <v-btn
    :loading="props.loading"
    :color="props.color"
    :variant="props.variant"
    :class="classes"
    v-bind="$attrs"
  >
    <slot />
  </v-btn>
</template>

<style scoped></style>
