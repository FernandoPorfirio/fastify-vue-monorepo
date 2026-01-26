<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string | undefined
  label?: string
  errorMessages?: string[]
  autocomplete?: string
  variant?: 'outlined' | 'underlined' | 'filled' | 'solo' | 'plain'
  density?: 'compact' | 'comfortable' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  errorMessages: () => [],
  autocomplete: 'current-password',
  variant: 'outlined',
  density: 'comfortable',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | undefined): void
}>()

const localValue = ref<string | undefined>(props.modelValue)
const show = ref(false)

watch(
  () => props.modelValue,
  v => (localValue.value = v)
)
</script>

<template>
  <v-text-field
    v-model="localValue"
    :label="props.label"
    :type="show ? 'text' : 'password'"
    :error-messages="props.errorMessages"
    prepend-inner-icon="mdi-lock"
    :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'"
    @click:append-inner="show = !show"
    :autocomplete="props.autocomplete"
    :variant="props.variant"
    :density="props.density"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<style scoped></style>
