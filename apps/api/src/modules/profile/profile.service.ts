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

    return {
      ...profile,
      created_at: profile.created_at?.toISOString(),
      updated_at: profile.updated_at?.toISOString(),
    }
  }

  async findAll(filters?: { isActive?: boolean; limit?: number; offset?: number }) {
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

    return profiles.map(profile => ({
      ...profile,
      created_at: profile.created_at?.toISOString(),
      updated_at: profile.updated_at?.toISOString(),
    }))
  }

  async update(input: UpdateProfileInput) {
    const profile = await db('profiles')
      .where({ id: input.profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

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

    const updateData: Record<string, unknown> = {
      updated_at: db.fn.now(),
    }

    if (input.name) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    await db('profiles').where({ id: input.profileId }).update(updateData)

    return this.findById(input.profileId)
  }

  async softDelete(profileId: number) {
    const profile = await db('profiles').where({ id: profileId }).whereNull('deleted_at').first()

    if (!profile) {
      return null
    }

    await db('profiles').where({ id: profileId }).update({
      is_active: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    await db('user_profiles').where({ profile_id: profileId }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    await db('profile_routes').where({ profile_id: profileId }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    return {
      message: 'Profile deleted successfully',
    }
  }

  async addUser(input: AddUserToProfileInput) {
    const profile = await db('profiles')
      .where({ id: input.profileId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    const user = await db('users')
      .where({ id: input.userId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!user) {
      return null
    }

    const tenant = await db('tenants')
      .where({ id: input.tenantId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!tenant) {
      return null
    }

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
      if (!existingLink.is_active) {
        await db('user_profiles').where({ id: existingLink.id }).update({
          is_active: true,
          updated_at: db.fn.now(),
        })

        return {
          message: 'User profile reactivated',
        }
      }

      return null
    }

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
    const profile = await db('profiles')
      .where({ id: input.profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    const user = await db('users').where({ id: input.userId }).first()

    if (!user) {
      return null
    }

    const tenant = await db('tenants').where({ id: input.tenantId }).whereNull('deleted_at').first()

    if (!tenant) {
      return null
    }

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

    await db('user_profiles').where({ id: link.id }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    return {
      message: 'User removed from profile successfully',
    }
  }
}
