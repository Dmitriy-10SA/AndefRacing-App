import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { render } from '../test-utils'
import { server } from '../mocks/server'
import LoginPage from '@/pages/auth/LoginPage'
import { useAuthStore } from '@/stores/authStore'

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('LoginPage Integration', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useAuthStore.getState().logout()
  })

  it('отображает форму входа', () => {
    render(<LoginPage />)

    expect(screen.getByText('AndefRacing')).toBeInTheDocument()
    expect(screen.getByText('Вход в систему')).toBeInTheDocument()
    expect(screen.getByText('Номер телефона')).toBeInTheDocument()
    expect(screen.getByText('Пароль')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Войти/i })).toBeInTheDocument()
  })

  it('показывает ошибку при пустых полях', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    await waitFor(() => {
      expect(screen.getByText('Номер телефона обязателен')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при неверном формате телефона', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '123')

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    await waitFor(() => {
      expect(screen.getByText('Формат: +7-XXX-XXX-XX-XX')).toBeInTheDocument()
    })
  })

  it('успешный вход перенаправляет на страницу поиска', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    // Вводим правильные данные
    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/search')
    })

    // Проверяем, что токен сохранен в store
    expect(useAuthStore.getState().token).toBe('mock-jwt-token')
  })

  it('показывает ошибку при неверных учетных данных', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'wrongPassword')

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    await waitFor(() => {
      expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument()
    })
  })

  it('показывает состояние загрузки при отправке формы', async () => {
    const user = userEvent.setup()

    // Добавляем задержку в API ответ
    server.use(
      http.post('/api/auth/client/login', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        return HttpResponse.json({ jwt: 'token' })
      })
    )

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    // Проверяем состояние загрузки
    expect(screen.getByRole('button', { name: /Вход.../i })).toBeDisabled()
  })

  it('содержит ссылку на регистрацию', () => {
    render(<LoginPage />)

    const registerLink = screen.getByText(/Нет аккаунта\? Зарегистрироваться/i)
    expect(registerLink).toHaveAttribute('href', '/auth/register')
  })

  it('содержит ссылку на восстановление пароля', () => {
    render(<LoginPage />)

    const forgotPasswordLink = screen.getByText(/Забыли пароль\?/i)
    expect(forgotPasswordLink).toHaveAttribute('href', '/auth/change-password')
  })

  it('обрабатывает сетевую ошибку', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/api/auth/client/login', () => {
        return HttpResponse.error()
      })
    )

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'anyPassword')

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    await waitFor(() => {
      expect(screen.getByText('Ошибка входа')).toBeInTheDocument()
    })
  })

  it('очищает ошибку при повторной отправке формы', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    // Первая попытка с неверным паролем
    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'wrongPassword')

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    await waitFor(() => {
      expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument()
    })

    // Очищаем пароль и вводим правильный
    await user.clear(passwordInput)
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /Войти/i }))

    // Ошибка должна исчезнуть
    await waitFor(() => {
      expect(screen.queryByText('Неверный логин или пароль')).not.toBeInTheDocument()
    })
  })
})
