import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bookingApi } from '@/api/bookingApi'
import axiosInstance from '@/lib/axios'
import type {
  FreeBookingSlotDto,
  ClientMakeBookingDto,
  ClientBookingFullInfoDto,
  PagedClientBookingShortListDto,
} from '@/types'

vi.mock('@/lib/axios')

describe('bookingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFreeSlots', () => {
    it('получает свободные слоты для бронирования в клубе', async () => {
      const clubId = 1
      const params = {
        durationMinutes: 60,
        cntEquipment: 2,
        date: '2024-01-15',
        userCurrentDate: '2024-01-14',
        userCurrentTime: '14:30',
      }
      const mockSlots: FreeBookingSlotDto[] = [
        { startTime: '10:00', endTime: '11:00', price: 1000 },
        { startTime: '14:00', endTime: '15:00', price: 1200 },
        { startTime: '18:00', endTime: '19:00', price: 1500 },
      ]
      const mockResponse = { data: mockSlots }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getFreeSlots(
        clubId,
        params.durationMinutes,
        params.cntEquipment,
        params.date,
        params.userCurrentDate,
        params.userCurrentTime
      )

      expect(axiosInstance.get).toHaveBeenCalledWith(`/bookings/client/free-slots/${clubId}`, {
        params,
      })
      expect(result).toEqual(mockSlots)
      expect(result).toHaveLength(3)
    })

    it('возвращает пустой массив, если нет свободных слотов', async () => {
      const mockResponse = { data: [] }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getFreeSlots(1, 60, 2, '2024-01-15', '2024-01-14', '14:30')

      expect(result).toEqual([])
    })

    it('обрабатывает ошибку при получении слотов', async () => {
      const error = new Error('Club not found')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(
        bookingApi.getFreeSlots(999, 60, 2, '2024-01-15', '2024-01-14', '14:30')
      ).rejects.toThrow('Club not found')
    })
  })

  describe('makeBooking', () => {
    it('создает новое бронирование в клубе', async () => {
      const clubId = 1
      const bookingData: ClientMakeBookingDto = {
        date: '2024-01-15',
        startTime: '14:00',
        durationMinutes: 60,
        cntEquipment: 2,
      }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

      await bookingApi.makeBooking(clubId, bookingData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        `/bookings/client/make-booking/${clubId}`,
        bookingData
      )
    })

    it('обрабатывает ошибку при создании бронирования (слот занят)', async () => {
      const clubId = 1
      const bookingData: ClientMakeBookingDto = {
        date: '2024-01-15',
        startTime: '14:00',
        durationMinutes: 60,
        cntEquipment: 2,
      }
      const error = new Error('Slot already taken')

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

      await expect(bookingApi.makeBooking(clubId, bookingData)).rejects.toThrow(
        'Slot already taken'
      )
    })

    it('передает правильный clubId в URL', async () => {
      const clubId = 42
      const bookingData: ClientMakeBookingDto = {
        date: '2024-01-15',
        startTime: '14:00',
        durationMinutes: 60,
        cntEquipment: 2,
      }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

      await bookingApi.makeBooking(clubId, bookingData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/bookings/client/make-booking/42',
        bookingData
      )
    })
  })

  describe('getBookings', () => {
    it('получает список бронирований клиента с пагинацией', async () => {
      const mockBookings: PagedClientBookingShortListDto = {
        totalElements: 15,
        totalPages: 2,
        pageNumber: 1,
        pageSize: 10,
        bookings: [
          {
            id: 1,
            date: '2024-01-15',
            startTime: '14:00',
            endTime: '15:00',
            status: 'ACTIVE',
            clubId: 1,
            clubName: 'VR Клуб Москва',
            clubAddress: 'ул. Ленина, 1',
          },
        ],
      }
      const mockResponse = { data: mockBookings }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getBookings('2024-01-01', '2024-01-31', 1, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/bookings/client', {
        params: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          pageNumber: 1,
          pageSize: 10,
        },
      })
      expect(result).toEqual(mockBookings)
      expect(result.totalElements).toBe(15)
      expect(result.bookings).toHaveLength(1)
    })

    it('получает бронирования для разных дат', async () => {
      const mockResponse = {
        data: {
          totalElements: 0,
          totalPages: 0,
          pageNumber: 1,
          pageSize: 10,
          bookings: [],
        },
      }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getBookings('2024-06-01', '2024-06-30', 1, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/bookings/client', {
        params: {
          startDate: '2024-06-01',
          endDate: '2024-06-30',
          pageNumber: 1,
          pageSize: 10,
        },
      })
      expect(result.bookings).toEqual([])
    })

    it('обрабатывает ошибку при получении списка бронирований', async () => {
      const error = new Error('Unauthorized')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(bookingApi.getBookings('2024-01-01', '2024-01-31', 1, 10)).rejects.toThrow(
        'Unauthorized'
      )
    })
  })

  describe('getBookingFullInfo', () => {
    it('получает полную информацию о бронировании', async () => {
      const clubId = 1
      const bookingId = 5
      const mockBookingInfo: ClientBookingFullInfoDto = {
        id: 5,
        date: '2024-01-15',
        startTime: '14:00',
        endTime: '15:00',
        status: 'ACTIVE',
        cntEquipment: 2,
        price: 1200,
        isPaid: true,
        clubId: 1,
        clubName: 'VR Клуб Москва',
        clubAddress: 'ул. Ленина, 1',
      }
      const mockResponse = { data: mockBookingInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getBookingFullInfo(clubId, bookingId)

      expect(axiosInstance.get).toHaveBeenCalledWith(`/bookings/client/${clubId}/${bookingId}`)
      expect(result).toEqual(mockBookingInfo)
      expect(result.id).toBe(5)
      expect(result.isPaid).toBe(true)
      expect(result.clubName).toBe('VR Клуб Москва')
    })

    it('передает правильные параметры в URL', async () => {
      const clubId = 42
      const bookingId = 100
      const mockResponse = {
        data: {
          id: 100,
          date: '2024-01-15',
          startTime: '14:00',
          endTime: '15:00',
          status: 'ACTIVE',
          cntEquipment: 2,
          price: 1200,
          isPaid: false,
          clubId: 42,
          clubName: 'Клуб',
          clubAddress: 'Адрес',
        },
      }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      await bookingApi.getBookingFullInfo(clubId, bookingId)

      expect(axiosInstance.get).toHaveBeenCalledWith('/bookings/client/42/100')
    })

    it('обрабатывает ошибку при получении информации о бронировании', async () => {
      const error = new Error('Booking not found')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(bookingApi.getBookingFullInfo(1, 999)).rejects.toThrow('Booking not found')
    })
  })
})
