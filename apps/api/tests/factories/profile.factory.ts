import { faker } from '@faker-js/faker'
import { db } from '@/lib/db'

/**
 * Factory para criar dados de Profile
 *
 * Factory PURA: não tem side effects, apenas retorna dados.
 * Para inserir no banco, use o helper insertProfile() explicitamente.
 */
export function makeProfile(overrides: Partial<ProfileData> = {}): ProfileData {
  return {
    name: faker.person.jobTitle(),
    description: faker.lorem.sentence(),
    is_active: true,
    ...overrides,
  }
}

/**
 * Insere um Profile no banco de dados de teste
 */
export async function insertProfile(data?: Partial<ProfileData>): Promise<ProfileRecord> {
  // Using db from @/lib/db
  const profileData = makeProfile(data)

  const [profile] = await db('profiles').insert(profileData).returning('*')
  return profile
}

/**
 * Vincula um Profile a uma Route
 */
export async function linkProfileToRoute(profileId: number, routeId: number): Promise<void> {
  // Using db from @/lib/db

  await db('profile_routes').insert({
    profile_id: profileId,
    route_id: routeId,
  })
}

/**
 * Vincula um User a um Profile
 */
export async function linkUserToProfile(userId: number, profileId: number): Promise<void> {
  // Using db from @/lib/db

  await db('user_profiles').insert({
    user_id: userId,
    profile_id: profileId,
  })
}

// Types
export interface ProfileData {
  name: string
  description: string | null
  is_active: boolean
}

export interface ProfileRecord extends ProfileData {
  id: number
  external_reference: string
  created_at: Date
  updated_at: Date
  deleted_at: Date | null
}
