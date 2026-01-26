<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import HeaderOnlyLayout from '@/layouts/HeaderOnlyLayout.vue'

const route = useRoute()

const layoutComponent = computed(() => {
  const layout = route.meta.layout as string | undefined
  switch (layout) {
    case 'auth':
      return AuthLayout
    case 'header':
      return HeaderOnlyLayout
    case 'sidebar':
      return MainLayout
    default:
      return MainLayout
  }
})
</script>

<template>
  <component :is="layoutComponent">
    <router-view />
  </component>
</template>

<style scoped></style>
