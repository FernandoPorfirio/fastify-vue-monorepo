import { db } from '@/lib/db'

export interface CreateTenantInput {
  name: string
  slug: string
  domain?: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  ownerEmail: string
  maxUsers?: number
}

export interface UpdateTenantInput {
  tenantId: number
  name?: string
  slug?: string
  domain?: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  maxUsers?: number
  ownerEmail?: string
  supportEmail?: string
  phone?: string
  isActive?: boolean
}

export interface AddUserToTenantInput {
  tenantId: number
  userId: number
}

export interface RemoveUserFromTenantInput {
  tenantId: number
  userId: number
}

export class TenantService {
  async create(input: CreateTenantInput) {
    // Verificar se slug já existe
    const existingSlug = await db('tenants')
      .where({ slug: input.slug })
      .whereNull('deleted_at')
      .first()

    if (existingSlug) {
      return null
    }

    // Verificar se domain já existe (se fornecido)
    if (input.domain) {
      const existingDomain = await db('tenants')
        .where({ domain: input.domain })
        .whereNull('deleted_at')
        .first()

      if (existingDomain) {
        return null
      }
    }

    const [tenant] = await db('tenants')
      .insert({
        name: input.name,
        slug: input.slug,
        domain: input.domain || null,
        plan: input.plan || 'free',
        owner_email: input.ownerEmail,
        max_users: input.maxUsers || 5,
        is_active: true,
        is_trial: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id')

    return this.findById(tenant.id)
  }

  async findById(tenantId: number) {
    const tenant = await db('tenants')
      .select(
        'id',
        'external_reference',
        'name',
        'slug',
        'domain',
        'plan',
        'owner_email',
        'max_users',
        'is_active',
        'is_trial',
        'created_at',
        'updated_at'
      )
      .where({ id: tenantId })
      .whereNull('deleted_at')
      .first()

    if (!tenant) {
      return null
    }

    // Convert dates to ISO strings for JSON serialization
    return {
      ...tenant,
      created_at: tenant.created_at?.toISOString(),
      updated_at: tenant.updated_at?.toISOString(),
    }
  }

  async findAll(filters?: { isActive?: boolean; plan?: string; limit?: number; offset?: number }) {
    let query = db('tenants')
      .select(
        'id',
        'external_reference',
        'name',
        'slug',
        'domain',
        'plan',
        'owner_email',
        'max_users',
        'is_active',
        'is_trial',
        'created_at',
        'updated_at'
      )
      .whereNull('deleted_at')
      .orderBy('created_at', 'desc')

    if (filters?.isActive !== undefined) {
      query = query.where('is_active', filters.isActive)
    }

    if (filters?.plan) {
      query = query.where('plan', filters.plan)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.offset(filters.offset)
    }

    const tenants = await query

    // Convert dates to ISO strings for JSON serialization
    return tenants.map(tenant => ({
      ...tenant,
      created_at: tenant.created_at?.toISOString(),
      updated_at: tenant.updated_at?.toISOString(),
    }))
  }

  async update(input: UpdateTenantInput) {
    // Verificar se tenant existe
    const tenant = await db('tenants').where({ id: input.tenantId }).whereNull('deleted_at').first()

    if (!tenant) {
      return null
    }

    // Verificar slug duplicado se estiver atualizando
    if (input.slug && input.slug !== tenant.slug) {
      const existingSlug = await db('tenants')
        .where({ slug: input.slug })
        .whereNull('deleted_at')
        .whereNot('id', input.tenantId)
        .first()

      if (existingSlug) {
        return null
      }
    }

    // Verificar domain duplicado se estiver atualizando
    if (input.domain && input.domain !== tenant.domain) {
      const existingDomain = await db('tenants')
        .where({ domain: input.domain })
        .whereNull('deleted_at')
        .whereNot('id', input.tenantId)
        .first()

      if (existingDomain) {
        return null
      }
    }

    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    }

    if (input.name) updateData.name = input.name
    if (input.slug) updateData.slug = input.slug
    if (input.domain !== undefined) updateData.domain = input.domain
    if (input.plan) updateData.plan = input.plan
    if (input.maxUsers) updateData.max_users = input.maxUsers
    if (input.ownerEmail) updateData.owner_email = input.ownerEmail
    if (input.supportEmail !== undefined) updateData.support_email = input.supportEmail
    if (input.phone !== undefined) updateData.phone = input.phone
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    await db('tenants').where({ id: input.tenantId }).update(updateData)

    return this.findById(input.tenantId)
  }

  async softDelete(tenantId: number) {
    // Verificar se tenant existe
    const tenant = await db('tenants').where({ id: tenantId }).whereNull('deleted_at').first()

    if (!tenant) {
      return null
    }

    // Fazer soft delete do tenant
    await db('tenants').where({ id: tenantId }).update({
      is_active: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    // Desativar todos os vínculos com usuários
    await db('tenant_users').where({ tenant_id: tenantId }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    // Desativar todos os perfis de usuário neste tenant
    await db('user_profiles').where({ tenant_id: tenantId }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    return {
      message: 'Tenant deleted successfully',
    }
  }

  async addUser(input: AddUserToTenantInput) {
    // Verificar se tenant existe e está ativo
    const tenant = await db('tenants')
      .where({ id: input.tenantId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!tenant) {
      return null
    }

    // Verificar se usuário existe e está ativo
    const user = await db('users')
      .where({ id: input.userId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!user) {
      return null
    }

    // Verificar se já existe vínculo
    const existingLink = await db('tenant_users')
      .where({
        tenant_id: input.tenantId,
        user_id: input.userId,
      })
      .first()

    if (existingLink) {
      // Se existe mas está inativo, reativar
      if (!existingLink.is_active) {
        await db('tenant_users').where({ id: existingLink.id }).update({
          is_active: true,
          updated_at: db.fn.now(),
        })

        return {
          message: 'User reactivated in tenant',
        }
      }

      // Já está ativo
      return null
    }

    // Verificar limite de usuários
    const userCount = await db('tenant_users')
      .where({ tenant_id: input.tenantId, is_active: true })
      .count('* as count')
      .first()

    if (userCount && Number(userCount.count) >= tenant.max_users) {
      return null
    }

    // Criar vínculo
    await db('tenant_users').insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      is_active: true,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    return {
      message: 'User added to tenant successfully',
    }
  }

  async removeUser(input: RemoveUserFromTenantInput) {
    // Verificar se tenant existe
    const tenant = await db('tenants').where({ id: input.tenantId }).whereNull('deleted_at').first()

    if (!tenant) {
      return null
    }

    // Verificar se usuário existe
    const user = await db('users').where({ id: input.userId }).first()

    if (!user) {
      return null
    }

    // Verificar se vínculo existe e está ativo
    const link = await db('tenant_users')
      .where({
        tenant_id: input.tenantId,
        user_id: input.userId,
        is_active: true,
      })
      .first()

    if (!link) {
      return null
    }

    // Desativar vínculo
    await db('tenant_users').where({ id: link.id }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    // Desativar todos os perfis do usuário neste tenant
    await db('user_profiles')
      .where({
        tenant_id: input.tenantId,
        user_id: input.userId,
      })
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      })

    return {
      message: 'User removed from tenant successfully',
    }
  }
}
