import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportsApi } from '@/api/reportsApi'
import axiosInstance from '@/lib/axios'
import type { BookingStatisticsDto, FinancialStatisticsDto } from '@/types'

vi.mock('@/lib/axios')

describe('reportsApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getBookingStatistics', () => {
    it('получает статистику бронирований за период', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'
      const mockStatistics: BookingStatisticsDto = {
        totalBookings: 150,
        completedBookings: 120,
        canceledBookings: 20,
        activeBookings: 10,
        averageBookingsPerDay: 5,
        mostPopularDuration: 60,
        mostPopularEquipmentCount: 2,
      }
      const mockResponse = { data: mockStatistics }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await reportsApi.getBookingStatistics(startDate, endDate)

      expect(axiosInstance.get).toHaveBeenCalledWith('/reports/booking-statistics', {
        params: { startDate, endDate },
      })
      expect(result).toEqual(mockStatistics)
      expect(result.totalBookings).toBe(150)
      expect(result.completedBookings).toBe(120)
    })

    it('получает статистику с нулевыми значениями', async () => {
      const mockStatistics: BookingStatisticsDto = {
        totalBookings: 0,
        completedBookings: 0,
        canceledBookings: 0,
        activeBookings: 0,
        averageBookingsPerDay: 0,
        mostPopularDuration: null,
        mostPopularEquipmentCount: null,
      }
      const mockResponse = { data: mockStatistics }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await reportsApi.getBookingStatistics('2024-02-01', '2024-02-28')

      expect(result.totalBookings).toBe(0)
      expect(result.mostPopularDuration).toBeNull()
    })

    it('получает статистику за разные периоды', async () => {
      const mockResponse = {
        data: {
          totalBookings: 50,
          completedBookings: 45,
          canceledBookings: 5,
          activeBookings: 0,
          averageBookingsPerDay: 1.6,
          mostPopularDuration: 30,
          mostPopularEquipmentCount: 1,
        },
      }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      await reportsApi.getBookingStatistics('2024-06-01', '2024-06-30')

      expect(axiosInstance.get).toHaveBeenCalledWith('/reports/booking-statistics', {
        params: { startDate: '2024-06-01', endDate: '2024-06-30' },
      })
    })

    it('обрабатывает ошибку при получении статистики', async () => {
      const error = new Error('Unauthorized')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(
        reportsApi.getBookingStatistics('2024-01-01', '2024-01-31')
      ).rejects.toThrow('Unauthorized')
    })
  })

  describe('getFinancialStatistics', () => {
    it('получает финансовую статистику за период', async () => {
      const startDate = '2024-01-01'
      const endDate = '2024-01-31'
      const mockStatistics: FinancialStatisticsDto = {
        totalRevenue: 150000,
        paidRevenue: 140000,
        unpaidRevenue: 10000,
        averageRevenuePerBooking: 1000,
        averageRevenuePerDay: 5000,
        paidBookingsCount: 140,
        unpaidBookingsCount: 10,
      }
      const mockResponse = { data: mockStatistics }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await reportsApi.getFinancialStatistics(startDate, endDate)

      expect(axiosInstance.get).toHaveBeenCalledWith('/reports/financial-statistics', {
        params: { startDate, endDate },
      })
      expect(result).toEqual(mockStatistics)
      expect(result.totalRevenue).toBe(150000)
      expect(result.paidRevenue).toBe(140000)
    })

    it('получает статистику с нулевой выручкой', async () => {
      const mockStatistics: FinancialStatisticsDto = {
        totalRevenue: 0,
        paidRevenue: 0,
        unpaidRevenue: 0,
        averageRevenuePerBooking: 0,
        averageRevenuePerDay: 0,
        paidBookingsCount: 0,
        unpaidBookingsCount: 0,
      }
      const mockResponse = { data: mockStatistics }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      const result = await reportsApi.getFinancialStatistics('2024-02-01', '2024-02-28')

      expect(result.totalRevenue).toBe(0)
      expect(result.paidBookingsCount).toBe(0)
    })

    it('получает статистику за короткий период', async () => {
      const mockResponse = {
        data: {
          totalRevenue: 5000,
          paidRevenue: 5000,
          unpaidRevenue: 0,
          averageRevenuePerBooking: 1000,
          averageRevenuePerDay: 5000,
          paidBookingsCount: 5,
          unpaidBookingsCount: 0,
        },
      }

      vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

      await reportsApi.getFinancialStatistics('2024-03-15', '2024-03-15')

      expect(axiosInstance.get).toHaveBeenCalledWith('/reports/financial-statistics', {
        params: { startDate: '2024-03-15', endDate: '2024-03-15' },
      })
    })

    it('обрабатывает ошибку при получении финансовой статистики', async () => {
      const error = new Error('Access denied')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(
        reportsApi.getFinancialStatistics('2024-01-01', '2024-01-31')
      ).rejects.toThrow('Access denied')
    })

    it('обрабатывает некорректный диапазон дат', async () => {
      const error = new Error('Invalid date range')

      vi.mocked(axiosInstance.get).mockRejectedValueOnce(error)

      await expect(
        reportsApi.getFinancialStatistics('2024-01-31', '2024-01-01')
      ).rejects.toThrow('Invalid date range')
    })
  })
})
