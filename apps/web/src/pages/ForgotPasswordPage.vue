<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { ref } from 'vue'
import AuthCard from '@/components/auth/AuthCard.vue'
import AppTextField from '@/components/ui/AppTextField.vue'
import AppButton from '@/components/ui/AppButton.vue'

const loading = ref(false)
const successMsg = ref<string | null>(null)
const errorMsg = ref<string | null>(null)

const schema = toTypedSchema(
  z.object({
    email: z.string().min(1, 'Informe seu e-mail').email('E-mail inválido'),
  })
)

const { handleSubmit, errors, defineField, submitCount } = useForm({
  validationSchema: schema,
  validateOnMount: false,
  initialValues: { email: '' },
})

const [email, emailAttrs] = defineField('email')

const onSubmit = handleSubmit(async ({ email: _email }) => {
  loading.value = true
  errorMsg.value = null
  successMsg.value = null
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    successMsg.value = 'Se existir uma conta com este e-mail, enviaremos instruções.'
  } catch (err: any) {
    errorMsg.value = err?.response?.data?.message ?? 'Falha ao enviar instruções'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <AuthCard title="Recuperar senha" icon="mdi-lock-reset">
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

      <v-alert v-if="errorMsg" type="error" density="compact" class="mb-3">
        {{ errorMsg }}
      </v-alert>
      <v-alert v-if="successMsg" type="success" density="compact" class="mb-3">
        {{ successMsg }}
      </v-alert>

      <AppButton :loading="loading" type="submit">
        <v-icon class="me-2" icon="mdi-email-send" /> Enviar instruções
      </AppButton>

      <div class="mt-3 text-center">
        <router-link :to="{ name: 'login' }">Voltar ao login</router-link>
      </div>
    </v-form>
  </AuthCard>
</template>
