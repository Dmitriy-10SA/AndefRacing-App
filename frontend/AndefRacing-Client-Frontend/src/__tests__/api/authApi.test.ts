import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authApi } from '@/api/authApi'
import axiosInstance from '@/lib/axios'
import type {
  ClientRegisterDto,
  ClientLoginDto,
  ClientChangePasswordDto,
  ClientAuthResponseDto,
} from '@/types'

vi.mock('@/lib/axios')

describe('authApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('регистрирует нового клиента', async () => {
      const registerData: ClientRegisterDto = {
        firstName: 'Иван',
        middleName: 'Иванович',
        lastName: 'Иванов',
        phone: '+79991234567',
        password: 'password123',
      }
      const mockAuthResponse: ClientAuthResponseDto = {
        accessToken: 'mock-access-token',
        client: {
          id: 1,
          firstName: 'Иван',
          middleName: 'Иванович',
          lastName: 'Иванов',
          phone: '+79991234567',
        },
      }
      const mockResponse = { data: mockAuthResponse }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.register(registerData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/client/register', registerData)
      expect(result).toEqual(mockAuthResponse)
      expect(result.accessToken).toBe('mock-access-token')
      expect(result.client.firstName).toBe('Иван')
    })

    it('обрабатывает ошибку при регистрации (телефон уже занят)', async () => {
      const registerData: ClientRegisterDto = {
        firstName: 'Иван',
        middleName: 'Иванович',
        lastName: 'Иванов',
        phone: '+79991234567',
        password: 'password123',
      }
      const error = new Error('Phone already exists')

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

      await expect(authApi.register(registerData)).rejects.toThrow('Phone already exists')
    })

    it('регистрирует клиента без отчества', async () => {
      const registerData: ClientRegisterDto = {
        firstName: 'Иван',
        middleName: null,
        lastName: 'Иванов',
        phone: '+79991234567',
        password: 'password123',
      }
      const mockResponse = {
        data: {
          accessToken: 'token',
          client: {
            id: 1,
            firstName: 'Иван',
            middleName: null,
            lastName: 'Иванов',
            phone: '+79991234567',
          },
        },
      }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.register(registerData)

      expect(result.client.middleName).toBeNull()
    })
  })

  describe('login', () => {
    it('выполняет вход клиента', async () => {
      const loginData: ClientLoginDto = {
        phone: '+79991234567',
        password: 'password123',
      }
      const mockAuthResponse: ClientAuthResponseDto = {
        accessToken: 'mock-access-token',
        client: {
          id: 1,
          firstName: 'Иван',
          middleName: 'Иванович',
          lastName: 'Иванов',
          phone: '+79991234567',
        },
      }
      const mockResponse = { data: mockAuthResponse }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce(mockResponse)

      const result = await authApi.login(loginData)

      expect(axiosInstance.post).toHaveBeenCalledWith('/auth/client/login', loginData)
      expect(result).toEqual(mockAuthResponse)
      expect(result.accessToken).toBe('mock-access-token')
    })

    it('обрабатывает ошибку при неверных учетных данных', async () => {
      const loginData: ClientLoginDto = {
        phone: '+79991234567',
        password: 'wrongpassword',
      }
      const error = new Error('Invalid credentials')

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

      await expect(authApi.login(loginData)).rejects.toThrow('Invalid credentials')
    })
  })

  describe('changePassword', () => {
    it('изменяет пароль клиента', async () => {
      const changePasswordData: ClientChangePasswordDto = {
        phone: '+79991234567',
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      }
      const mockAuthResponse: ClientAuthResponseDto = {
        accessToken: 'new-access-token',
        client: {
          id: 1,
          firstName: 'Иван',
          middleName: 'Иванович',
          lastName: 'Иванов',
          phone: '+79991234567',
        },
      }
      const mockResponse = { data: mockAuthResponse }

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce(mockResponse)

      const result = await authApi.changePassword(changePasswordData)

      expect(axiosInstance.patch).toHaveBeenCalledWith(
        '/auth/client/change-password',
        changePasswordData
      )
      expect(result).toEqual(mockAuthResponse)
      expect(result.accessToken).toBe('new-access-token')
    })

    it('обрабатывает ошибку при неверном старом пароле', async () => {
      const changePasswordData: ClientChangePasswordDto = {
        phone: '+79991234567',
        oldPassword: 'wrongoldpassword',
        newPassword: 'newpassword123',
      }
      const error = new Error('Invalid old password')

      vi.mocked(axiosInstance.patch).mockRejectedValueOnce(error)

      await expect(authApi.changePassword(changePasswordData)).rejects.toThrow(
        'Invalid old password'
      )
    })

    it('возвращает новый токен после смены пароля', async () => {
      const changePasswordData: ClientChangePasswordDto = {
        phone: '+79991234567',
        oldPassword: 'oldpassword123',
        newPassword: 'newpassword123',
      }
      const mockResponse = {
        data: {
          accessToken: 'completely-new-token-after-password-change',
          client: {
            id: 1,
            firstName: 'Иван',
            middleName: null,
            lastName: 'Иванов',
            phone: '+79991234567',
          },
        },
      }

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce(mockResponse)

      const result = await authApi.changePassword(changePasswordData)

      expect(result.accessToken).toBe('completely-new-token-after-password-change')
    })
  })
})
