import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import EditProfilePage from '@/pages/profile/EditProfilePage'
import { useAuthStore } from '@/stores/authStore'
import { profileApi } from '@/api/profileApi'

// Мокаем API модули
vi.mock('@/api/profileApi')

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const mockUser = {
  phone: '+7-999-123-45-67',
  name: 'Тестовый Пользователь',
}

// Хелпер для получения input по имени
const getNameInput = () => document.querySelector('input[name="name"]') as HTMLInputElement

describe('EditProfilePage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтные моки для успешных ответов
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockUser)
    vi.mocked(profileApi.changePersonalInfo).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает форму редактирования с загруженными данными', async () => {
    render(<EditProfilePage />)

    // Ждем появления формы
    await waitFor(() => {
      expect(screen.getByText('Редактирование профиля')).toBeInTheDocument()
    })

    // Ждем загрузки данных профиля в форму
    await waitFor(() => {
      const nameInput = getNameInput()
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.value).toBe(mockUser.name)
    })
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(profileApi.getPersonalInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 1000))
    )

    render(<EditProfilePage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('показывает ошибки валидации при пустом имени', async () => {
    const user = userEvent.setup()

    render(<EditProfilePage />)

    // Ждем загрузки формы с данными
    await waitFor(() => {
      const nameInput = getNameInput()
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.value).toBe(mockUser.name)
    })

    const nameInput = getNameInput()
    await user.clear(nameInput)

    await user.click(screen.getByRole('button', { name: /Сохранить/i }))

    await waitFor(() => {
      expect(screen.getByText('Имя обязательно')).toBeInTheDocument()
    })
  })

  it('проверяет максимальную длину имени', async () => {
    const user = userEvent.setup()

    render(<EditProfilePage />)

    // Ждем загрузки формы с данными
    await waitFor(() => {
      const nameInput = getNameInput()
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.value).toBe(mockUser.name)
    })

    const nameInput = getNameInput()
    await user.clear(nameInput)
    await user.type(nameInput, 'a'.repeat(101))

    await user.click(screen.getByRole('button', { name: /Сохранить/i }))

    await waitFor(() => {
      expect(screen.getByText('Имя не должно превышать 100 символов')).toBeInTheDocument()
    })
  })

  it('успешно сохраняет изменения и перенаправляет на профиль', async () => {
    const user = userEvent.setup()

    render(<EditProfilePage />)

    // Ждем загрузки формы с данными
    await waitFor(() => {
      const nameInput = getNameInput()
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.value).toBe(mockUser.name)
    })

    const nameInput = getNameInput()
    await user.clear(nameInput)
    await user.type(nameInput, 'Новое Имя')

    await user.click(screen.getByRole('button', { name: /Сохранить/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/profile')
    })
  })

  it('показывает состояние загрузки при сохранении', async () => {
    const user = userEvent.setup()

    vi.mocked(profileApi.changePersonalInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
    )

    render(<EditProfilePage />)

    // Ждем загрузки формы с данными
    await waitFor(() => {
      const nameInput = getNameInput()
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.value).toBe(mockUser.name)
    })

    await user.click(screen.getByRole('button', { name: /Сохранить/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Сохранение.../i })).toBeDisabled()
    })
  })

  it('кнопка отмены перенаправляет на страницу профиля', async () => {
    const user = userEvent.setup()

    render(<EditProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Редактирование профиля')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Отмена/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/profile')
  })

  it('показывает ошибку при неудачном сохранении', async () => {
    const user = userEvent.setup()

    vi.mocked(profileApi.changePersonalInfo).mockRejectedValue({
      response: { data: { message: 'Номер телефона уже используется' } }
    })

    render(<EditProfilePage />)

    // Ждем загрузки формы с данными
    await waitFor(() => {
      const nameInput = getNameInput()
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.value).toBe(mockUser.name)
    })

    await user.click(screen.getByRole('button', { name: /Сохранить/i }))

    await waitFor(() => {
      expect(screen.getByText('Номер телефона уже используется')).toBeInTheDocument()
    })
  })

  it('обрабатывает сетевую ошибку', async () => {
    const user = userEvent.setup()

    vi.mocked(profileApi.changePersonalInfo).mockRejectedValue(new Error('Network error'))

    render(<EditProfilePage />)

    // Ждем загрузки формы с данными
    await waitFor(() => {
      const nameInput = getNameInput()
      expect(nameInput).toBeInTheDocument()
      expect(nameInput.value).toBe(mockUser.name)
    })

    await user.click(screen.getByRole('button', { name: /Сохранить/i }))

    await waitFor(() => {
      expect(screen.getByText('Ошибка обновления профиля')).toBeInTheDocument()
    })
  })
})
