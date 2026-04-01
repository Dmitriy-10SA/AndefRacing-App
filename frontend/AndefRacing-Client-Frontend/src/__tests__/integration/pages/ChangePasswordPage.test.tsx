import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import ChangePasswordPage from '@/pages/auth/ChangePasswordPage'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/authApi'

// Мокаем API
vi.mock('@/api/authApi')

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

describe('ChangePasswordPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    useAuthStore.getState().logout()

    // Дефолтный мок для успешного ответа
    vi.mocked(authApi.changePassword).mockResolvedValue({ jwt: 'new-mock-jwt-token' })
  })

  it('отображает форму изменения пароля', () => {
    render(<ChangePasswordPage />)

    expect(screen.getByText('AndefRacing')).toBeInTheDocument()
    expect(screen.getByText('Изменение пароля')).toBeInTheDocument()
    expect(screen.getByText('Номер телефона')).toBeInTheDocument()
    expect(screen.getByText('Новый пароль')).toBeInTheDocument()
    expect(screen.getByText('Подтвердите новый пароль')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Изменить пароль/i })).toBeInTheDocument()
  })

  it('показывает ошибки валидации при пустых полях', async () => {
    const user = userEvent.setup()

    render(<ChangePasswordPage />)

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText('Номер телефона обязателен')).toBeInTheDocument()
      expect(screen.getByText('Пароль обязателен')).toBeInTheDocument()
      expect(screen.getByText('Подтверждение пароля обязательно')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при неверном формате телефона', async () => {
    const user = userEvent.setup()

    render(<ChangePasswordPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '123')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText('Формат: +7-XXX-XXX-XX-XX')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при коротком пароле', async () => {
    const user = userEvent.setup()

    render(<ChangePasswordPage />)

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'short')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText('Пароль должен содержать не менее 8 символов')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при несовпадении паролей', async () => {
    const user = userEvent.setup()

    render(<ChangePasswordPage />)

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'Password123!')
    await user.type(passwordInputs[1], 'DifferentPassword123!')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument()
    })
  })

  it('показывает ошибку при слабом пароле (без спецсимволов)', async () => {
    const user = userEvent.setup()

    render(<ChangePasswordPage />)

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'Password123')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText(/Пароль должен содержать заглавную букву, цифру и спецсимвол/i)).toBeInTheDocument()
    })
  })

  it('успешная смена пароля показывает сообщение', async () => {
    const user = userEvent.setup()

    render(<ChangePasswordPage />)

    // Заполняем форму
    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'NewPassword123!')
    await user.type(passwordInputs[1], 'NewPassword123!')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText('Пароль успешно изменен')).toBeInTheDocument()
    })

    expect(useAuthStore.getState().token).toBe('new-mock-jwt-token')
  })

  it('показывает ошибку при неверном номере телефона', async () => {
    const user = userEvent.setup()

    vi.mocked(authApi.changePassword).mockRejectedValue({
      response: { data: { message: 'Пользователь не найден' } }
    })

    render(<ChangePasswordPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9990000000')

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'NewPassword123!')
    await user.type(passwordInputs[1], 'NewPassword123!')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText('Пользователь не найден')).toBeInTheDocument()
    })
  })

  it('показывает состояние загрузки', async () => {
    const user = userEvent.setup()

    vi.mocked(authApi.changePassword).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ jwt: 'token' }), 100))
    )

    render(<ChangePasswordPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'NewPassword123!')
    await user.type(passwordInputs[1], 'NewPassword123!')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    expect(screen.getByRole('button', { name: /Изменение.../i })).toBeDisabled()
  })

  it('содержит ссылку на страницу входа', () => {
    render(<ChangePasswordPage />)

    const loginLink = screen.getByText(/Вернуться к входу/i)
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })

  it('обрабатывает сетевую ошибку', async () => {
    const user = userEvent.setup()

    vi.mocked(authApi.changePassword).mockRejectedValue(new Error('Network error'))

    render(<ChangePasswordPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'NewPassword123!')
    await user.type(passwordInputs[1], 'NewPassword123!')

    await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

    await waitFor(() => {
      expect(screen.getByText('Ошибка изменения пароля')).toBeInTheDocument()
    })
  })

  describe('Специфические сообщения об ошибках', () => {
    it('при вводе несуществующего номера телефона отображается сообщение с подстановкой введенного номера', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.changePassword).mockRejectedValue({
        response: { data: { message: 'Клиент с номером телефона +7-999-888-77-66 не найден' } }
      })

      render(<ChangePasswordPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9998887766')

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'NewPassword123!')
      await user.type(passwordInputs[1], 'NewPassword123!')

      await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

      await waitFor(() => {
        expect(screen.getByText(/Клиент с номером телефона \+7-999-888-77-66 не найден/i)).toBeInTheDocument()
      })
    })

    it('при вводе несуществующего номера отображается общее сообщение "не найден"', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.changePassword).mockRejectedValue({
        response: { data: { message: 'Клиент с номером телефона +7-999-000-00-00 не найден' } }
      })

      render(<ChangePasswordPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'NewPassword123!')
      await user.type(passwordInputs[1], 'NewPassword123!')

      await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

      await waitFor(() => {
        expect(screen.getByText(/не найден/i)).toBeInTheDocument()
      })
    })

    it('при ошибке "клиент не найден" токен не устанавливается', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.changePassword).mockRejectedValue({
        response: { data: { message: 'Клиент с номером телефона +7-999-111-22-33 не найден' } }
      })

      render(<ChangePasswordPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9991112233')

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'NewPassword123!')
      await user.type(passwordInputs[1], 'NewPassword123!')

      await user.click(screen.getByRole('button', { name: /Изменить пароль/i }))

      await waitFor(() => {
        expect(screen.getByText(/не найден/i)).toBeInTheDocument()
      })

      // Токен не должен быть установлен
      expect(useAuthStore.getState().token).toBeNull()
    })
  })
})
