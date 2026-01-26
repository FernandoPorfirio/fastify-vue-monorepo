<script setup lang="ts">
interface Props {
  title?: string
  icon?: string
}

const props = defineProps<Props>()
</script>

<template>
  <v-card elevation="2">
    <v-card-title v-if="props.title" class="text-h5 text-center">
      <v-icon v-if="props.icon" class="me-2" :icon="props.icon" />
      {{ props.title }}
    </v-card-title>
    <v-card-text>
      <slot />
    </v-card-text>
    <v-card-actions>
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<style scoped></style>
