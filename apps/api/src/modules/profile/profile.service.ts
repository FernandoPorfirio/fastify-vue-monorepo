import { db } from '@/lib/db'

export interface CreateProfileInput {
  name: string
  description?: string
}

export interface UpdateProfileInput {
  profileId: number
  name?: string
  description?: string
  isActive?: boolean
}

export interface AddUserToProfileInput {
  profileId: number
  userId: number
  tenantId: number
}

export interface RemoveUserFromProfileInput {
  profileId: number
  userId: number
  tenantId: number
}

export class ProfileService {
  async create(input: CreateProfileInput) {
    // Verificar se nome já existe
    const existingName = await db('profiles')
      .where({ name: input.name })
      .whereNull('deleted_at')
      .first()

    if (existingName) {
      return null
    }

    const [profile] = await db('profiles')
      .insert({
        name: input.name,
        description: input.description || null,
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id')

    return this.findById(profile.id)
  }

  async findById(profileId: number) {
    const profile = await db('profiles')
      .select(
        'id',
        'external_reference',
        'name',
        'description',
        'is_active',
        'created_at',
        'updated_at'
      )
      .where({ id: profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    // Convert dates to ISO strings for JSON serialization
    return {
      ...profile,
      created_at: profile.created_at?.toISOString(),
      updated_at: profile.updated_at?.toISOString(),
    }
  }

  async findAll(filters?: {
    isActive?: boolean
    limit?: number
    offset?: number
  }) {
    let query = db('profiles')
      .select(
        'id',
        'external_reference',
        'name',
        'description',
        'is_active',
        'created_at',
        'updated_at'
      )
      .whereNull('deleted_at')
      .orderBy('name', 'asc')

    if (filters?.isActive !== undefined) {
      query = query.where('is_active', filters.isActive)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.offset(filters.offset)
    }

    const profiles = await query

    // Convert dates to ISO strings for JSON serialization
    return profiles.map(profile => ({
      ...profile,
      created_at: profile.created_at?.toISOString(),
      updated_at: profile.updated_at?.toISOString(),
    }))
  }

  async update(input: UpdateProfileInput) {
    // Verificar se profile existe
    const profile = await db('profiles')
      .where({ id: input.profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    // Verificar nome duplicado se estiver atualizando
    if (input.name && input.name !== profile.name) {
      const existingName = await db('profiles')
        .where({ name: input.name })
        .whereNull('deleted_at')
        .whereNot('id', input.profileId)
        .first()

      if (existingName) {
        return null
      }
    }

    const updateData: Record<string, any> = {
      updated_at: db.fn.now(),
    }

    if (input.name) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    await db('profiles')
      .where({ id: input.profileId })
      .update(updateData)

    return this.findById(input.profileId)
  }

  async softDelete(profileId: number) {
    // Verificar se profile existe
    const profile = await db('profiles')
      .where({ id: profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    // Fazer soft delete do profile
    await db('profiles')
      .where({ id: profileId })
      .update({
        is_active: false,
        deleted_at: db.fn.now(),
        updated_at: db.fn.now(),
      })

    // Desativar todos os vínculos com usuários
    await db('user_profiles')
      .where({ profile_id: profileId })
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      })

    // Desativar todos os vínculos de rotas
    await db('profile_routes')
      .where({ profile_id: profileId })
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      })

    return {
      message: 'Profile deleted successfully',
    }
  }

  async addUser(input: AddUserToProfileInput) {
    // Verificar se profile existe e está ativo
    const profile = await db('profiles')
      .where({ id: input.profileId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
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

    // Verificar se tenant existe e está ativo
    const tenant = await db('tenants')
      .where({ id: input.tenantId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!tenant) {
      return null
    }

    // Verificar se usuário pertence ao tenant
    const tenantUser = await db('tenant_users')
      .where({
        tenant_id: input.tenantId,
        user_id: input.userId,
        is_active: true,
      })
      .first()

    if (!tenantUser) {
      return null
    }

    // Verificar se já existe vínculo
    const existingLink = await db('user_profiles')
      .where({
        user_id: input.userId,
        profile_id: input.profileId,
        tenant_id: input.tenantId,
      })
      .first()

    if (existingLink) {
      // Se existe mas está inativo, reativar
      if (!existingLink.is_active) {
        await db('user_profiles')
          .where({ id: existingLink.id })
          .update({
            is_active: true,
            updated_at: db.fn.now(),
          })

        return {
          message: 'User profile reactivated',
        }
      }

      // Já está ativo
      return null
    }

    // Criar vínculo
    await db('user_profiles').insert({
      user_id: input.userId,
      profile_id: input.profileId,
      tenant_id: input.tenantId,
      is_active: true,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    return {
      message: 'User added to profile successfully',
    }
  }

  async removeUser(input: RemoveUserFromProfileInput) {
    // Verificar se profile existe
    const profile = await db('profiles')
      .where({ id: input.profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    // Verificar se usuário existe
    const user = await db('users')
      .where({ id: input.userId })
      .first()

    if (!user) {
      return null
    }

    // Verificar se tenant existe
    const tenant = await db('tenants')
      .where({ id: input.tenantId })
      .whereNull('deleted_at')
      .first()

    if (!tenant) {
      return null
    }

    // Verificar se vínculo existe e está ativo
    const link = await db('user_profiles')
      .where({
        user_id: input.userId,
        profile_id: input.profileId,
        tenant_id: input.tenantId,
        is_active: true,
      })
      .first()

    if (!link) {
      return null
    }

    // Desativar vínculo
    await db('user_profiles')
      .where({ id: link.id })
      .update({
        is_active: false,
        updated_at: db.fn.now(),
      })

    return {
      message: 'User removed from profile successfully',
    }
  }
}
