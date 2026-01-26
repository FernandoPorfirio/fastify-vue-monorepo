import { defineStore } from 'pinia'
import {
  login as apiLogin,
  refresh as apiRefresh,
  logout as apiLogout,
  type User,
} from '@/services/auth'

const PREFIX = import.meta.env.VITE_STORAGE_KEY_PREFIX
const TOKEN_KEY = `${PREFIX}:token`
const REFRESH_KEY = `${PREFIX}:refresh`
const USER_KEY = `${PREFIX}:user`

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: User | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({ token: null, refreshToken: null, user: null }),
  getters: {
    isAuthenticated: state => Boolean(state.token && state.user),
  },
  actions: {
    loadFromStorage() {
      this.token = localStorage.getItem(TOKEN_KEY)
      this.refreshToken = localStorage.getItem(REFRESH_KEY)
      const rawUser = localStorage.getItem(USER_KEY)
      this.user = rawUser ? (JSON.parse(rawUser) as User) : null
    },

    persist() {
      if (this.token) localStorage.setItem(TOKEN_KEY, this.token)
      else localStorage.removeItem(TOKEN_KEY)

      if (this.refreshToken) localStorage.setItem(REFRESH_KEY, this.refreshToken)
      else localStorage.removeItem(REFRESH_KEY)

      if (this.user) localStorage.setItem(USER_KEY, JSON.stringify(this.user))
      else localStorage.removeItem(USER_KEY)
    },

    async login(email: string, password: string): Promise<boolean> {
      const res = await apiLogin(email, password)
      this.token = res.token
      this.refreshToken = res.refreshToken
      this.user = res.user
      this.persist()
      return true
    },

    async refresh(): Promise<boolean> {
      if (!this.refreshToken) return false
      const res = await apiRefresh(this.refreshToken)
      this.token = res.token
      this.refreshToken = res.refreshToken
      this.persist()
      return true
    },

    async logout(): Promise<void> {
      try {
        await apiLogout(this.refreshToken ?? undefined)
      } finally {
        this.token = null
        this.refreshToken = null
        this.user = null
        this.persist()
      }
    },
  },
})
