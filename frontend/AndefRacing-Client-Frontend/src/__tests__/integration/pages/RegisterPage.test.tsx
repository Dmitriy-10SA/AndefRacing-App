import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { render } from '../test-utils'
import { server } from '../mocks/server'
import RegisterPage from '@/pages/auth/RegisterPage'
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

describe('RegisterPage Integration', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    useAuthStore.getState().logout()
  })

  it('отображает форму регистрации', () => {
    render(<RegisterPage />)

    expect(screen.getByText('AndefRacing')).toBeInTheDocument()
    expect(screen.getByText('Регистрация')).toBeInTheDocument()
    expect(screen.getByText('Имя')).toBeInTheDocument()
    expect(screen.getByText('Номер телефона')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Зарегистрироваться/i })).toBeInTheDocument()
  })

  it('показывает ошибки валидации при пустых полях', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

    await waitFor(() => {
      expect(screen.getByText('Имя обязательно')).toBeInTheDocument()
      expect(screen.getByText('Номер телефона обязателен')).toBeInTheDocument()
      expect(screen.getByText('Пароль обязателен')).toBeInTheDocument()
      expect(screen.getByText('Подтверждение пароля обязательно')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при коротком пароле', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'short')

    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

    await waitFor(() => {
      expect(screen.getByText('Пароль должен содержать не менее 8 символов')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при несовпадении паролей', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'Password123!')
    await user.type(passwordInputs[1], 'DifferentPassword123!')

    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

    await waitFor(() => {
      expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при слабом пароле (без спецсимволов)', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'Password123')

    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

    await waitFor(() => {
      expect(screen.getByText(/Пароль должен содержать заглавную букву, цифру и спецсимвол/i)).toBeInTheDocument()
    })
  })

  it('форма содержит все необходимые поля', () => {
    render(<RegisterPage />)

    // Проверяем наличие всех полей формы
    expect(document.querySelector('input[name="name"]')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')).toBeInTheDocument()
    expect(document.querySelector('input[name="password"]')).toBeInTheDocument()
    expect(document.querySelector('input[name="confirmPassword"]')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Зарегистрироваться/i })).toBeInTheDocument()
  })

  it('показывает подсказку о требованиях к паролю', () => {
    render(<RegisterPage />)

    expect(screen.getByText(/Минимум 8 символов/i)).toBeInTheDocument()
  })

  it('кнопка регистрации включена по умолчанию', () => {
    render(<RegisterPage />)

    const submitButton = screen.getByRole('button', { name: /Зарегистрироваться/i })
    expect(submitButton).not.toBeDisabled()
  })

  it('содержит ссылку на страницу входа', () => {
    render(<RegisterPage />)

    const loginLink = screen.getByText(/Уже есть аккаунт\? Войти/i)
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })

  it('проверяет максимальную длину имени', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const nameInput = document.querySelector('input[type="text"]')!
    const longName = 'a'.repeat(101)
    await user.type(nameInput, longName)

    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

    await waitFor(() => {
      expect(screen.getByText('Имя не должно превышать 100 символов')).toBeInTheDocument()
    })
  })

  it('обрабатывает сетевую ошибку', async () => {
    const user = userEvent.setup()

    server.use(
      http.post('/api/auth/client/register', () => {
        return HttpResponse.error()
      })
    )

    render(<RegisterPage />)

    const nameInput = document.querySelector('input[type="text"]')!
    await user.type(nameInput, 'Тест')

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991112233')

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'Password123!')
    await user.type(passwordInputs[1], 'Password123!')

    await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

    await waitFor(() => {
      expect(screen.getByText('Ошибка регистрации')).toBeInTheDocument()
    })
  })

  describe('Специфические сообщения об ошибках', () => {
    it('при регистрации с уже существующим номером телефона отображается сообщение "Пользователь с таким номером телефона уже существует"', async () => {
      const user = userEvent.setup()

      server.use(
        http.post('/api/auth/client/register', () => {
          return HttpResponse.json(
            { message: 'Пользователь с таким номером телефона уже существует' },
            { status: 400 }
          )
        })
      )

      render(<RegisterPage />)

      const nameInput = document.querySelector('input[type="text"]')!
      await user.type(nameInput, 'Тест Тестов')

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9991234567')

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'Password123!')
      await user.type(passwordInputs[1], 'Password123!')

      await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

      await waitFor(() => {
        expect(screen.getByText(/Пользователь с таким номером телефона уже существует/i)).toBeInTheDocument()
      })
    })

    it('при регистрации с занятым номером телефона не происходит авторизация', async () => {
      const user = userEvent.setup()

      server.use(
        http.post('/api/auth/client/register', () => {
          return HttpResponse.json(
            { message: 'Пользователь с таким номером телефона уже существует' },
            { status: 400 }
          )
        })
      )

      render(<RegisterPage />)

      const nameInput = document.querySelector('input[type="text"]')!
      await user.type(nameInput, 'Тест Тестов')

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9991234567')

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'Password123!')
      await user.type(passwordInputs[1], 'Password123!')

      await user.click(screen.getByRole('button', { name: /Зарегистрироваться/i }))

      await waitFor(() => {
        expect(screen.getByText(/Пользователь с таким номером телефона уже существует/i)).toBeInTheDocument()
      })

      // Пользователь не должен быть авторизован
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })
})
