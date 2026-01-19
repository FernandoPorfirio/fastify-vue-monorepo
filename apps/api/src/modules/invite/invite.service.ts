import crypto from 'node:crypto'
import { db } from '@/lib/db'
import {
  hashPassword,
  signToken,
  createRefreshToken,
} from '@/lib/auth'

const INVITE_TOKEN_EXPIRES_IN = process.env.INVITE_TOKEN_EXPIRES_IN || '7d'

export interface CreateInviteInput {
  tenantId: number
  invitedBy: number
  profileId: number
  email: string
}

export interface CreateInviteResult {
  message: string
  token?: string // For development/testing
  expiresAt: Date
}

export interface AcceptInviteInput {
  token: string
  email: string
  name: string
  password: string
}

export interface AcceptInviteResult {
  token: string
  refreshToken: string
  user: {
    id: number
    email: string
    name: string
  }
}

function getInviteTokenExpiresAt(): Date {
  const expires = INVITE_TOKEN_EXPIRES_IN
  const match = /(\d+)([dhm])/.exec(expires)
  
  if (!match) {
    // Default to 7 days
    return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  }
  
  const value = Number.parseInt(match[1], 10)
  const unit = match[2]
  
  const multipliers: Record<string, number> = {
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  }
  
  return new Date(Date.now() + value * multipliers[unit])
}

export class InviteService {
  async createInvite(
    input: CreateInviteInput
  ): Promise<CreateInviteResult | null> {
    // Verificar se o tenant existe e está ativo
    const tenant = await db('tenants')
      .where({ id: input.tenantId, is_active: true })
      .first()

    if (!tenant) {
      return null
    }

    // Verificar se o usuário que está convidando pertence ao tenant
    const tenantUser = await db('tenant_users')
      .where({
        tenant_id: input.tenantId,
        user_id: input.invitedBy,
        is_active: true,
      })
      .first()

    if (!tenantUser) {
      return null
    }

    // Verificar se o perfil existe e está ativo
    const profile = await db('profiles')
      .where({ id: input.profileId, is_active: true })
      .first()

    if (!profile) {
      return null
    }

    // Verificar se o email já está cadastrado
    const existingUser = await db('users')
      .where({ email: input.email })
      .first()

    if (existingUser) {
      // Verificar se o usuário já pertence ao tenant
      const existingTenantUser = await db('tenant_users')
        .where({
          tenant_id: input.tenantId,
          user_id: existingUser.id,
        })
        .first()

      if (existingTenantUser) {
        return null
      }
    }

    // Verificar se já existe um convite pendente para este email no tenant
    const existingInvite = await db('invites')
      .where({
        tenant_id: input.tenantId,
        email: input.email,
      })
      .whereNull('accepted_at')
      .where('expires_at', '>', db.fn.now())
      .first()

    if (existingInvite) {
      return null
    }

    // Invalidar convites anteriores para este email no tenant
    await db('invites')
      .where({
        tenant_id: input.tenantId,
        email: input.email,
      })
      .whereNull('accepted_at')
      .update({ expires_at: db.fn.now() })

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = getInviteTokenExpiresAt()

    // Criar o convite
    await db('invites').insert({
      tenant_id: input.tenantId,
      invited_by: input.invitedBy,
      profile_id: input.profileId,
      email: input.email,
      token,
      expires_at: expiresAt,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    // TODO: Enviar email com o link de convite
    // Deve incluir:
    // - Email do destinatário: input.email
    // - Nome do tenant: tenant.name
    // - Nome do perfil: profile.name
    // - Link com o token: `${process.env.FRONTEND_URL}/invite/accept?token=${token}`
    // - Data de expiração: expiresAt
    
    // Para desenvolvimento, retornar o token na resposta
    const isDevelopment = process.env.NODE_ENV === 'development'

    return {
      message: 'Invite sent successfully',
      expiresAt,
      ...(isDevelopment && { token }),
    }
  }

  async acceptInvite(
    input: AcceptInviteInput
  ): Promise<AcceptInviteResult | null> {
    // Verificar se o token é válido
    const invite = await db('invites')
      .where({ token: input.token })
      .whereNull('accepted_at')
      .where('expires_at', '>', db.fn.now())
      .first()

    if (!invite) {
      return null
    }

    // Verificar se o email corresponde
    if (invite.email.toLowerCase() !== input.email.toLowerCase()) {
      return null
    }

    // Verificar se o tenant ainda está ativo
    const tenant = await db('tenants')
      .where({ id: invite.tenant_id, is_active: true })
      .first()

    if (!tenant) {
      return null
    }

    // Verificar se já existe um usuário com este email
    let user = await db('users')
      .where({ email: input.email })
      .first()

    // Se o usuário não existe, criar
    if (!user) {
      const hashedPassword = await hashPassword(input.password)
      
      const [userId] = await db('users')
        .insert({
          email: input.email,
          password: hashedPassword,
          name: input.name,
          is_active: true,
          email_verified: true,
          email_verified_at: db.fn.now(),
          created_at: db.fn.now(),
          updated_at: db.fn.now(),
        })
        .returning('id')

      user = await db('users').where({ id: userId }).first()
    }

    // Verificar se o usuário já pertence ao tenant
    const existingTenantUser = await db('tenant_users')
      .where({
        tenant_id: invite.tenant_id,
        user_id: user.id,
      })
      .first()

    // Associar usuário ao tenant se ainda não estiver associado
    if (!existingTenantUser) {
      await db('tenant_users').insert({
        tenant_id: invite.tenant_id,
        user_id: user.id,
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
    }

    // Verificar se o usuário já tem este perfil no tenant
    const existingUserProfile = await db('user_profiles')
      .where({
        user_id: user.id,
        profile_id: invite.profile_id,
        tenant_id: invite.tenant_id,
      })
      .first()

    // Associar usuário ao perfil se ainda não estiver associado
    if (!existingUserProfile) {
      await db('user_profiles').insert({
        user_id: user.id,
        profile_id: invite.profile_id,
        tenant_id: invite.tenant_id,
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
    }

    // Marcar o convite como aceito
    await db('invites')
      .where({ id: invite.id })
      .update({
        accepted_at: db.fn.now(),
        updated_at: db.fn.now(),
      })

    // Gerar tokens de autenticação
    const token = signToken({
      userId: user.id,
      email: user.email,
      tenantId: invite.tenant_id,
    })

    const refreshToken = await createRefreshToken({
      userId: user.id,
    })

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    }
  }
}
