import axios, { type AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL

function createApi(): AxiosInstance {
  const instance = axios.create({ baseURL })

  instance.interceptors.request.use(config => {
    const auth = useAuthStore()
    if (auth.token) {
      config.headers = config.headers ?? {}
      config.headers.Authorization = `Bearer ${auth.token}`
    }
    return config
  })

  instance.interceptors.response.use(
    res => res,
    async (error: AxiosError) => {
      const auth = useAuthStore()
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
      const url = originalRequest?.url ?? ''
      const headers = (originalRequest.headers ?? {}) as Record<string, string>
      const skipRetry = headers['X-Skip-Auth-Retry'] === 'true'
      const isAuthRoute = url.startsWith('/auth/')

      if (error.response?.status === 401 && !originalRequest._retry && !skipRetry && !isAuthRoute) {
        originalRequest._retry = true
        try {
          const refreshed = await auth.refresh()
          if (refreshed) {
            originalRequest.headers = originalRequest.headers ?? {}
            originalRequest.headers.Authorization = `Bearer ${auth.token}`
            return instance(originalRequest)
          }
        } catch {
          // noop
        }
        auth.logout()
      }

      return Promise.reject(error)
    }
  )

  return instance
}

export const api = createApi()
