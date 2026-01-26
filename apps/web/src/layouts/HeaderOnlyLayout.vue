<script setup lang="ts"></script>

<template>
  <v-app>
    <v-app-bar app color="primary" elevation="1">
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
