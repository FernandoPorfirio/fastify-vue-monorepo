<script setup lang="ts">
import { ref } from 'vue'

const drawer = ref(true)
</script>

<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" app>
      <slot name="sidebar">
        <v-list density="compact">
          <v-list-item :to="{ name: 'home' }" prepend-icon="mdi-home" title="Início" />
        </v-list>
      </slot>
    </v-navigation-drawer>

    <v-app-bar app color="primary" elevation="1">
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>App</v-toolbar-title>
      <slot name="header-actions" />
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped></style>
