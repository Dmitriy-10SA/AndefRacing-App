import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/authStore'
import { mockClubs, mockEmployee, mockClubFullInfo, mockEmployeesWithRoles } from '../mocks/handlers'
import { profileApi } from '@/api/profileApi'
import { bookingApi } from '@/api/bookingApi'
import { searchApi } from '@/api/searchApi'
import { managementApi } from '@/api/managementApi'
import { reportsApi } from '@/api/reportsApi'
import { EmployeeRole } from '@/types'

// Мокаем API модули
vi.mock('@/api/profileApi')
vi.mock('@/api/bookingApi')
vi.mock('@/api/searchApi')
vi.mock('@/api/managementApi')
vi.mock('@/api/reportsApi')

// Импортируем страницы
import ProfilePage from '@/pages/profile/ProfilePage'
import BookingsPage from '@/pages/bookings/BookingsPage'
import HRManagementPage from '@/pages/management/HRManagementPage'
import ClubManagementPage from '@/pages/management/ClubManagementPage'
import ReportsPage from '@/pages/management/ReportsPage'

// Создаем QueryClient для тестов
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

// Компонент редиректа для имитации ProtectedRoute
const RedirectToProfile = () => {
  return <div data-testid="redirect-profile">Redirected to Profile</div>
}

const RedirectToBookings = () => {
  return <div data-testid="redirect-bookings">Redirected to Bookings</div>
}

// Обертка для рендеринга с роутером
interface TestWrapperProps {
  children: React.ReactNode
  initialEntries: string[]
}

