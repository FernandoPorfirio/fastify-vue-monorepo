import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { db } from './db'

const SALT_ROUNDS = 10
const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN: string | number = process.env.JWT_EXPIRES_IN || '15m'
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// JWT
export interface JWTPayload {
  userId: number
  email: string
  tenantId?: number
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions)
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload
}

// Refresh Token
export interface RefreshTokenData {
  userId: number
  ipAddress?: string
  userAgent?: string
}

function getRefreshTokenExpiresAt(): Date {
  const expires = REFRESH_TOKEN_EXPIRES_IN
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

export async function createRefreshToken(
  data: RefreshTokenData
): Promise<string> {
  // Generate random token
  const token = crypto.randomBytes(64).toString('hex')
  
  // Save to database
  await db('refresh_tokens').insert({
    user_id: data.userId,
    token,
    expires_at: getRefreshTokenExpiresAt(),
    ip_address: data.ipAddress,
    user_agent: data.userAgent,
    created_at: db.fn.now(),
  })
  
  return token
}

export async function verifyRefreshToken(token: string): Promise<number | null> {
  const refreshToken = await db('refresh_tokens')
    .where({ token })
    .whereNull('revoked_at')
    .where('expires_at', '>', db.fn.now())
    .first()
  
  if (!refreshToken) {
    return null
  }
  
  return refreshToken.user_id
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await db('refresh_tokens')
    .where({ token })
    .update({ revoked_at: db.fn.now() })
}

export async function revokeAllUserRefreshTokens(userId: number): Promise<void> {
  await db('refresh_tokens')
    .where({ user_id: userId })
    .whereNull('revoked_at')
    .update({ revoked_at: db.fn.now() })
}
