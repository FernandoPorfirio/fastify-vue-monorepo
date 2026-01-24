/**
 * Gera um email único para testes
 * Usa timestamp + random para garantir unicidade entre testes paralelos
 */
export function uniqueEmail(prefix = 'test'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${prefix}-${timestamp}-${random}@example.com`
}

/**
 * Gera um nome único para testes
 */
export function uniqueName(prefix = 'Test'): string {
  const random = Math.random().toString(36).substring(7)
  return `${prefix} ${random}`
}

/**
 * Gera um slug único para testes
 */
export function uniqueSlug(prefix = 'test'): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  return `${prefix}-${timestamp}-${random}`
}