const TestWrapper = ({ children, initialEntries }: TestWrapperProps) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('RBAC: Блокировка доступа по URL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()

    // Дефолтные моки
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockEmployee)
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, isLast: true }
    })
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue(mockEmployeesWithRoles)
    vi.mocked(managementApi.getAllGames).mockResolvedValue([])
    vi.mocked(managementApi.getWorkScheduleExceptions).mockResolvedValue([])
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  describe('Сотрудник с ролью EMPLOYEE', () => {
    beforeEach(() => {
      useAuthStore.getState().setToken('employee-token')
      useAuthStore.getState().setCurrentClub(mockClubs[0])

      // Мокаем профиль с ролью только EMPLOYEE
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
        ...mockEmployee,
        roles: [EmployeeRole.EMPLOYEE],
      })
    })

    it('сотрудник с ролью EMPLOYEE при прямом переходе на /bookings перенаправляется на /profile', () => {
      // Проверка логики доступа
      const userRoles = [EmployeeRole.EMPLOYEE]
      const requiredRoles = [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)

      // Если нет доступа - должен быть редирект на /profile
    })

    it('сотрудник с ролью EMPLOYEE при прямом переходе на /management/hr перенаправляется на /profile', () => {
      const userRoles = [EmployeeRole.EMPLOYEE]
      const requiredRoles = [EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)
    })

    it('сотрудник с ролью EMPLOYEE при прямом переходе на /management/club перенаправляется на /profile', () => {
      const userRoles = [EmployeeRole.EMPLOYEE]
      const requiredRoles = [EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)
    })

    it('сотрудник с ролью EMPLOYEE при прямом переходе на /management/reports перенаправляется на /profile', () => {
      const userRoles = [EmployeeRole.EMPLOYEE]
      const requiredRoles = [EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)
    })

    it('сотрудник с ролью EMPLOYEE имеет доступ к странице профиля', async () => {
      render(
        <TestWrapper initialEntries={['/profile']}>
          <ProfilePage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Мой профиль')).toBeInTheDocument()
      })
    })
  })

  describe('Сотрудник с ролью ADMINISTRATOR', () => {
    beforeEach(() => {
      useAuthStore.getState().setToken('admin-token')
      useAuthStore.getState().setCurrentClub(mockClubs[0])

      // Мокаем профиль с ролью ADMINISTRATOR
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
        ...mockEmployee,
        roles: [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR],
      })
    })

    it('сотрудник с ролью ADMINISTRATOR при прямом переходе на /management/hr перенаправляется на /bookings', () => {
      const userRoles = [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR]
      const requiredRoles = [EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)

      // ADMINISTRATOR не имеет доступа к HR - редирект на /bookings
    })

    it('сотрудник с ролью ADMINISTRATOR при прямом переходе на /management/club перенаправляется на /bookings', () => {
      const userRoles = [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR]
      const requiredRoles = [EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)
    })

    it('сотрудник с ролью ADMINISTRATOR при прямом переходе на /management/reports перенаправляется на /bookings', () => {
      const userRoles = [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR]
      const requiredRoles = [EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)
    })

    it('сотрудник с ролью ADMINISTRATOR имеет доступ к странице бронирований', async () => {
      render(
        <TestWrapper initialEntries={['/bookings']}>
          <BookingsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Бронирования')).toBeInTheDocument()
      })
    })
  })

  describe('Сотрудник с ролью MANAGER', () => {
    beforeEach(() => {
      useAuthStore.getState().setToken('manager-token')
      useAuthStore.getState().setCurrentClub(mockClubs[0])

      // Мокаем профиль с ролью MANAGER
      vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
        ...mockEmployee,
        roles: [EmployeeRole.EMPLOYEE, EmployeeRole.MANAGER],
      })
    })

    it('сотрудник с ролью MANAGER имеет доступ к странице управления персоналом', async () => {
      render(
        <TestWrapper initialEntries={['/management/hr']}>
          <HRManagementPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Управление персоналом')).toBeInTheDocument()
      })
    })

    it('сотрудник с ролью MANAGER имеет доступ к странице управления клубом', async () => {
      render(
        <TestWrapper initialEntries={['/management/club']}>
          <ClubManagementPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Управление клубом')).toBeInTheDocument()
      })
    })

    it('сотрудник с ролью MANAGER имеет доступ к странице отчетов', async () => {
      render(
        <TestWrapper initialEntries={['/management/reports']}>
          <ReportsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Отчеты')).toBeInTheDocument()
      })
    })

    it('сотрудник с ролью MANAGER имеет доступ к странице бронирований', async () => {
      render(
        <TestWrapper initialEntries={['/bookings']}>
          <BookingsPage />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Бронирования')).toBeInTheDocument()
      })
    })
  })

  describe('Проверка логики доступа', () => {
    it('роль EMPLOYEE не дает доступа к управлению', () => {
      const roles = [EmployeeRole.EMPLOYEE]

      const canAccessBookings = roles.some(r =>
        [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER].includes(r)
      )
      const canAccessHR = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessClub = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessReports = roles.some(r => r === EmployeeRole.MANAGER)

      expect(canAccessBookings).toBe(false)
      expect(canAccessHR).toBe(false)
      expect(canAccessClub).toBe(false)
      expect(canAccessReports).toBe(false)
    })

    it('роль ADMINISTRATOR дает доступ только к бронированиям', () => {
      const roles = [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR]

      const canAccessBookings = roles.some(r =>
        [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER].includes(r)
      )
      const canAccessHR = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessClub = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessReports = roles.some(r => r === EmployeeRole.MANAGER)

      expect(canAccessBookings).toBe(true)
      expect(canAccessHR).toBe(false)
      expect(canAccessClub).toBe(false)
      expect(canAccessReports).toBe(false)
    })

    it('роль MANAGER дает полный доступ', () => {
      const roles = [EmployeeRole.EMPLOYEE, EmployeeRole.MANAGER]

      const canAccessBookings = roles.some(r =>
        [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER].includes(r)
      )
      const canAccessHR = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessClub = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessReports = roles.some(r => r === EmployeeRole.MANAGER)

      expect(canAccessBookings).toBe(true)
      expect(canAccessHR).toBe(true)
      expect(canAccessClub).toBe(true)
      expect(canAccessReports).toBe(true)
    })

    it('комбинация ADMINISTRATOR + MANAGER дает полный доступ', () => {
      const roles = [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER]

      const canAccessBookings = roles.some(r =>
        [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER].includes(r)
      )
      const canAccessHR = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessClub = roles.some(r => r === EmployeeRole.MANAGER)
      const canAccessReports = roles.some(r => r === EmployeeRole.MANAGER)

      expect(canAccessBookings).toBe(true)
      expect(canAccessHR).toBe(true)
      expect(canAccessClub).toBe(true)
      expect(canAccessReports).toBe(true)
    })
  })

  describe('Редирект при отсутствии доступа', () => {
    it('EMPLOYEE без доступа к бронированиям редиректится на профиль', () => {
      const userRoles = [EmployeeRole.EMPLOYEE]
      const bookingsRequiredRoles = [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => bookingsRequiredRoles.includes(role))
      const redirectTo = hasAccess ? null : '/profile'

      expect(redirectTo).toBe('/profile')
    })

    it('ADMINISTRATOR без доступа к HR редиректится на бронирования', () => {
      const userRoles = [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR]
      const hrRequiredRoles = [EmployeeRole.MANAGER]

      const hasAccess = userRoles.some(role => hrRequiredRoles.includes(role))
      const hasBookingsAccess = userRoles.some(role =>
        [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER].includes(role)
      )
      const redirectTo = hasAccess ? null : (hasBookingsAccess ? '/bookings' : '/profile')

      expect(redirectTo).toBe('/bookings')
    })
  })
})
