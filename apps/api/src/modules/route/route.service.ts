import { db } from '@/lib/db'

export interface CreateRouteInput {
  name: string
  path: string
  type: 'api' | 'frontend'
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
  description?: string
}

export interface UpdateRouteInput {
  routeId: number
  name?: string
  path?: string
  type?: 'api' | 'frontend'
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
  description?: string
  isActive?: boolean
}

export interface AddProfileToRouteInput {
  routeId: number
  profileId: number
}

export interface RemoveProfileFromRouteInput {
  routeId: number
  profileId: number
}

export class RouteService {
  async create(input: CreateRouteInput) {
    const existingName = await db('routes')
      .where({ name: input.name })
      .whereNull('deleted_at')
      .first()

    if (existingName) {
      return null
    }

    if (input.type === 'api' && input.method) {
      const existingRoute = await db('routes')
        .where({
          path: input.path,
          method: input.method,
        })
        .whereNull('deleted_at')
        .first()

      if (existingRoute) {
        return null
      }
    }

    const [route] = await db('routes')
      .insert({
        name: input.name,
        path: input.path,
        type: input.type,
        method: input.method || null,
        description: input.description || null,
        is_active: true,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      })
      .returning('id')

    return this.findById(route.id)
  }

  async findById(routeId: number) {
    const route = await db('routes')
      .select(
        'id',
        'external_reference',
        'name',
        'path',
        'type',
        'method',
        'description',
        'is_active',
        'created_at',
        'updated_at'
      )
      .where({ id: routeId })
      .whereNull('deleted_at')
      .first()

    if (!route) {
      return null
    }

    return {
      ...route,
      created_at: route.created_at?.toISOString(),
      updated_at: route.updated_at?.toISOString(),
    }
  }

  async findAll(filters?: {
    isActive?: boolean
    type?: 'api' | 'frontend'
    method?: string
    limit?: number
    offset?: number
  }) {
    let query = db('routes')
      .select(
        'id',
        'external_reference',
        'name',
        'path',
        'type',
        'method',
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

    if (filters?.type) {
      query = query.where('type', filters.type)
    }

    if (filters?.method) {
      query = query.where('method', filters.method)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    if (filters?.offset) {
      query = query.offset(filters.offset)
    }

    const routes = await query

    return routes.map(route => ({
      ...route,
      created_at: route.created_at?.toISOString(),
      updated_at: route.updated_at?.toISOString(),
    }))
  }

  async update(input: UpdateRouteInput) {
    const route = await db('routes').where({ id: input.routeId }).whereNull('deleted_at').first()

    if (!route) {
      return null
    }

    if (input.name && input.name !== route.name) {
      const existingName = await db('routes')
        .where({ name: input.name })
        .whereNull('deleted_at')
        .whereNot('id', input.routeId)
        .first()

      if (existingName) {
        return null
      }
    }

    if (input.path || input.method) {
      const checkPath = input.path || route.path
      const checkMethod = input.method || route.method
      const checkType = input.type || route.type

      if (checkType === 'api' && checkMethod) {
        const existingRoute = await db('routes')
          .where({
            path: checkPath,
            method: checkMethod,
          })
          .whereNull('deleted_at')
          .whereNot('id', input.routeId)
          .first()

        if (existingRoute) {
          return null
        }
      }
    }

    const updateData: Record<string, unknown> = {
      updated_at: db.fn.now(),
    }

    if (input.name) updateData.name = input.name
    if (input.path) updateData.path = input.path
    if (input.type) updateData.type = input.type
    if (input.method !== undefined) updateData.method = input.method
    if (input.description !== undefined) updateData.description = input.description
    if (input.isActive !== undefined) updateData.is_active = input.isActive

    await db('routes').where({ id: input.routeId }).update(updateData)

    return this.findById(input.routeId)
  }

  async softDelete(routeId: number) {
    const route = await db('routes').where({ id: routeId }).whereNull('deleted_at').first()

    if (!route) {
      return null
    }

    await db('routes').where({ id: routeId }).update({
      is_active: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    await db('profile_routes').where({ route_id: routeId }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    return {
      message: 'Route deleted successfully',
    }
  }

  async addProfile(input: AddProfileToRouteInput) {
    const route = await db('routes')
      .where({ id: input.routeId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!route) {
      return null
    }

    const profile = await db('profiles')
      .where({ id: input.profileId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    const existingLink = await db('profile_routes')
      .where({
        profile_id: input.profileId,
        route_id: input.routeId,
      })
      .first()

    if (existingLink) {
      if (!existingLink.is_active) {
        await db('profile_routes').where({ id: existingLink.id }).update({
          is_active: true,
          updated_at: db.fn.now(),
        })

        return {
          message: 'Profile route reactivated',
        }
      }

      return null
    }

    await db('profile_routes').insert({
      profile_id: input.profileId,
      route_id: input.routeId,
      is_active: true,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    return {
      message: 'Profile added to route successfully',
    }
  }

  async removeProfile(input: RemoveProfileFromRouteInput) {
    const route = await db('routes').where({ id: input.routeId }).whereNull('deleted_at').first()

    if (!route) {
      return null
    }

    const profile = await db('profiles')
      .where({ id: input.profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    const link = await db('profile_routes')
      .where({
        profile_id: input.profileId,
        route_id: input.routeId,
        is_active: true,
      })
      .first()

    if (!link) {
      return null
    }

    await db('profile_routes').where({ id: link.id }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    return {
      message: 'Profile removed from route successfully',
    }
  }
}
