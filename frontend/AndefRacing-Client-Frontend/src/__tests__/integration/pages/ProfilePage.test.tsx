import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../test-utils'
import ProfilePage from '@/pages/profile/ProfilePage'
import { useAuthStore } from '@/stores/authStore'
import { profileApi } from '@/api/profileApi'
import { AxiosError } from 'axios'

// Мокаем API модули
vi.mock('@/api/profileApi')

// Мокаем useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const mockUser = {
  phone: '+7-999-123-45-67',
  name: 'Тестовый Пользователь',
}

// Хелпер для создания ошибки "Вы заблокированы"
const createBlockedError = () => {
  const error = new Error('Вы заблокированы') as AxiosError
  error.response = {
    data: { message: 'Вы заблокированы' },
    status: 403,
    statusText: 'Forbidden',
    headers: {},
    config: {} as any,
  }
  return error
}

describe('ProfilePage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтный мок для успешного ответа
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockUser)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает данные профиля после загрузки', async () => {
    render(<ProfilePage />)

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Мой профиль')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    })

    expect(screen.getByText('Имя')).toBeInTheDocument()
    expect(screen.getByText('Номер телефона')).toBeInTheDocument()
    expect(screen.getByText(mockUser.phone)).toBeInTheDocument()
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(profileApi.getPersonalInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockUser), 1000))
    )

    render(<ProfilePage />)

    // Проверяем наличие спиннера загрузки
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('отображает ошибку при неудачной загрузке', async () => {
    vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(new Error('Ошибка'))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки профиля')).toBeInTheDocument()
    })
  })

  it('содержит ссылку на редактирование профиля', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Мой профиль')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    })

    const editLink = screen.getByText('Редактировать')
    expect(editLink).toHaveAttribute('href', '/profile/edit')
  })

  it('отображает кастомное имя из API', async () => {
    const customUser = {
      phone: '+7-999-555-55-55',
      name: 'Иван Петров',
    }

    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(customUser)

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Иван Петров')).toBeInTheDocument()
    })

    expect(screen.getByText('+7-999-555-55-55')).toBeInTheDocument()
  })

  describe('Обработка заблокированного клиента', () => {
    it('отображает сообщение об ошибке при загрузке профиля заблокированного клиента', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки профиля/i)).toBeInTheDocument()
      })
    })

    it('не отображает данные профиля для заблокированного клиента', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки профиля/i)).toBeInTheDocument()
      })

      expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument()
      expect(screen.queryByText(mockUser.phone)).not.toBeInTheDocument()
    })

    it('не показывает кнопку редактирования для заблокированного клиента', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки профиля/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('Редактировать')).not.toBeInTheDocument()
    })
  })
})
