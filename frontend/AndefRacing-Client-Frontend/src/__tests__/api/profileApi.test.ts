import { describe, it, expect, vi, beforeEach } from 'vitest'
import { profileApi } from '@/api/profileApi'
import axiosInstance from '@/lib/axios'
import type {
  ClientPersonalInfoDto,
  ClientChangePersonalInfoDto,
  PagedFavoriteClubShortListDto,
} from '@/types'

vi.mock('@/lib/axios')

describe('profileApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPersonalInfo', () => {
    it('получает персональную информацию клиента', async () => {
      const mockPersonalInfo: ClientPersonalInfoDto = {
        id: 1,
        firstName: 'Иван',
        middleName: 'Иванович',
        lastName: 'Иванов',
        phone: '+79991234567',
      }
      const mockResponse = { data: mockPersonalInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.getPersonalInfo()

      expect(axiosInstance.get).toHaveBeenCalledWith('/profile/client/personal-info')
      expect(result).toEqual(mockPersonalInfo)
      expect(result.firstName).toBe('Иван')
      expect(result.phone).toBe('+79991234567')
    })

    it('получает информацию клиента без отчества', async () => {
      const mockPersonalInfo: ClientPersonalInfoDto = {
        id: 2,
        firstName: 'Мария',
        middleName: null,
        lastName: 'Петрова',
        phone: '+79997654321',
      }
      const mockResponse = { data: mockPersonalInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.getPersonalInfo()

      expect(result.middleName).toBeNull()
    })

    it('обрабатывает ошибку при получении профиля', async () => {
      const error = new Error('Unauthorized')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(profileApi.getPersonalInfo()).rejects.toThrow('Unauthorized')
    })
  })

  describe('changePersonalInfo', () => {
    it('изменяет персональную информацию клиента', async () => {
      const changeData: ClientChangePersonalInfoDto = {
        firstName: 'Петр',
        middleName: 'Петрович',
        lastName: 'Петров',
      }

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

      await profileApi.changePersonalInfo(changeData)

      expect(axiosInstance.patch).toHaveBeenCalledWith(
        '/profile/client/change-personal-info',
        changeData
      )
    })

    it('изменяет информацию без отчества', async () => {
      const changeData: ClientChangePersonalInfoDto = {
        firstName: 'Анна',
        middleName: null,
        lastName: 'Сидорова',
      }

      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

      await profileApi.changePersonalInfo(changeData)

      expect(axiosInstance.patch).toHaveBeenCalledWith(
        '/profile/client/change-personal-info',
        changeData
      )
    })

    it('обрабатывает ошибку при изменении информации', async () => {
      const changeData: ClientChangePersonalInfoDto = {
        firstName: 'Петр',
        middleName: null,
        lastName: 'Петров',
      }
      const error = new Error('Validation error')

      vi.mocked(axiosInstance.patch).mockRejectedValueOnce(error)

      await expect(profileApi.changePersonalInfo(changeData)).rejects.toThrow('Validation error')
    })
  })

  describe('getFavoriteClubs', () => {
    it('получает список избранных клубов с пагинацией', async () => {
      const mockFavorites: PagedFavoriteClubShortListDto = {
        totalElements: 5,
        totalPages: 1,
        pageNumber: 1,
        pageSize: 10,
        clubs: [
          {
            id: 1,
            name: 'VR Клуб Москва',
            address: 'ул. Ленина, 1',
            cityName: 'Москва',
            isOpen: true,
            minPrice: 500,
            photoUrl: '/files/clubs/1/photo1.jpg',
          },
          {
            id: 2,
            name: 'VR Zone',
            address: 'ул. Пушкина, 10',
            cityName: 'Москва',
            isOpen: false,
            minPrice: 600,
            photoUrl: null,
          },
        ],
      }
      const mockResponse = { data: mockFavorites }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.getFavoriteClubs(1, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/profile/client/favorite-clubs', {
        params: { pageNumber: 1, pageSize: 10 },
      })
      expect(result).toEqual(mockFavorites)
      expect(result.clubs).toHaveLength(2)
    })

    it('возвращает пустой список, если нет избранных', async () => {
      const mockFavorites: PagedFavoriteClubShortListDto = {
        totalElements: 0,
        totalPages: 0,
        pageNumber: 1,
        pageSize: 10,
        clubs: [],
      }
      const mockResponse = { data: mockFavorites }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.getFavoriteClubs(1, 10)

      expect(result.clubs).toEqual([])
      expect(result.totalElements).toBe(0)
    })

    it('получает вторую страницу избранных', async () => {
      const mockResponse = {
        data: {
          totalElements: 15,
          totalPages: 2,
          pageNumber: 2,
          pageSize: 10,
          clubs: [],
        },
      }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.getFavoriteClubs(2, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/profile/client/favorite-clubs', {
        params: { pageNumber: 2, pageSize: 10 },
      })
      expect(result.pageNumber).toBe(2)
    })

    it('обрабатывает ошибку при получении избранных', async () => {
      const error = new Error('Unauthorized')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(profileApi.getFavoriteClubs(1, 10)).rejects.toThrow('Unauthorized')
    })
  })

  describe('addFavoriteClub', () => {
    it('добавляет клуб в избранное', async () => {
      const clubId = 1

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

      await profileApi.addFavoriteClub(clubId)

      expect(axiosInstance.post).toHaveBeenCalledWith(`/profile/client/favorite-clubs/${clubId}`)
    })

    it('передает правильный clubId в URL', async () => {
      const clubId = 42

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

      await profileApi.addFavoriteClub(clubId)

      expect(axiosInstance.post).toHaveBeenCalledWith('/profile/client/favorite-clubs/42')
    })

    it('обрабатывает ошибку при добавлении в избранное', async () => {
      const error = new Error('Club already in favorites')

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

      await expect(profileApi.addFavoriteClub(1)).rejects.toThrow('Club already in favorites')
    })
  })

  describe('deleteFavoriteClub', () => {
    it('удаляет клуб из избранного', async () => {
      const clubId = 1

      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({})

      await profileApi.deleteFavoriteClub(clubId)

      expect(axiosInstance.delete).toHaveBeenCalledWith(
        `/profile/client/favorite-clubs/${clubId}`
      )
    })

    it('передает правильный clubId в URL', async () => {
      const clubId = 42

      vi.mocked(axiosInstance.delete).mockResolvedValueOnce({})

      await profileApi.deleteFavoriteClub(clubId)

      expect(axiosInstance.delete).toHaveBeenCalledWith('/profile/client/favorite-clubs/42')
    })

    it('обрабатывает ошибку при удалении из избранного', async () => {
      const error = new Error('Club not in favorites')

      vi.mocked(axiosInstance.delete).mockRejectedValueOnce(error)

      await expect(profileApi.deleteFavoriteClub(1)).rejects.toThrow('Club not in favorites')
    })
  })

  describe('isClubFavorite', () => {
    it('проверяет, что клуб в избранном', async () => {
      const clubId = 1
      const mockResponse = { data: true }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.isClubFavorite(clubId)

      expect(axiosInstance.get).toHaveBeenCalledWith(
        `/profile/client/favorite-clubs/${clubId}/check`
      )
      expect(result).toBe(true)
    })

    it('проверяет, что клуб не в избранном', async () => {
      const clubId = 2
      const mockResponse = { data: false }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await profileApi.isClubFavorite(clubId)

      expect(result).toBe(false)
    })

    it('передает правильный clubId в URL', async () => {
      const clubId = 42
      const mockResponse = { data: true }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      await profileApi.isClubFavorite(clubId)

      expect(axiosInstance.get).toHaveBeenCalledWith('/profile/client/favorite-clubs/42/check')
    })

    it('обрабатывает ошибку при проверке', async () => {
      const error = new Error('Unauthorized')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(profileApi.isClubFavorite(1)).rejects.toThrow('Unauthorized')
    })
  })
})
