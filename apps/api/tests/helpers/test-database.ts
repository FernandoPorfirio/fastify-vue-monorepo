import knex from 'knex'
import { db } from '@/lib/db'

/**
 * Garante que o banco de dados de testes existe.
 * Se não existir, cria automaticamente.
 */
export async function ensureTestDatabaseExists(): Promise<void> {
  const dbName = process.env.TEST_DB_NAME || 'test_db'

  // Conectar ao postgres (banco padrão) para verificar/criar o banco de testes
  const adminDb = knex({
    client: 'pg',
    connection: {
      host: process.env.TEST_DB_HOST || 'localhost',
      port: Number(process.env.TEST_DB_PORT) || 5432,
      user: process.env.TEST_DB_USER || 'postgres',
      password: process.env.TEST_DB_PASS || 'postgres',
      database: 'postgres',
    },
  })

  try {
    const result = await adminDb.raw('SELECT 1 FROM pg_database WHERE datname = ?', [dbName])

    if (result.rows.length === 0) {
      console.log(`Creating test database: ${dbName}...`)
      await adminDb.raw(`CREATE DATABASE ${dbName}`)
      console.log(`✓ Test database created: ${dbName}`)
    } else {
      console.log(`✓ Test database exists: ${dbName}`)
    }
  } finally {
    await adminDb.destroy()
  }
}

/**
 * Executa migrations no banco de teste
 */
export async function runTestMigrations(): Promise<void> {
  try {
    const path = require('path')
    const migrationsDir = path.resolve(__dirname, '../../../migrations/migrations')
    console.log('Migrations directory:', migrationsDir)

    await db.migrate.latest({
      directory: migrationsDir,
    })
    console.log('✓ Migrations executed')
  } catch (error) {
    console.error('Error running migrations:', error)
    throw error
  }
}
