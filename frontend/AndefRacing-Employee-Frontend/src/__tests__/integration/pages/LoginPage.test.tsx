import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import LoginPage from '@/pages/auth/LoginPage'
import { useAuthStore } from '@/stores/authStore'
import { mockClubs } from '../mocks/handlers'
import { authApi } from '@/api/authApi'

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Мокаем API модуль
vi.mock('@/api/authApi')

describe('LoginPage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    useAuthStore.getState().logout()

    // Дефолтные моки для успешных сценариев
    vi.mocked(authApi.isFirstEnter).mockResolvedValue(false)
    vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)
    vi.mocked(authApi.login).mockResolvedValue({ jwt: 'mock-jwt-token' })
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  describe('Шаг 1: Ввод телефона', () => {
    it('отображает форму ввода телефона', () => {
      render(<LoginPage />)

      expect(screen.getByText('AndefRacing')).toBeInTheDocument()
      expect(screen.getByText('Вход для сотрудников')).toBeInTheDocument()
      expect(screen.getByText('Номер телефона')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Далее/i })).toBeInTheDocument()
    })

    it('показывает ошибку при пустом телефоне', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Номер телефона обязателен')).toBeInTheDocument()
      })
    })

    it('показывает ошибку при неверном формате телефона', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '123')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Формат: +7-XXX-XXX-XX-XX')).toBeInTheDocument()
      })
    })

    it('показывает ошибку при несуществующем сотруднике', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockRejectedValue({
        response: { data: { message: 'Сотрудник с номером телефона +7-999-888-77-66 не найден' } }
      })

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9998887766')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText(/Сотрудник с номером телефона .* не найден/i)).toBeInTheDocument()
      })
    })

    it('переходит на шаг ввода пароля при корректном телефоне', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9991234567')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Введите пароль')).toBeInTheDocument()
      })
    })
  })

  describe('Шаг 2: Ввод пароля', () => {
    const goToPasswordStep = async (user: ReturnType<typeof userEvent.setup>) => {
      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9991234567')
      await user.click(screen.getByRole('button', { name: /Далее/i }))
      await waitFor(() => {
        expect(screen.getByText('Введите пароль')).toBeInTheDocument()
      })
    }

    it('отображает форму ввода пароля', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToPasswordStep(user)

      // Проверяем наличие label "Пароль" (в обычном режиме входа)
      expect(screen.getByText('Пароль')).toBeInTheDocument()
      expect(document.querySelector('input[type="password"]')).toBeInTheDocument()
      expect(screen.getByText('Назад')).toBeInTheDocument()
    })

    it('позволяет вернуться на шаг ввода телефона', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToPasswordStep(user)

      await user.click(screen.getByText('Назад'))

      expect(screen.getByText('Вход для сотрудников')).toBeInTheDocument()
    })

    it('показывает ошибку при пустом пароле', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToPasswordStep(user)

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Пароль обязателен')).toBeInTheDocument()
      })
    })

    it('показывает ошибку при неверном пароле', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.preLogin).mockRejectedValue({
        response: { data: { message: 'Неверный логин или пароль' } }
      })

      render(<LoginPage />)
      await goToPasswordStep(user)

      const passwordInput = document.querySelector('input[type="password"]')!
      await user.type(passwordInput, 'wrongPassword')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument()
      })
    })

    it('переходит на шаг выбора клуба при корректном пароле', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToPasswordStep(user)

      const passwordInput = document.querySelector('input[type="password"]')!
      await user.type(passwordInput, 'correctPassword123!')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Выберите клуб')).toBeInTheDocument()
      })
    })
  })

  describe('Шаг 3: Выбор клуба', () => {
    const goToClubStep = async (user: ReturnType<typeof userEvent.setup>) => {
      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9991234567')
      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Введите пароль')).toBeInTheDocument()
      })

      const passwordInput = document.querySelector('input[type="password"]')!
      await user.type(passwordInput, 'correctPassword123!')
      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Выберите клуб')).toBeInTheDocument()
      })
    }

    it('отображает список клубов', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToClubStep(user)

      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
      expect(screen.getByText('VR Club SPb')).toBeInTheDocument()
    })

    it('показывает информацию о клубе', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToClubStep(user)

      expect(screen.getByText(/Москва/)).toBeInTheDocument()
      expect(screen.getByText(/ул. Тверская/)).toBeInTheDocument()
    })

    it('успешный вход перенаправляет на страницу бронирований', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToClubStep(user)

      await user.click(screen.getByText('VR Club Moscow'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/bookings')
      })

      expect(useAuthStore.getState().token).toBe('mock-jwt-token')
    })

    it('сохраняет выбранный клуб в store', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToClubStep(user)

      await user.click(screen.getByText('VR Club Moscow'))

      await waitFor(() => {
        expect(useAuthStore.getState().currentClub?.name).toBe('VR Club Moscow')
      })
    })

    it('позволяет вернуться на шаг ввода пароля', async () => {
      const user = userEvent.setup()

      render(<LoginPage />)
      await goToClubStep(user)

      await user.click(screen.getByText('Назад'))

      expect(screen.getByText('Введите пароль')).toBeInTheDocument()
    })
  })

  describe('Первый вход сотрудника', () => {
    it('требует задать новый пароль при первом входе', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)

      render(<LoginPage />)

      // Используем телефон, который возвращает isFirstEnter: true
      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getAllByText('Задайте пароль').length).toBeGreaterThanOrEqual(1)
      })

      // Должно быть поле подтверждения пароля
      expect(screen.getByText('Подтвердите пароль')).toBeInTheDocument()
    })

    it('показывает подсказку о требованиях к паролю при первом входе', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText(/Минимум 8 символов, включая заглавные и строчные буквы/i)).toBeInTheDocument()
      })
    })

    it('показывает ошибку при несовпадении паролей', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getAllByText('Задайте пароль').length).toBeGreaterThanOrEqual(1)
      })

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'Password123!')
      await user.type(passwordInputs[1], 'DifferentPassword!')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Пароли не совпадают')).toBeInTheDocument()
      })
    })

    it('показывает ошибку при слишком коротком пароле', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getAllByText('Задайте пароль').length).toBeGreaterThanOrEqual(1)
      })

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'short')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText(/Пароль должен содержать минимум 8 символов/i)).toBeInTheDocument()
      })
    })

    it('показывает ошибку при пароле без специальных символов', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getAllByText('Задайте пароль').length).toBeGreaterThanOrEqual(1)
      })

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'SimplePassword123')
      await user.type(passwordInputs[1], 'SimplePassword123')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText(/Пароль должен содержать заглавные и строчные буквы, цифры и специальные символы/i)).toBeInTheDocument()
      })
    })

    it('успешно задает новый пароль и переходит к выбору клуба', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)
      vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getAllByText('Задайте пароль').length).toBeGreaterThanOrEqual(1)
      })

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'ValidPassword123!')
      await user.type(passwordInputs[1], 'ValidPassword123!')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Выберите клуб')).toBeInTheDocument()
      })
    })

    it('успешный вход после смены пароля редиректит на бронирования', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)
      vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)
      vi.mocked(authApi.login).mockResolvedValue({ jwt: 'mock-jwt-token' })

      render(<LoginPage />)

      // Шаг 1: Ввод телефона
      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')
      await user.click(screen.getByRole('button', { name: /Далее/i }))

      // Шаг 2: Задание пароля
      await waitFor(() => {
        expect(screen.getAllByText('Задайте пароль').length).toBeGreaterThanOrEqual(1)
      })

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'ValidPassword123!')
      await user.type(passwordInputs[1], 'ValidPassword123!')
      await user.click(screen.getByRole('button', { name: /Далее/i }))

      // Шаг 3: Выбор клуба
      await waitFor(() => {
        expect(screen.getByText('Выберите клуб')).toBeInTheDocument()
      })

      await user.click(screen.getByText('VR Club Moscow'))

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/bookings')
      })
    })

    it('обрабатывает ошибку API при смене пароля', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockResolvedValue(true)
      vi.mocked(authApi.preLogin).mockRejectedValue({
        response: { data: { message: 'Ошибка сервера при смене пароля' } }
      })

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9990000000')
      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getAllByText('Задайте пароль').length).toBeGreaterThanOrEqual(1)
      })

      const passwordInputs = document.querySelectorAll('input[type="password"]')
      await user.type(passwordInputs[0], 'ValidPassword123!')
      await user.type(passwordInputs[1], 'ValidPassword123!')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText('Ошибка сервера при смене пароля')).toBeInTheDocument()
      })
    })
  })

  describe('Обработка ошибок', () => {
    it('обрабатывает сетевую ошибку на шаге проверки телефона', async () => {
      const user = userEvent.setup()

      vi.mocked(authApi.isFirstEnter).mockRejectedValue({
        response: { data: { message: 'Сотрудник с номером телефона +7-999-123-45-67 не найден' } }
      })

      render(<LoginPage />)

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9991234567')

      await user.click(screen.getByRole('button', { name: /Далее/i }))

      await waitFor(() => {
        expect(screen.getByText(/Сотрудник с номером телефона .* не найден/i)).toBeInTheDocument()
      })
    })
  })
})
