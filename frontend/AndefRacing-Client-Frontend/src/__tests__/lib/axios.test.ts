import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { axiosInstance } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'

// Мокаем window.location и alert
const mockLocation = {
  href: '',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

const mockAlert = vi.fn()
global.alert = mockAlert

// Типы для interceptors
type InterceptorHandler = {
  fulfilled?: (value: any) => any
  rejected?: (error: any) => any
}

describe('Axios Instance (Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    useAuthStore.getState().logout()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('создает axios instance с базовым URL', () => {
    expect(axiosInstance.defaults.baseURL).toBe('/api')
  })

  it('устанавливает Content-Type header по умолчанию', () => {
    expect(axiosInstance.defaults.headers['Content-Type']).toBe('application/json')
  })

  it('добавляет Authorization header если токен есть', async () => {
    useAuthStore.getState().setToken('test-token')

    const handlers = (axiosInstance.interceptors.request as any).handlers as InterceptorHandler[]
    const handler = handlers?.[0]

    if (handler?.fulfilled) {
      const config = await handler.fulfilled({ headers: {} })
      expect(config.headers.Authorization).toBe('Bearer test-token')
    }
  })

  it('не добавляет Authorization header если токена нет', async () => {
    const handlers = (axiosInstance.interceptors.request as any).handlers as InterceptorHandler[]
    const handler = handlers?.[0]

    if (handler?.fulfilled) {
      const config = await handler.fulfilled({ headers: {} })
      expect(config.headers.Authorization).toBeUndefined()
    }
  })

  it('обрабатывает успешный response', async () => {
    const response = { data: { message: 'success' }, status: 200 }

    const handlers = (axiosInstance.interceptors.response as any).handlers as InterceptorHandler[]
    const handler = handlers?.[0]

    if (handler?.fulfilled) {
      const result = await handler.fulfilled(response)
      expect(result).toEqual(response)
    }
  })

  it('выполняет logout и редирект при 401 ошибке (не auth endpoint)', async () => {
    useAuthStore.getState().setToken('test-token')

    const error = {
      response: { status: 401 },
      config: { url: '/some-protected-endpoint' },
    }

    const handlers = (axiosInstance.interceptors.response as any).handlers as InterceptorHandler[]
    const handler = handlers?.[0]

    if (handler?.rejected) {
      try {
        await handler.rejected(error)
      } catch (e) {
        // Ожидаем ошибку
      }
    }

    expect(useAuthStore.getState().token).toBeNull()
    expect(window.location.href).toBe('/auth/login')
  })

  it('не выполняет logout при 401 на auth endpoint', async () => {
    useAuthStore.getState().setToken('test-token')

    const error = {
      response: { status: 401 },
      config: { url: '/auth/client/login' },
    }

    const handlers = (axiosInstance.interceptors.response as any).handlers as InterceptorHandler[]
    const handler = handlers?.[0]

    if (handler?.rejected) {
      try {
        await handler.rejected(error)
      } catch (e) {
        // Ожидаем ошибку
      }
    }

    // Токен не должен быть очищен
    expect(useAuthStore.getState().token).toBe('test-token')
  })

  it('показывает alert и редиректит при блокировке', async () => {
    useAuthStore.getState().setToken('test-token')

    const error = {
      response: {
        status: 403,
        data: { message: 'Вы заблокированы' }
      },
      config: { url: '/some-endpoint' },
    }

    const handlers = (axiosInstance.interceptors.response as any).handlers as InterceptorHandler[]
    const handler = handlers?.[0]

    if (handler?.rejected) {
      try {
        await handler.rejected(error)
      } catch (e) {
        // Ожидаем ошибку
      }
    }

    expect(useAuthStore.getState().token).toBeNull()
    expect(mockAlert).toHaveBeenCalledWith('Вы заблокированы')
    expect(window.location.href).toBe('/auth/login')
  })

  it('пробрасывает другие ошибки', async () => {
    const error = {
      response: { status: 500 },
      config: { url: '/some-endpoint' },
    }

    const handlers = (axiosInstance.interceptors.response as any).handlers as InterceptorHandler[]
    const handler = handlers?.[0]

    if (handler?.rejected) {
      await expect(handler.rejected(error)).rejects.toEqual(error)
    }
  })
})
