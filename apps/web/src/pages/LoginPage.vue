<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ref } from 'vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppPasswordField from '@/components/ui/AppPasswordField.vue'
import AppButton from '@/components/ui/AppButton.vue'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const loading = ref(false)
const errorMsg = ref<string | null>(null)

const schema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
    password: z.string().min(1, 'Informe sua senha').min(6, 'Mínimo de 6 caracteres'),
  })
)

const { handleSubmit, errors, defineField, submitCount } = useForm({
  validationSchema: schema,
  validateOnMount: false,
  initialValues: { email: '', password: '' },
})

const [email, emailAttrs] = defineField('email')
const [password, passwordAttrs] = defineField('password')

const onSubmit = handleSubmit(async ({ email, password }) => {
  loading.value = true
  errorMsg.value = null
  try {
    await auth.login(email, password)
    const redirect = (route.query.redirect as string | undefined) ?? '/'
    router.replace(redirect)
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message ?? 'Falha no login'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AuthCard title="Entrar" icon="mdi-account-lock">
    <v-form @submit.prevent="onSubmit">
      <AppTextField
        v-model="email"
        v-bind="emailAttrs"
        label="E-mail"
        type="email"
        :error-messages="submitCount > 0 && errors.email ? [errors.email] : []"
        prepend-inner-icon="mdi-email"
        autocomplete="email"
      />

      <AppPasswordField
        v-model="password"
        v-bind="passwordAttrs"
        label="Senha"
        :error-messages="submitCount > 0 && errors.password ? [errors.password] : []"
        autocomplete="current-password"
      />

      <v-alert v-if="errorMsg" type="error" density="compact" class="mb-3">
        {{ errorMsg }}
      </v-alert>

      <AppButton :loading="loading" type="submit">
        <v-icon class="me-2" icon="mdi-login" /> Entrar
      </AppButton>

      <div class="mt-3 text-center">
        <router-link :to="{ name: 'forgot-password' }">Esqueci minha senha</router-link>
      </div>
    </v-form>
  </AuthCard>
</template>
