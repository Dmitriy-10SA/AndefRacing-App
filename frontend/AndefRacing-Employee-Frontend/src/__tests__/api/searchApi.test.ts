import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchApi } from '@/api/searchApi'
import axiosInstance from '@/lib/axios'
import type { ClubFullInfoDto } from '@/types'

vi.mock('@/lib/axios')

describe('searchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getClubFullInfo', () => {
    it('получает полную информацию о клубе', async () => {
      const clubId = 1
      const mockClubInfo: ClubFullInfoDto = {
        id: 1,
        name: 'VR Клуб Москва',
        address: 'ул. Ленина, 1',
        description: 'Лучший VR клуб в городе',
        cityName: 'Москва',
        cntEquipment: 10,
        isOpen: true,
        workSchedule: {
          mondayStart: '10:00',
          mondayEnd: '22:00',
          tuesdayStart: '10:00',
          tuesdayEnd: '22:00',
          wednesdayStart: '10:00',
          wednesdayEnd: '22:00',
          thursdayStart: '10:00',
          thursdayEnd: '22:00',
          fridayStart: '10:00',
          fridayEnd: '23:00',
          saturdayStart: '11:00',
          saturdayEnd: '23:00',
          sundayStart: '11:00',
          sundayEnd: '22:00',
        },
        prices: [
          { id: 1, durationMinutes: 30, value: 500 },
          { id: 2, durationMinutes: 60, value: 900 },
        ],
        games: [
          { id: 1, name: 'Beat Saber' },
          { id: 2, name: 'Half-Life: Alyx' },
        ],
        photoUrls: ['/files/clubs/1/photo1.jpg', '/files/clubs/1/photo2.jpg'],
      }
      const mockResponse = { data: mockClubInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getClubFullInfo(clubId)

      expect(axiosInstance.get).toHaveBeenCalledWith(`/search/clubs/${clubId}/full-info`)
      expect(result).toEqual(mockClubInfo)
      expect(result.name).toBe('VR Клуб Москва')
      expect(result.prices).toHaveLength(2)
      expect(result.games).toHaveLength(2)
    })

    it('получает информацию о закрытом клубе', async () => {
      const clubId = 2
      const mockClubInfo: ClubFullInfoDto = {
        id: 2,
        name: 'VR Клуб Питер',
        address: 'Невский проспект, 100',
        description: null,
        cityName: 'Санкт-Петербург',
        cntEquipment: 5,
        isOpen: false,
        workSchedule: null,
        prices: [],
        games: [],
        photoUrls: [],
      }
      const mockResponse = { data: mockClubInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getClubFullInfo(clubId)

      expect(result.isOpen).toBe(false)
      expect(result.workSchedule).toBeNull()
      expect(result.prices).toEqual([])
    })

    it('обрабатывает ошибку при получении информации о несуществующем клубе', async () => {
      const clubId = 999
      const error = new Error('Club not found')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(searchApi.getClubFullInfo(clubId)).rejects.toThrow('Club not found')
    })

    it('передает правильный clubId в URL', async () => {
      const clubId = 42
      const mockResponse = {
        data: {
          id: 42,
          name: 'Клуб',
          address: 'Адрес',
          description: null,
          cityName: 'Город',
          cntEquipment: 5,
          isOpen: true,
          workSchedule: null,
          prices: [],
          games: [],
          photoUrls: [],
        },
      }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      await searchApi.getClubFullInfo(clubId)

      expect(axiosInstance.get).toHaveBeenCalledWith('/search/clubs/42/full-info')
    })
  })
})
