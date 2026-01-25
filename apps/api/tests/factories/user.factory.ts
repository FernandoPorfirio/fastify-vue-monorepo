import { faker } from '@faker-js/faker'
import { hashPassword } from '@/lib/auth'
import { db } from '@/lib/db'

/**
 * Factory para criar dados de User
 *
 * Factory PURA: não tem side effects, apenas retorna dados.
 * Para inserir no banco, use o helper insertUser() explicitamente.
 */
export function makeUser(overrides: Partial<UserData> = {}): UserData {
  return {
    email: faker.internet.email().toLowerCase(),
    password: 'password123', // Senha padrão não hashada
    name: faker.person.fullName(),
    is_active: true,
    email_verified: false,
    ...overrides,
  }
}

/**
 * Insere um User no banco de dados de teste
 *
 * IMPORTANTE: A senha será automaticamente hashada antes de inserir.
 */
export async function insertUser(data?: Partial<UserData>): Promise<UserRecord> {
  // Using db from @/lib/db
  const userData = makeUser(data)

  // Hash da senha antes de inserir
  const hashedPassword = await hashPassword(userData.password)

  const [user] = await db('users')
    .insert({
      ...userData,
      password: hashedPassword,
    })
    .returning('*')

  return user
}

/**
 * Insere um User já vinculado a um Tenant
 */
export async function insertUserWithTenant(
  tenantId: number,
  userData?: Partial<UserData>
): Promise<UserRecord> {
  // Using db from @/lib/db
  const user = await insertUser(userData)

  // Criar relação tenant_users
  await db('tenant_users').insert({
    tenant_id: tenantId,
    user_id: user.id,
  })

  return user
}

// Types
export interface UserData {
  email: string
  password: string
  name: string
  is_active: boolean
  email_verified: boolean
}

export interface UserRecord {
  id: number
  external_reference: string
  email: string
  password: string
  name: string
  is_active: boolean
  email_verified: boolean
  email_verified_at: Date | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
