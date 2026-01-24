import { faker } from '@faker-js/faker'
import crypto from 'node:crypto'
import { db } from '@/lib/db'

/**
 * Factory para criar dados de Invite
 * 
 * Factory PURA: não tem side effects, apenas retorna dados.
 * Para inserir no banco, use o helper insertInvite() explicitamente.
 */
export function makeInvite(
  tenantId: number,
  profileId: number,
  overrides: Partial<InviteData> = {}
): InviteData {
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 dias no futuro
  
  return {
    tenant_id: tenantId,
    profile_id: profileId,
    invited_by: null,
    email: faker.internet.email().toLowerCase(),
    token: crypto.randomBytes(32).toString('hex'),
    expires_at: expiresAt,
    ...overrides,
  }
}

/**
 * Insere um Invite no banco de dados de teste
 */
export async function insertInvite(
  tenantId: number,
  profileId: number,
  data?: Partial<InviteData>
): Promise<InviteRecord> {
  // Using db from @/lib/db
  const inviteData = makeInvite(tenantId, profileId, data)
  
  const [invite] = await db('invites').insert(inviteData).returning('*')
  return invite
}

/**
 * Aceita um convite (marca como aceito)
 */
export async function acceptInvite(inviteId: number): Promise<void> {
  // Using db from @/lib/db
  
  await db('invites')
    .where({ id: inviteId })
    .update({
      accepted_at: new Date(),
    })
}

// Types
export interface InviteData {
  tenant_id: number
  profile_id: number
  invited_by: number | null
  email: string
  token: string
  expires_at: Date
}

export interface InviteRecord extends InviteData {
  id: number
  external_reference: string
  accepted_at: Date | null
  created_at: Date
  updated_at: Date
}
