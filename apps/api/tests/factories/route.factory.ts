import { faker } from '@faker-js/faker'
import { db } from '@/lib/db'

/**
 * Factory para criar dados de Route
 *
 * Factory PURA: não tem side effects, apenas retorna dados.
 * Para inserir no banco, use o helper insertRoute() explicitamente.
 */
export function makeRoute(overrides: Partial<RouteData> = {}): RouteData {
  const method = faker.helpers.arrayElement(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])
  const resource = faker.helpers.arrayElement(['users', 'tenants', 'profiles', 'routes', 'invites'])

  return {
    name: `${method} ${resource}`,
    path: `/api/${resource}`,
    type: 'api',
    method,
    description: faker.lorem.sentence(),
    is_active: true,
    ...overrides,
  }
}

/**
 * Insere uma Route no banco de dados de teste
 */
export async function insertRoute(data?: Partial<RouteData>): Promise<RouteRecord> {
  // Using db from @/lib/db
  const routeData = makeRoute(data)

  const [route] = await db('routes').insert(routeData).returning('*')
  return route
}

// Types
export interface RouteData {
  name: string
  path: string
  type: 'api' | 'frontend'
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD' | null
  description: string | null
  is_active: boolean
}

export interface RouteRecord extends RouteData {
  id: number
  external_reference: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
