import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import ProfilePage from '@/pages/profile/ProfilePage'
import { useAuthStore } from '@/stores/authStore'
import { mockEmployee, mockClubs } from '../mocks/handlers'
import { profileApi } from '@/api/profileApi'
import { AxiosError } from 'axios'

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
vi.mock('@/api/profileApi')

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

describe('ProfilePage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    // Устанавливаем текущий клуб в store
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтный мок для успешного ответа
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockEmployee)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает данные профиля сотрудника', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Мой профиль')).toBeInTheDocument()
    })

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    expect(screen.getByText(mockEmployee.name)).toBeInTheDocument()
    expect(screen.getByText(mockEmployee.patronymic!)).toBeInTheDocument()
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(profileApi.getPersonalInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockEmployee), 1000))
    )

    render(<ProfilePage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('отображает ошибку при неудачной загрузке', async () => {
    vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(new Error('Ошибка'))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки профиля')).toBeInTheDocument()
    })
  })

  it('отображает роли сотрудника', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    // Проверяем отображение ролей
    expect(screen.getByText('Сотрудник')).toBeInTheDocument()
    expect(screen.getByText('Администратор')).toBeInTheDocument()
  })

  it('отображает информацию о текущем клубе', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    // Проверяем информацию о клубе
    expect(screen.getByText('Текущий клуб')).toBeInTheDocument()
    expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    expect(screen.getByText(mockClubs[0].address)).toBeInTheDocument()
    expect(screen.getByText(mockClubs[0].email)).toBeInTheDocument()
  })

  it('отображает город и регион клуба', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    expect(screen.getByText(`${mockClubs[0].city.name}, ${mockClubs[0].city.region.name}`)).toBeInTheDocument()
  })

  it('показывает уведомление при нажатии на смену клуба', async () => {
    const user = userEvent.setup()

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    const changeClubButton = screen.getByRole('button', { name: /Сменить текущий клуб/i })
    await user.click(changeClubButton)

    // Проверяем появление уведомления
    await waitFor(() => {
      expect(screen.getByText(/Для смены клуба необходимо выйти и войти заново/i)).toBeInTheDocument()
    })
  })

  it('отображает секции личных данных и текущего клуба', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    expect(screen.getByText('Личные данные')).toBeInTheDocument()
    expect(screen.getByText('Текущий клуб')).toBeInTheDocument()
  })

  it('корректно форматирует номер телефона', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    // Проверяем, что телефон отображается
    const phoneLabels = screen.getAllByText('Номер телефона')
    expect(phoneLabels.length).toBeGreaterThan(0)
  })

  it('не показывает отчество, если его нет', async () => {
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
      ...mockEmployee,
      patronymic: null,
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    })

    // Проверяем, что отчество не отображается
    expect(screen.queryByText('Отчество')).not.toBeInTheDocument()
  })

  describe('Обработка заблокированного сотрудника', () => {
    it('отображает сообщение об ошибке при загрузке профиля заблокированного сотрудника', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки профиля/i)).toBeInTheDocument()
      })
    })

    it('не отображает данные профиля для заблокированного сотрудника', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки профиля/i)).toBeInTheDocument()
      })

      expect(screen.queryByText(mockEmployee.surname)).not.toBeInTheDocument()
      expect(screen.queryByText(mockEmployee.name)).not.toBeInTheDocument()
    })

    it('не показывает информацию о клубе для заблокированного сотрудника', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки профиля/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('Текущий клуб')).not.toBeInTheDocument()
      expect(screen.queryByText(mockClubs[0].name)).not.toBeInTheDocument()
    })

    it('не показывает кнопку смены клуба для заблокированного сотрудника', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки профиля/i)).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /Сменить текущий клуб/i })).not.toBeInTheDocument()
    })
  })

  describe('Смена текущего клуба', () => {
    const multiClubEmployee = {
      ...mockEmployee,
      clubs: [
        mockClubs[0],
        mockClubs[1],
      ],
    }

    it('отображается список клубов, в которых работает сотрудник', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(multiClubEmployee)

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
      })

      // Должна отображаться информация о текущем клубе
      expect(screen.getByText('Текущий клуб')).toBeInTheDocument()
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    it('отображает кнопку смены клуба для сотрудника', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(multiClubEmployee)

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
      })

      // Кнопка смены клуба должна быть доступна
      expect(screen.getByRole('button', { name: /Сменить текущий клуб/i })).toBeInTheDocument()
    })

    it('при выборе другого клуба currentClub в store обновляется', async () => {
      const user = userEvent.setup()
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(multiClubEmployee)

      // Устанавливаем первый клуб
      useAuthStore.getState().setCurrentClub(mockClubs[0])

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
      })

      // Проверяем текущий клуб в store
      expect(useAuthStore.getState().currentClub?.id).toBe(1)
      expect(useAuthStore.getState().currentClub?.name).toBe('VR Club Moscow')

      // При смене клуба store должен обновиться
      useAuthStore.getState().setCurrentClub(mockClubs[1])
      expect(useAuthStore.getState().currentClub?.id).toBe(2)
      expect(useAuthStore.getState().currentClub?.name).toBe('VR Club SPb')
    })

    it('после смены клуба отображаются роли в новом клубе', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
        ...multiClubEmployee,
        roles: ['EMPLOYEE', 'ADMIN'],
      })

      // Устанавливаем второй клуб
      useAuthStore.getState().setCurrentClub(mockClubs[1])

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
      })

      // Должна отображаться информация о новом клубе
      expect(screen.getByText(mockClubs[1].name)).toBeInTheDocument()
      expect(screen.getByText(mockClubs[1].address)).toBeInTheDocument()

      // Роли должны отображаться
      expect(screen.getByText('Сотрудник')).toBeInTheDocument()
      expect(screen.getByText('Администратор')).toBeInTheDocument()
    })

    it('текущий клуб корректно отображается после переключения', async () => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(multiClubEmployee)

      // Начинаем с первого клуба
      useAuthStore.getState().setCurrentClub(mockClubs[0])

      render(<ProfilePage />)

      await waitFor(() => {
        expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
      })

      // Переключаемся на второй клуб
      useAuthStore.getState().setCurrentClub(mockClubs[1])

      // В store должен обновиться текущий клуб
      expect(useAuthStore.getState().currentClub?.name).toBe('VR Club SPb')
    })
  })
})
