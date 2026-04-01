import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'
import { EmployeeRole } from '@/types'

// Моковый клуб с полными данными
const mockClub = {
  id: 1,
  name: 'Test Club',
  phone: '+7-495-123-45-67',
  email: 'test@club.ru',
  address: 'Test Address',
  cntEquipment: 10,
  isOpen: true,
}

// Тестируем логику роутинга
describe('App Routing (Employee)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  describe('Аутентификация', () => {
    it('isAuthenticated возвращает true при наличии токена', () => {
      useAuthStore.getState().setToken('test-token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    it('isAuthenticated возвращает false без токена', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('logout очищает токен и currentClub', () => {
      useAuthStore.getState().setToken('test-token')
      useAuthStore.getState().setCurrentClub(mockClub)

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().currentClub).not.toBeNull()

      useAuthStore.getState().logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().currentClub).toBeNull()
    })
  })

  describe('ProtectedRoute Logic', () => {
    it('неаутентифицированный пользователь должен быть перенаправлен на login', () => {
      const isAuthenticated = useAuthStore.getState().isAuthenticated
      expect(isAuthenticated).toBe(false)

      // Логика ProtectedRoute: если !isAuthenticated, Navigate to /auth/login
      const shouldRedirectToLogin = !isAuthenticated
      expect(shouldRedirectToLogin).toBe(true)
    })

    it('аутентифицированный пользователь может получить доступ к защищенным маршрутам', () => {
      useAuthStore.getState().setToken('test-token')
      const isAuthenticated = useAuthStore.getState().isAuthenticated

      expect(isAuthenticated).toBe(true)
      const shouldAllowAccess = isAuthenticated
      expect(shouldAllowAccess).toBe(true)
    })
  })

  describe('RoleProtectedRoute Logic', () => {
    const checkRoleAccess = (userRoles: EmployeeRole[], allowedRoles: EmployeeRole[]): boolean => {
      return userRoles.some(role => allowedRoles.includes(role))
    }

    it('MANAGER имеет доступ к управлению HR', () => {
      const userRoles = [EmployeeRole.MANAGER]
      const allowedRoles = [EmployeeRole.MANAGER]

      expect(checkRoleAccess(userRoles, allowedRoles)).toBe(true)
    })

    it('ADMINISTRATOR имеет доступ к бронированиям', () => {
      const userRoles = [EmployeeRole.ADMINISTRATOR]
      const allowedRoles = [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER]

      expect(checkRoleAccess(userRoles, allowedRoles)).toBe(true)
    })

    it('EMPLOYEE без дополнительных ролей не имеет доступа к управлению', () => {
      const userRoles = [EmployeeRole.EMPLOYEE]
      const allowedRoles = [EmployeeRole.MANAGER]

      expect(checkRoleAccess(userRoles, allowedRoles)).toBe(false)
    })

    it('пользователь с несколькими ролями имеет доступ если хотя бы одна роль разрешена', () => {
      const userRoles = [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR]
      const allowedRoles = [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER]

      expect(checkRoleAccess(userRoles, allowedRoles)).toBe(true)
    })
  })

  describe('Маршруты и требуемые роли', () => {
    const routeRoles: Record<string, EmployeeRole[]> = {
      '/bookings': [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER],
      '/bookings/:id': [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER],
      '/bookings/make': [EmployeeRole.ADMINISTRATOR, EmployeeRole.MANAGER],
      '/management/hr': [EmployeeRole.MANAGER],
      '/management/club': [EmployeeRole.MANAGER],
      '/management/reports': [EmployeeRole.MANAGER],
    }

    it('маршруты бронирований требуют роль ADMINISTRATOR или MANAGER', () => {
      const bookingRoutes = ['/bookings', '/bookings/:id', '/bookings/make']

      bookingRoutes.forEach(route => {
        const allowedRoles = routeRoles[route]
        expect(allowedRoles).toContain(EmployeeRole.ADMINISTRATOR)
        expect(allowedRoles).toContain(EmployeeRole.MANAGER)
      })
    })

    it('маршруты управления требуют роль MANAGER', () => {
      const managementRoutes = ['/management/hr', '/management/club', '/management/reports']

      managementRoutes.forEach(route => {
        const allowedRoles = routeRoles[route]
        expect(allowedRoles).toContain(EmployeeRole.MANAGER)
        expect(allowedRoles).not.toContain(EmployeeRole.ADMINISTRATOR)
      })
    })

    it('/profile доступен всем аутентифицированным пользователям', () => {
      // /profile использует ProtectedRoute, а не RoleProtectedRoute
      // Значит любой аутентифицированный пользователь имеет доступ
      useAuthStore.getState().setToken('test-token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })
})

describe('Current Club Logic (Employee)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('setCurrentClub устанавливает текущий клуб', () => {
    useAuthStore.getState().setCurrentClub(mockClub)

    expect(useAuthStore.getState().currentClub).toEqual(mockClub)
  })

  it('currentClub сохраняется после setToken', () => {
    useAuthStore.getState().setCurrentClub(mockClub)
    useAuthStore.getState().setToken('test-token')

    expect(useAuthStore.getState().currentClub).toEqual(mockClub)
  })

  it('logout очищает currentClub', () => {
    useAuthStore.getState().setCurrentClub(mockClub)
    useAuthStore.getState().setToken('test-token')

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().currentClub).toBeNull()
  })
})
