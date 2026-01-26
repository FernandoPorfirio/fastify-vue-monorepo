<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  modelValue: string | number | undefined
  label?: string
  type?: string
  errorMessages?: string[]
  prependInnerIcon?: string
  appendInnerIcon?: string
  autocomplete?: string
  variant?: 'outlined' | 'underlined' | 'filled' | 'solo' | 'plain'
  density?: 'compact' | 'comfortable' | 'default'
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  errorMessages: () => [],
  variant: 'outlined',
  density: 'comfortable',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | undefined): void
}>()

const localValue = ref<string | number | undefined>(props.modelValue)

watch(
  () => props.modelValue,
  (v: string | number | undefined) => (localValue.value = v)
)
</script>

<template>
  <v-text-field
    v-model="localValue"
    :label="props.label"
    :type="props.type"
    :error-messages="props.errorMessages"
    :prepend-inner-icon="props.prependInnerIcon"
    :append-inner-icon="props.appendInnerIcon"
    :autocomplete="props.autocomplete"
    :variant="props.variant"
    :density="props.density"
    v-bind="$attrs"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<style scoped></style>
