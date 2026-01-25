import { faker } from '@faker-js/faker'
import { db } from '@/lib/db'

/**
 * Factory para criar dados de Tenant
 *
 * Factory PURA: não tem side effects, apenas retorna dados.
 * Para inserir no banco, use o helper insertTenant() explicitamente.
 */
export function makeTenant(overrides: Partial<TenantData> = {}): TenantData {
  return {
    name: faker.company.name(),
    slug: faker.helpers.slugify(faker.company.name()).toLowerCase(),
    domain: faker.internet.domainName(),
    plan: faker.helpers.arrayElement(['free', 'starter', 'professional', 'enterprise']),
    max_users: 5,
    owner_email: faker.internet.email(),
    support_email: faker.internet.email(),
    phone: faker.phone.number(),
    is_active: true,
    is_trial: true,
    ...overrides,
  }
}

/**
 * Insere um Tenant no banco de dados de teste
 */
export async function insertTenant(data?: Partial<TenantData>): Promise<TenantRecord> {
  // Using db from @/lib/db
  const tenantData = makeTenant(data)

  const [tenant] = await db('tenants').insert(tenantData).returning('*')
  return tenant
}

// Types
export interface TenantData {
  name: string
  slug: string
  domain: string | null
  plan: 'free' | 'starter' | 'professional' | 'enterprise'
  max_users: number
  owner_email: string
  support_email: string | null
  phone: string | null
  is_active: boolean
  is_trial: boolean
}

export interface TenantRecord extends TenantData {
  id: number
  external_reference: string
  subscription_started_at: Date | null
  subscription_expires_at: Date | null
  settings: Record<string, any> | null
  billing_name: string | null
  billing_document: string | null
  billing_address: string | null
  billing_city: string | null
  billing_state: string | null
  billing_postal_code: string | null
  billing_country: string | null
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
