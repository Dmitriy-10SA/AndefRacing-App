import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import { axiosInstance } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'

// Мокаем window.location
const mockLocation = {
  href: '',
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
})

describe('Axios Instance (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocation.href = ''
    useAuthStore.getState().logout()
    // Очищаем DOM от возможных уведомлений
    document.body.innerHTML = ''
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

    const config = await axiosInstance.interceptors.request.handlers[0].fulfilled({
      headers: {},
    } as any)

    expect(config.headers.Authorization).toBe('Bearer test-token')
  })

  it('не добавляет Authorization header если токена нет', async () => {
    const config = await axiosInstance.interceptors.request.handlers[0].fulfilled({
      headers: {},
    } as any)

    expect(config.headers.Authorization).toBeUndefined()
  })

  it('обрабатывает успешный response', async () => {
    const response = { data: { message: 'success' }, status: 200 }

    const result = await axiosInstance.interceptors.response.handlers[0].fulfilled(response as any)

    expect(result).toEqual(response)
  })

  it('выполняет logout и редирект при 401 ошибке (не auth endpoint)', async () => {
    useAuthStore.getState().setToken('test-token')

    const error = {
      response: { status: 401 },
      config: { url: '/some-protected-endpoint' },
    }

    try {
      await axiosInstance.interceptors.response.handlers[0].rejected(error)
    } catch (e) {
      // Ожидаем, что ошибка будет проброшена
    }

    expect(useAuthStore.getState().token).toBeNull()
    expect(window.location.href).toBe('/auth/login')
  })

  it('не выполняет logout при 401 на auth endpoint', async () => {
    useAuthStore.getState().setToken('test-token')

    const error = {
      response: { status: 401 },
      config: { url: '/auth/employee/login' },
    }

    try {
      await axiosInstance.interceptors.response.handlers[0].rejected(error)
    } catch (e) {
      // Ожидаем, что ошибка будет проброшена
    }

    // Токен не должен быть очищен
    expect(useAuthStore.getState().token).toBe('test-token')
  })

  it('показывает уведомление и редиректит при блокировке', async () => {
    vi.useFakeTimers()
    useAuthStore.getState().setToken('test-token')

    const error = {
      response: {
        status: 403,
        data: { message: 'Вы заблокированы' }
      },
      config: { url: '/some-endpoint' },
    }

    try {
      await axiosInstance.interceptors.response.handlers[0].rejected(error)
    } catch (e) {
      // Ожидаем, что ошибка будет проброшена
    }

    // Проверяем, что токен очищен
    expect(useAuthStore.getState().token).toBeNull()

    // Проверяем, что уведомление добавлено в DOM
    const notification = document.querySelector('.fixed.top-4.right-4')
    expect(notification).toBeInTheDocument()
    expect(notification?.textContent).toBe('Вы заблокированы')

    // Проверяем редирект после таймаута
    vi.advanceTimersByTime(2000)
    expect(window.location.href).toBe('/auth/login')

    vi.useRealTimers()
  })

  it('пробрасывает другие ошибки без изменений', async () => {
    const error = {
      response: { status: 500 },
      config: { url: '/some-endpoint' },
    }

    await expect(
      axiosInstance.interceptors.response.handlers[0].rejected(error)
    ).rejects.toEqual(error)
  })

  it('обрабатывает ошибку в request interceptor', async () => {
    const error = new Error('Request error')

    await expect(
      axiosInstance.interceptors.request.handlers[0].rejected(error)
    ).rejects.toEqual(error)
  })
})
