<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

async function signOut() {
  await auth.logout()
  router.replace({ name: 'login' })
}
</script>

<template>
  <v-app-bar color="primary" density="comfortable" flat>
    <v-app-bar-title>Bem-vindo, {{ auth.user?.name }}</v-app-bar-title>
    <v-spacer />
    <v-btn variant="text" @click="signOut">Sair</v-btn>
  </v-app-bar>

  <v-container class="py-6">
    <v-card elevation="1">
      <v-card-text>
        <div class="text-h6 mb-2">Homepage autenticada</div>
        <div>Você está autenticado. Personalize esta página conforme necessário.</div>
      </v-card-text>
    </v-card>
  </v-container>
</template>
