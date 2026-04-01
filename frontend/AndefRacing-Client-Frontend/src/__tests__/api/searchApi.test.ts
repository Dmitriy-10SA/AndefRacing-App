import { describe, it, expect, vi, beforeEach } from 'vitest'
import { searchApi } from '@/api/searchApi'
import axiosInstance from '@/lib/axios'
import type {
  RegionShortDto,
  CityShortDto,
  PagedClubShortListDto,
  ClubFullInfoDto,
} from '@/types'

vi.mock('@/lib/axios')

describe('searchApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getRegions', () => {
    it('получает список регионов', async () => {
      const mockRegions: RegionShortDto[] = [
        { id: 1, name: 'Московская область' },
        { id: 2, name: 'Ленинградская область' },
        { id: 3, name: 'Краснодарский край' },
      ]
      const mockResponse = { data: mockRegions }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getRegions()

      expect(axiosInstance.get).toHaveBeenCalledWith('/search/regions')
      expect(result).toEqual(mockRegions)
      expect(result).toHaveLength(3)
    })

    it('возвращает пустой массив, если нет регионов', async () => {
      const mockResponse = { data: [] }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getRegions()

      expect(result).toEqual([])
    })

    it('обрабатывает ошибку при получении регионов', async () => {
      const error = new Error('Server error')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(searchApi.getRegions()).rejects.toThrow('Server error')
    })
  })

  describe('getCities', () => {
    it('получает список городов по региону', async () => {
      const regionId = 1
      const mockCities: CityShortDto[] = [
        { id: 1, name: 'Москва' },
        { id: 2, name: 'Подольск' },
        { id: 3, name: 'Химки' },
      ]
      const mockResponse = { data: mockCities }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getCities(regionId)

      expect(axiosInstance.get).toHaveBeenCalledWith(`/search/cities/${regionId}`)
      expect(result).toEqual(mockCities)
      expect(result).toHaveLength(3)
    })

    it('возвращает пустой массив для региона без городов', async () => {
      const mockResponse = { data: [] }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getCities(999)

      expect(result).toEqual([])
    })

    it('передает правильный regionId в URL', async () => {
      const regionId = 42
      const mockResponse = { data: [] }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      await searchApi.getCities(regionId)

      expect(axiosInstance.get).toHaveBeenCalledWith('/search/cities/42')
    })

    it('обрабатывает ошибку при получении городов', async () => {
      const error = new Error('Region not found')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(searchApi.getCities(999)).rejects.toThrow('Region not found')
    })
  })

  describe('getClubs', () => {
    it('получает список клубов в городе с пагинацией', async () => {
      const cityId = 1
      const mockClubs: PagedClubShortListDto = {
        totalElements: 25,
        totalPages: 3,
        pageNumber: 1,
        pageSize: 10,
        clubs: [
          {
            id: 1,
            name: 'VR Клуб Москва',
            address: 'ул. Ленина, 1',
            isOpen: true,
            minPrice: 500,
            photoUrl: '/files/clubs/1/photo1.jpg',
          },
          {
            id: 2,
            name: 'VR Zone',
            address: 'ул. Пушкина, 10',
            isOpen: true,
            minPrice: 600,
            photoUrl: null,
          },
        ],
      }
      const mockResponse = { data: mockClubs }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getClubs(cityId, 1, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith(`/search/clubs/${cityId}`, {
        params: { pageNumber: 1, pageSize: 10 },
      })
      expect(result).toEqual(mockClubs)
      expect(result.totalElements).toBe(25)
      expect(result.clubs).toHaveLength(2)
    })

    it('получает вторую страницу клубов', async () => {
      const mockClubs: PagedClubShortListDto = {
        totalElements: 25,
        totalPages: 3,
        pageNumber: 2,
        pageSize: 10,
        clubs: [],
      }
      const mockResponse = { data: mockClubs }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getClubs(1, 2, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/search/clubs/1', {
        params: { pageNumber: 2, pageSize: 10 },
      })
      expect(result.pageNumber).toBe(2)
    })

    it('возвращает пустой список для города без клубов', async () => {
      const mockClubs: PagedClubShortListDto = {
        totalElements: 0,
        totalPages: 0,
        pageNumber: 1,
        pageSize: 10,
        clubs: [],
      }
      const mockResponse = { data: mockClubs }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getClubs(999, 1, 10)

      expect(result.totalElements).toBe(0)
      expect(result.clubs).toEqual([])
    })

    it('обрабатывает ошибку при получении списка клубов', async () => {
      const error = new Error('City not found')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(searchApi.getClubs(999, 1, 10)).rejects.toThrow('City not found')
    })
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
      expect(result.photoUrls).toHaveLength(2)
    })

    it('получает информацию о клубе без описания', async () => {
      const mockClubInfo: ClubFullInfoDto = {
        id: 2,
        name: 'Клуб 2',
        address: 'Адрес',
        description: null,
        cityName: 'Город',
        cntEquipment: 5,
        isOpen: true,
        workSchedule: null,
        prices: [],
        games: [],
        photoUrls: [],
      }
      const mockResponse = { data: mockClubInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await searchApi.getClubFullInfo(2)

      expect(result.description).toBeNull()
      expect(result.workSchedule).toBeNull()
    })

    it('обрабатывает ошибку при получении информации о несуществующем клубе', async () => {
      const error = new Error('Club not found')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(searchApi.getClubFullInfo(999)).rejects.toThrow('Club not found')
    })
  })
})
