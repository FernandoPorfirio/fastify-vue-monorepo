import { db } from '@/lib/db'

/**
 * Global Teardown: executado após todos os testes
 * Fecha conexão com o banco
 */
export default async function globalTeardown() {
  console.log('\n🧹 Global teardown: closing database connection...')
  await db.destroy()
  console.log('✓ Database connection closed\n')
}
