import { describe, it, expect, vi, beforeEach } from 'vitest'
import { bookingApi } from '@/api/bookingApi'
import axiosInstance from '@/lib/axios'
import type {
  FreeBookingSlotDto,
  EmployeeMakeBookingDto,
  EmployeeBookingFullInfoDto,
  PagedEmployeeBookingShortListDto,
} from '@/types'

vi.mock('@/lib/axios')

describe('bookingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getFreeSlots', () => {
    it('получает свободные слоты для бронирования', async () => {
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
      ]
      const mockResponse = { data: mockSlots }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getFreeSlots(
        params.durationMinutes,
        params.cntEquipment,
        params.date,
        params.userCurrentDate,
        params.userCurrentTime
      )

      expect(axiosInstance.get).toHaveBeenCalledWith('/bookings/employee/free-slots', {
        params,
      })
      expect(result).toEqual(mockSlots)
      expect(result).toHaveLength(2)
    })

    it('возвращает пустой массив, если нет свободных слотов', async () => {
      const mockResponse = { data: [] }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getFreeSlots(60, 2, '2024-01-15', '2024-01-14', '14:30')

      expect(result).toEqual([])
    })

    it('обрабатывает ошибку при получении слотов', async () => {
      const error = new Error('Server error')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(
        bookingApi.getFreeSlots(60, 2, '2024-01-15', '2024-01-14', '14:30')
      ).rejects.toThrow('Server error')
    })
  })

  describe('makeBooking', () => {
    it('создает новое бронирование', async () => {
      const bookingData: EmployeeMakeBookingDto = {
        clientPhone: '+79991234567',
        date: '2024-01-15',
        startTime: '14:00',
        durationMinutes: 60,
        cntEquipment: 2,
      }

      vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

      await bookingApi.makeBooking(bookingData)

      expect(axiosInstance.post).toHaveBeenCalledWith(
        '/bookings/employee/make-booking',
        bookingData
      )
    })

    it('обрабатывает ошибку при создании бронирования', async () => {
      const bookingData: EmployeeMakeBookingDto = {
        clientPhone: '+79991234567',
        date: '2024-01-15',
        startTime: '14:00',
        durationMinutes: 60,
        cntEquipment: 2,
      }
      const error = new Error('Slot already taken')

      vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

      await expect(bookingApi.makeBooking(bookingData)).rejects.toThrow('Slot already taken')
    })
  })

  describe('getBookings', () => {
    it('получает список бронирований с пагинацией', async () => {
      const mockBookings: PagedEmployeeBookingShortListDto = {
        totalElements: 25,
        totalPages: 3,
        pageNumber: 1,
        pageSize: 10,
        bookings: [
          {
            id: 1,
            date: '2024-01-15',
            startTime: '14:00',
            endTime: '15:00',
            status: 'ACTIVE',
            clientPhone: '+79991234567',
            clientFullName: 'Иванов Иван Иванович',
          },
        ],
      }
      const mockResponse = { data: mockBookings }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getBookings('2024-01-01', '2024-01-31', null, 1, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/bookings/employee', {
        params: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          pageNumber: 1,
          pageSize: 10,
        },
      })
      expect(result).toEqual(mockBookings)
      expect(result.totalElements).toBe(25)
    })

    it('получает бронирования с фильтром по телефону клиента', async () => {
      const mockResponse = {
        data: {
          totalElements: 5,
          totalPages: 1,
          pageNumber: 1,
          pageSize: 10,
          bookings: [],
        },
      }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      await bookingApi.getBookings('2024-01-01', '2024-01-31', '+79991234567', 1, 10)

      expect(axiosInstance.get).toHaveBeenCalledWith('/bookings/employee', {
        params: {
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          clientPhone: '+79991234567',
          pageNumber: 1,
          pageSize: 10,
        },
      })
    })

    it('обрабатывает ошибку при получении списка бронирований', async () => {
      const error = new Error('Server error')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(
        bookingApi.getBookings('2024-01-01', '2024-01-31', null, 1, 10)
      ).rejects.toThrow('Server error')
    })
  })

  describe('getBookingFullInfo', () => {
    it('получает полную информацию о бронировании', async () => {
      const mockBookingInfo: EmployeeBookingFullInfoDto = {
        id: 1,
        date: '2024-01-15',
        startTime: '14:00',
        endTime: '15:00',
        status: 'ACTIVE',
        cntEquipment: 2,
        price: 1200,
        isPaid: false,
        clientPhone: '+79991234567',
        clientFullName: 'Иванов Иван Иванович',
      }
      const mockResponse = { data: mockBookingInfo }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await bookingApi.getBookingFullInfo(1)

      expect(axiosInstance.get).toHaveBeenCalledWith('/bookings/employee/full-info/1')
      expect(result).toEqual(mockBookingInfo)
      expect(result.id).toBe(1)
      expect(result.isPaid).toBe(false)
    })

    it('обрабатывает ошибку при получении информации о бронировании', async () => {
      const error = new Error('Booking not found')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(bookingApi.getBookingFullInfo(999)).rejects.toThrow('Booking not found')
    })
  })

  describe('confirmBookingPayment', () => {
    it('подтверждает оплату бронирования', async () => {
      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

      await bookingApi.confirmBookingPayment(1)

      expect(axiosInstance.patch).toHaveBeenCalledWith(
        '/bookings/employee/confirm-booking-payment/1'
      )
    })

    it('обрабатывает ошибку при подтверждении оплаты', async () => {
      const error = new Error('Cannot confirm payment')

      vi.mocked(axiosInstance.patch).mockRejectedValueOnce(error)

      await expect(bookingApi.confirmBookingPayment(1)).rejects.toThrow('Cannot confirm payment')
    })
  })

  describe('cancelBooking', () => {
    it('отменяет бронирование', async () => {
      vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

      await bookingApi.cancelBooking(1)

      expect(axiosInstance.patch).toHaveBeenCalledWith('/bookings/employee/cancel/1')
    })

    it('обрабатывает ошибку при отмене бронирования', async () => {
      const error = new Error('Cannot cancel booking')

      vi.mocked(axiosInstance.patch).mockRejectedValueOnce(error)

      await expect(bookingApi.cancelBooking(1)).rejects.toThrow('Cannot cancel booking')
    })
  })
})
