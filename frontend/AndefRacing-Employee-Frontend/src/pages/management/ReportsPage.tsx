import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/reportsApi'
import { usePageStateStore } from '@/stores/pageStateStore'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { formatPrice, formatDate } from '@/utils/formatters'

const ReportsPage = () => {
  const { reportsPage, setReportsPageState } = usePageStateStore()
  const { reportType, startDate, endDate } = reportsPage
  const [shouldFetch, setShouldFetch] = useState(false)

  const { data: bookingStats, isLoading: bookingLoading, error: bookingError } = useQuery({
    queryKey: ['bookingStats', startDate, endDate],
    queryFn: () => reportsApi.getBookingStatistics(startDate, endDate),
    enabled: shouldFetch && reportType === 'booking',
  })

  const { data: financialStats, isLoading: financialLoading, error: financialError } = useQuery({
    queryKey: ['financialStats', startDate, endDate],
    queryFn: () => reportsApi.getFinancialStatistics(startDate, endDate),
    enabled: shouldFetch && reportType === 'financial',
  })

  const handleGenerateReport = () => {
    setShouldFetch(true)
  }

  const isLoading = bookingLoading || financialLoading
  const error = bookingError || financialError

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Отчеты</h1>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Параметры отчета</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="label">Тип отчета</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportsPageState({ reportType: e.target.value as 'booking' | 'financial' })
                setShouldFetch(false)
              }}
              className="input"
            >
              <option value="booking">Статистика бронирований</option>
              <option value="financial">Финансовая статистика</option>
            </select>
          </div>
          <div>
            <label className="label">Дата начала</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setReportsPageState({ startDate: e.target.value })
                setShouldFetch(false)
              }}
              max={endDate}
              className="input"
            />
          </div>
          <div>
            <label className="label">Дата окончания</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setReportsPageState({ endDate: e.target.value })
                setShouldFetch(false)
              }}
              min={startDate}
              className="input"
            />
          </div>
        </div>
        <button onClick={handleGenerateReport} className="btn-primary mt-4 w-full sm:w-auto">
          Сформировать отчет
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorMessage message="Ошибка загрузки отчета" />}

      {shouldFetch && reportType === 'booking' && bookingStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="card">
              <h3 className="text-xs sm:text-sm text-gray-600 mb-2">Всего бронирований</h3>
              <p className="text-2xl sm:text-3xl font-bold text-primary-600">
                {bookingStats.bookingsCount}
              </p>
            </div>
            <div className="card">
              <h3 className="text-xs sm:text-sm text-gray-600 mb-2">Процент отмен</h3>
              <p className="text-2xl sm:text-3xl font-bold text-red-600">
                {bookingStats.cancellationsPercent.toFixed(1)}%
              </p>
            </div>
            <div className="card col-span-2 lg:col-span-1">
              <h3 className="text-xs sm:text-sm text-gray-600 mb-2">Период</h3>
              <p className="text-sm sm:text-lg font-semibold">
                {formatDate(bookingStats.startDate)} - {formatDate(bookingStats.endDate)}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Бронирования по дням</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Дата</th>
                    <th className="text-right py-2 px-4">Количество бронирований</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingStats.dateAndBookingsCountDtoList.map((item) => (
                    <tr key={item.date} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{formatDate(item.date)}</td>
                      <td className="text-right py-2 px-4 font-semibold">
                        {item.bookingsCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {shouldFetch && reportType === 'financial' && financialStats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="card">
              <h3 className="text-xs sm:text-sm text-gray-600 mb-2">Общая выручка</h3>
              <p className="text-xl sm:text-3xl font-bold text-green-600">
                {formatPrice(financialStats.totalRevenue)}
              </p>
            </div>
            <div className="card">
              <h3 className="text-xs sm:text-sm text-gray-600 mb-2">Средний чек</h3>
              <p className="text-xl sm:text-3xl font-bold text-primary-600">
                {formatPrice(financialStats.averageReceipt)}
              </p>
            </div>
            <div className="card col-span-2 lg:col-span-1">
              <h3 className="text-xs sm:text-sm text-gray-600 mb-2">Период</h3>
              <p className="text-sm sm:text-lg font-semibold">
                {formatDate(financialStats.startDate)} - {formatDate(financialStats.endDate)}
              </p>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Выручка по дням</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Дата</th>
                    <th className="text-right py-2 px-4">Выручка</th>
                  </tr>
                </thead>
                <tbody>
                  {financialStats.dateAndTotalRevenues.map((item) => (
                    <tr key={item.date} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-4">{formatDate(item.date)}</td>
                      <td className="text-right py-2 px-4 font-semibold text-green-600">
                        {formatPrice(item.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportsPage
