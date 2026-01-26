import { api } from './api'

export interface User {
  id: number
  email: string
  name: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
  return data
}

export async function refresh(
  refreshToken: string
): Promise<Pick<LoginResponse, 'token' | 'refreshToken'>> {
  const { data } = await api.post<{ token: string; refreshToken: string }>('/auth/refresh', {
    refreshToken,
  })
  return data
}

export async function logout(refreshToken?: string): Promise<void> {
  await api.post('/auth/logout', { refreshToken }, { headers: { 'X-Skip-Auth-Retry': 'true' } })
}
