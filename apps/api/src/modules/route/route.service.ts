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
    // Verificar se nome já existe
    const existingName = await db('routes')
      .where({ name: input.name })
      .whereNull('deleted_at')
      .first()

    if (existingName) {
      return null
    }

    // Verificar se path + method já existe (para rotas API)
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

    // Convert dates to ISO strings for JSON serialization
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

    // Convert dates to ISO strings for JSON serialization
    return routes.map(route => ({
      ...route,
      created_at: route.created_at?.toISOString(),
      updated_at: route.updated_at?.toISOString(),
    }))
  }

  async update(input: UpdateRouteInput) {
    // Verificar se route existe
    const route = await db('routes').where({ id: input.routeId }).whereNull('deleted_at').first()

    if (!route) {
      return null
    }

    // Verificar nome duplicado se estiver atualizando
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

    // Verificar path + method duplicado se estiver atualizando
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

    const updateData: Record<string, any> = {
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
    // Verificar se route existe
    const route = await db('routes').where({ id: routeId }).whereNull('deleted_at').first()

    if (!route) {
      return null
    }

    // Fazer soft delete da route
    await db('routes').where({ id: routeId }).update({
      is_active: false,
      deleted_at: db.fn.now(),
      updated_at: db.fn.now(),
    })

    // Desativar todos os vínculos com profiles
    await db('profile_routes').where({ route_id: routeId }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    return {
      message: 'Route deleted successfully',
    }
  }

  async addProfile(input: AddProfileToRouteInput) {
    // Verificar se route existe e está ativa
    const route = await db('routes')
      .where({ id: input.routeId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!route) {
      return null
    }

    // Verificar se profile existe e está ativo
    const profile = await db('profiles')
      .where({ id: input.profileId, is_active: true })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    // Verificar se já existe vínculo
    const existingLink = await db('profile_routes')
      .where({
        profile_id: input.profileId,
        route_id: input.routeId,
      })
      .first()

    if (existingLink) {
      // Se existe mas está inativo, reativar
      if (!existingLink.is_active) {
        await db('profile_routes').where({ id: existingLink.id }).update({
          is_active: true,
          updated_at: db.fn.now(),
        })

        return {
          message: 'Profile route reactivated',
        }
      }

      // Já está ativo
      return null
    }

    // Criar vínculo
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
    // Verificar se route existe
    const route = await db('routes').where({ id: input.routeId }).whereNull('deleted_at').first()

    if (!route) {
      return null
    }

    // Verificar se profile existe
    const profile = await db('profiles')
      .where({ id: input.profileId })
      .whereNull('deleted_at')
      .first()

    if (!profile) {
      return null
    }

    // Verificar se vínculo existe e está ativo
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

    // Desativar vínculo
    await db('profile_routes').where({ id: link.id }).update({
      is_active: false,
      updated_at: db.fn.now(),
    })

    return {
      message: 'Profile removed from route successfully',
    }
  }
}
