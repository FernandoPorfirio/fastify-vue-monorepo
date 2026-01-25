import crypto from 'node:crypto'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

const PASSWORD_RESET_TOKEN_EXPIRES_IN = process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN || '1h'

export interface RequestPasswordResetInput {
  email: string
}

export interface RequestPasswordResetResult {
  message: string
  token?: string // Only for development/testing
}

export interface VerifyResetTokenInput {
  token: string
}

export interface VerifyResetTokenResult {
  valid: boolean
  email?: string
}

export interface ResetPasswordInput {
  token: string
  newPassword: string
}

export interface ResetPasswordResult {
  message: string
}

function getPasswordResetTokenExpiresAt(): Date {
  const expires = PASSWORD_RESET_TOKEN_EXPIRES_IN
  const match = /(\d+)([dhm])/.exec(expires)

  if (!match) {
    // Default to 1 hour
    return new Date(Date.now() + 60 * 60 * 1000)
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

export class UserService {
  async requestPasswordReset(
    input: RequestPasswordResetInput
  ): Promise<RequestPasswordResetResult> {
    // Buscar usuário pelo email
    const user = await db('users').where({ email: input.email, is_active: true }).first()

    // Por segurança, sempre retornar sucesso mesmo se o usuário não existir
    if (!user) {
      return {
        message: 'If the email exists, a password reset link has been sent',
      }
    }

    // Invalidar tokens anteriores do usuário
    await db('password_resets')
      .where({ user_id: user.id })
      .whereNull('used_at')
      .update({ used_at: db.fn.now() })

    // Gerar novo token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = getPasswordResetTokenExpiresAt()

    // Salvar no banco
    await db('password_resets').insert({
      user_id: user.id,
      email: user.email,
      token,
      expires_at: expiresAt,
      created_at: db.fn.now(),
    })

    // TODO: Enviar email com o link de reset
    // Para desenvolvimento, retornar o token na resposta
    const isDevelopment = process.env.NODE_ENV === 'development'

    return {
      message: 'If the email exists, a password reset link has been sent',
      ...(isDevelopment && { token }),
    }
  }

  async verifyResetToken(input: VerifyResetTokenInput): Promise<VerifyResetTokenResult> {
    const resetToken = await db('password_resets')
      .where({ token: input.token })
      .whereNull('used_at')
      .where('expires_at', '>', db.fn.now())
      .first()

    if (!resetToken) {
      return { valid: false }
    }

    return {
      valid: true,
      email: resetToken.email,
    }
  }

  async resetPassword(input: ResetPasswordInput): Promise<ResetPasswordResult | null> {
    // Verificar se o token é válido
    const resetToken = await db('password_resets')
      .where({ token: input.token })
      .whereNull('used_at')
      .where('expires_at', '>', db.fn.now())
      .first()

    if (!resetToken) {
      return null
    }

    // Buscar usuário
    const user = await db('users').where({ id: resetToken.user_id, is_active: true }).first()

    if (!user) {
      return null
    }

    // Hash da nova senha
    const hashedPassword = await hashPassword(input.newPassword)

    // Atualizar senha do usuário
    await db('users').where({ id: user.id }).update({
      password: hashedPassword,
      updated_at: db.fn.now(),
    })

    // Marcar token como usado
    await db('password_resets').where({ id: resetToken.id }).update({ used_at: db.fn.now() })

    // Invalidar todos os refresh tokens do usuário por segurança
    await db('refresh_tokens')
      .where({ user_id: user.id })
      .whereNull('revoked_at')
      .update({ revoked_at: db.fn.now() })

    return {
      message: 'Password reset successfully',
    }
  }
}
