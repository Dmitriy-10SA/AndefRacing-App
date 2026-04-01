import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { render } from '../test-utils'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/stores/authStore'
import { profileApi } from '@/api/profileApi'
import { EmployeeRole } from '@/types'
import { mockClubs } from '../mocks/handlers'

// Мокаем API модуль
vi.mock('@/api/profileApi')

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
  }
})

const mockEmployeeWithRole = (roles: EmployeeRole[]) => ({
  phone: '+7-999-123-45-67',
  name: 'Иван',
  surname: 'Иванов',
  patronymic: 'Иванович',
  roles,
})

describe('Layout RBAC (Ролевая модель)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    // Устанавливаем авторизацию
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  describe('Роль EMPLOYEE (Сотрудник)', () => {
    beforeEach(() => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(
        mockEmployeeWithRole([EmployeeRole.EMPLOYEE])
      )
    })

    it('не показывает пункт меню "Бронирования"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Бронирования' })).not.toBeInTheDocument()
      })
    })

    it('не показывает пункт меню "Персонал"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Персонал' })).not.toBeInTheDocument()
      })
    })

    it('не показывает пункт меню "Клуб"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Клуб' })).not.toBeInTheDocument()
      })
    })

    it('не показывает пункт меню "Отчеты"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Отчеты' })).not.toBeInTheDocument()
      })
    })

    it('показывает пункт меню "Профиль"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Профиль' })).toBeInTheDocument()
      })
    })

    it('показывает кнопку "Выход"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Выход' })).toBeInTheDocument()
      })
    })
  })

  describe('Роль ADMINISTRATOR (Администратор)', () => {
    beforeEach(() => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(
        mockEmployeeWithRole([EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR])
      )
    })

    it('показывает пункт меню "Бронирования"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Бронирования' })).toBeInTheDocument()
      })
    })

    it('не показывает пункт меню "Персонал"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Персонал' })).not.toBeInTheDocument()
      })
    })

    it('не показывает пункт меню "Клуб"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Клуб' })).not.toBeInTheDocument()
      })
    })

    it('не показывает пункт меню "Отчеты"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.queryByRole('link', { name: 'Отчеты' })).not.toBeInTheDocument()
      })
    })

    it('показывает пункт меню "Профиль"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Профиль' })).toBeInTheDocument()
      })
    })
  })

  describe('Роль MANAGER (Управляющий)', () => {
    beforeEach(() => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(
        mockEmployeeWithRole([EmployeeRole.EMPLOYEE, EmployeeRole.MANAGER])
      )
    })

    it('показывает пункт меню "Бронирования"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Бронирования' })).toBeInTheDocument()
      })
    })

    it('показывает пункт меню "Персонал"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Персонал' })).toBeInTheDocument()
      })
    })

    it('показывает пункт меню "Клуб"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Клуб' })).toBeInTheDocument()
      })
    })

    it('показывает пункт меню "Отчеты"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Отчеты' })).toBeInTheDocument()
      })
    })

    it('показывает пункт меню "Профиль"', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Профиль' })).toBeInTheDocument()
      })
    })

    it('показывает все пункты управления', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Бронирования' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Персонал' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Клуб' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Отчеты' })).toBeInTheDocument()
      })
    })
  })

  describe('Комбинация ролей ADMINISTRATOR + MANAGER', () => {
    beforeEach(() => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(
        mockEmployeeWithRole([EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER])
      )
    })

    it('показывает все пункты меню', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Бронирования' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Персонал' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Клуб' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Отчеты' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Профиль' })).toBeInTheDocument()
      })
    })
  })

  describe('Неавторизованный пользователь', () => {
    beforeEach(() => {
      useAuthStore.getState().logout()
    })

    it('показывает ссылку на вход', () => {
      render(<Layout />)

      expect(screen.getByRole('link', { name: 'Вход' })).toBeInTheDocument()
    })

    it('не показывает пункты меню для авторизованных', () => {
      render(<Layout />)

      expect(screen.queryByRole('link', { name: 'Бронирования' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Профиль' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Выход' })).not.toBeInTheDocument()
    })
  })

  describe('Отображение информации о клубе', () => {
    beforeEach(() => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(
        mockEmployeeWithRole([EmployeeRole.MANAGER])
      )
    })

    it('показывает название текущего клуба', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByText(/VR Club Moscow/i)).toBeInTheDocument()
      })
    })

    it('показывает логотип AndefRacing', async () => {
      render(<Layout />)

      await waitFor(() => {
        expect(screen.getByText('AndefRacing')).toBeInTheDocument()
      })
    })
  })

  describe('Навигационные ссылки', () => {
    beforeEach(() => {
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(
        mockEmployeeWithRole([EmployeeRole.MANAGER])
      )
    })

    it('ссылка "Бронирования" ведет на /bookings', async () => {
      render(<Layout />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Бронирования' })
        expect(link).toHaveAttribute('href', '/bookings')
      })
    })

    it('ссылка "Персонал" ведет на /management/hr', async () => {
      render(<Layout />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Персонал' })
        expect(link).toHaveAttribute('href', '/management/hr')
      })
    })

    it('ссылка "Клуб" ведет на /management/club', async () => {
      render(<Layout />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Клуб' })
        expect(link).toHaveAttribute('href', '/management/club')
      })
    })

    it('ссылка "Отчеты" ведет на /management/reports', async () => {
      render(<Layout />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Отчеты' })
        expect(link).toHaveAttribute('href', '/management/reports')
      })
    })

    it('ссылка "Профиль" ведет на /profile', async () => {
      render(<Layout />)

      await waitFor(() => {
        const link = screen.getByRole('link', { name: 'Профиль' })
        expect(link).toHaveAttribute('href', '/profile')
      })
    })
  })
})
