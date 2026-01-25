import { config } from 'dotenv'
import { resolve } from 'node:path'
import { ensureTestDatabaseExists, runTestMigrations } from '../helpers/test-database'

/**
 * Global Setup: executado UMA VEZ antes de todos os testes
 * Garante que o banco de teste existe e executa migrations
 */

// Carregar variáveis de ambiente
config({ path: resolve(__dirname, '../../.env.test') })
process.env.NODE_ENV = 'test'

export default async function globalSetup() {
  console.log('🔧 Global setup: checking test database...')

  // Criar banco de teste se não existir
  await ensureTestDatabaseExists()

  // Executar migrations
  await runTestMigrations()

  console.log('✓ Test database ready\n')
}
