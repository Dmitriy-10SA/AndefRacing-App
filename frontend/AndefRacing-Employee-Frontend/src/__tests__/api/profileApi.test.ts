import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profileApi } from '@/api/profileApi'
import axiosInstance from '@/lib/axios'
import type { EmployeePersonalInfoDto } from '@/types'

vi.mock('@/lib/axios')

describe('profileApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPersonalInfo', () => {
    it('получает персональную информацию сотрудника', async () => {
      const mockPersonalInfo: EmployeePersonalInfoDto = {
        id: 1,
        firstName: 'Иван',
        middleName: 'Иванович',
        lastName: 'Иванов',
        phone: '+79991234567',
        roles: ['ADMINISTRATOR', 'OPERATOR'],
        clubName: 'VR Клуб Москва',
        clubAddress: 'ул. Ленина, 1',
        cityName: 'Москва',
      }
      const mockResponse = { data: mockPersonalInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.getPersonalInfo()

      expect(axiosInstance.get).toHaveBeenCalledWith('/profile/employee/personal-info')
      expect(result).toEqual(mockPersonalInfo)
      expect(result.firstName).toBe('Иван')
      expect(result.roles).toContain('ADMINISTRATOR')
      expect(result.roles).toHaveLength(2)
    })

    it('получает информацию о сотруднике без отчества', async () => {
      const mockPersonalInfo: EmployeePersonalInfoDto = {
        id: 2,
        firstName: 'Мария',
        middleName: null,
        lastName: 'Петрова',
        phone: '+79997654321',
        roles: ['OPERATOR'],
        clubName: 'VR Zone',
        clubAddress: 'ул. Пушкина, 10',
        cityName: 'Москва',
      }
      const mockResponse = { data: mockPersonalInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.getPersonalInfo()

      expect(result.middleName).toBeNull()
      expect(result.roles).toHaveLength(1)
    })

    it('обрабатывает ошибку при получении профиля (не авторизован)', async () => {
      const error = new Error('Unauthorized')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(profileApi.getPersonalInfo()).rejects.toThrow('Unauthorized')
    })

    it('обрабатывает ошибку сервера', async () => {
      const error = new Error('Internal server error')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(profileApi.getPersonalInfo()).rejects.toThrow('Internal server error')
    })
  })
})
