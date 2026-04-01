import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authApi } from '@/api/authApi'
import axiosInstance from '@/lib/axios'
import type { EmployeeLoginDto, EmployeeAuthResponseDto, EmployeeClubDto } from '@/types'

vi.mock('@/lib/axios')

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isFirstEnter', () => {
    it('проверяет, является ли вход первым', async () => {
      const phone = '+79991234567'
      const mockResponse = { data: true }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await authApi.isFirstEnter(phone)

      expect(axiosInstance.get).toHaveBeenCalledWith('/auth/employee/is-first-enter', {
        params: { phone },
      })
      expect(result).toBe(true)
    })

    it('возвращает false, если сотрудник уже входил', async () => {
      const phone = '+79991234567'
      const mockResponse = { data: false }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await authApi.isFirstEnter(phone)

      expect(result).toBe(false)
    })

    it('обрабатывает ошибку при проверке первого входа', async () => {
      const phone = '+79991234567'
      const error = new Error('Network error')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(authApi.isFirstEnter(phone)).rejects.toThrow('Network error')
    })
  })

  describe('preLogin', () => {
    it('получает список клубов для сотрудника', async () => {
      const loginData: EmployeeLoginDto = {
        phone: '+79991234567',
        password: 'password123',
      }
      const mockClubs: EmployeeClubDto[] = [
        {
          id: 1,
          name: 'Клуб 1',
          address: 'Адрес 1',
          cityName: 'Москва',
        },
        {
          id: 2,
          name: 'Клуб 2',
          address: 'Адрес 2',
          cityName: 'Москва',
        },
      ]
      const mockResponse = { data: mockClubs }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.preLogin(loginData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/employee/pre-login', loginData)
      expect(result).toEqual(mockClubs)
      expect(result).toHaveLength(2)
    })

    it('возвращает пустой массив, если нет клубов', async () => {
      const loginData: EmployeeLoginDto = {
        phone: '+79991234567',
        password: 'password123',
      }
      const mockResponse = { data: [] }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.preLogin(loginData)

      expect(result).toEqual([])
    })

    it('обрабатывает ошибку при pre-login', async () => {
      const loginData: EmployeeLoginDto = {
        phone: '+79991234567',
        password: 'wrongpassword',
      }
      const error = new Error('Invalid credentials')

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

      await expect(authApi.preLogin(loginData)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('login', () => {
    it('выполняет вход сотрудника в конкретный клуб', async () => {
      const clubId = 1
      const loginData: EmployeeLoginDto = {
        phone: '+79991234567',
        password: 'password123',
      }
      const mockAuthResponse: EmployeeAuthResponseDto = {
        accessToken: 'mock-access-token',
        employee: {
          id: 1,
          firstName: 'Иван',
          middleName: 'Иванович',
          lastName: 'Иванов',
          phone: '+79991234567',
          roles: ['ADMINISTRATOR'],
        },
        club: {
          id: 1,
          name: 'Клуб 1',
          address: 'Адрес 1',
          cityName: 'Москва',
        },
      }
      const mockResponse = { data: mockAuthResponse }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.login(clubId, loginData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/auth/employee/login/${clubId}`,
        loginData
      )
      expect(result).toEqual(mockAuthResponse)
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.employee.firstName).toBe('Иван')
      expect(result.club.name).toBe('Клуб 1')
    })

    it('обрабатывает ошибку при логине', async () => {
      const clubId = 1
      const loginData: EmployeeLoginDto = {
        phone: '+79991234567',
        password: 'wrongpassword',
      }
      const error = new Error('Invalid credentials')

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

      await expect(authApi.login(clubId, loginData)).rejects.toThrow('Invalid credentials')
    })

    it('передает правильный clubId в URL', async () => {
      const clubId = 42
      const loginData: EmployeeLoginDto = {
        phone: '+79991234567',
        password: 'password123',
      }
      const mockResponse = {
        data: {
          accessToken: 'token',
          employee: {} as any,
          club: {} as any,
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse)

      await authApi.login(clubId, loginData)

      expect(axiosInstance.post).toHaveBeenCalledWith(`/auth/employee/login/42`, loginData)
    })
  })
})
