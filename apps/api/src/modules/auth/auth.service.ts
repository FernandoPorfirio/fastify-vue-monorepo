import { db } from '@/lib/db'
import {
  verifyPassword,
  signToken,
  createRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
} from '@/lib/auth'

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResult {
  token: string
  refreshToken: string
  user: {
    id: number
    email: string
    name: string
  }
}

export interface RefreshInput {
  refreshToken: string
}

export interface RefreshResult {
  token: string
  refreshToken: string
}

export interface LogoutInput {
  userId: number
  refreshToken?: string
}

export class AuthService {
  async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<LoginResult | null> {
    // Buscar usuário
    const user = await db('users')
      .where({ email: input.email, is_active: true })
      .first()

    if (!user) {
      return null
    }

    // Verificar senha
    const isValid = await verifyPassword(input.password, user.password)

    if (!isValid) {
      return null
    }

    // Buscar tenant do usuário
    const tenantUser = await db('tenant_users')
      .where({ user_id: user.id, is_active: true })
      .first()

    // Gerar tokens
    const token = signToken({
      userId: user.id,
      email: user.email,
      tenantId: tenantUser?.tenant_id,
    })

    const refreshToken = await createRefreshToken({
      userId: user.id,
      ipAddress,
      userAgent,
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

  async refresh(
    input: RefreshInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<RefreshResult | null> {
    // Verificar refresh token
    const userId = await verifyRefreshToken(input.refreshToken)

    if (!userId) {
      return null
    }

    // Buscar usuário
    const user = await db('users')
      .where({ id: userId, is_active: true })
      .first()

    if (!user) {
      return null
    }

    // Buscar tenant do usuário
    const tenantUser = await db('tenant_users')
      .where({ user_id: user.id, is_active: true })
      .first()

    // Revogar refresh token antigo
    await revokeRefreshToken(input.refreshToken)

    // Gerar novos tokens
    const newToken = signToken({
      userId: user.id,
      email: user.email,
      tenantId: tenantUser?.tenant_id,
    })

    const newRefreshToken = await createRefreshToken({
      userId: user.id,
      ipAddress,
      userAgent,
    })

    return {
      token: newToken,
      refreshToken: newRefreshToken,
    }
  }

  async logout(input: LogoutInput): Promise<void> {
    if (input.refreshToken) {
      // Revogar refresh token específico
      await revokeRefreshToken(input.refreshToken)
    } else {
      // Revogar todos os refresh tokens do usuário
      await revokeAllUserRefreshTokens(input.userId)
    }
  }
}
