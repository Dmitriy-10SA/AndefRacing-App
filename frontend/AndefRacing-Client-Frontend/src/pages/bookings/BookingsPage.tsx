import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { bookingApi } from '../../api/bookingApi'
import { BookingStatus } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Pagination from '../../components/Pagination'
import { formatDateTime } from '../../utils/formatters'

// Получить текущую дату в формате YYYY-MM-DD
const getCurrentDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Добавить/вычесть дни из даты
const addDaysToDate = (dateStr: string, days: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)

  const newYear = date.getFullYear()
  const newMonth = String(date.getMonth() + 1).padStart(2, '0')
  const newDay = String(date.getDate()).padStart(2, '0')
  return `${newYear}-${newMonth}-${newDay}`
}

const BookingsPage = () => {
  const currentDate = getCurrentDate()
  const [startDate, setStartDate] = useState(currentDate)
  const [endDate, setEndDate] = useState(addDaysToDate(currentDate, 7))
  const [currentPage, setCurrentPage] = useState(0)
  const pageSize = 5

  const handleStartDateChange = (newStartDate: string) => {
    setStartDate(newStartDate)
    setCurrentPage(0) // Сбрасываем на первую страницу при изменении фильтра
    // Если новая дата начала позже даты окончания, сдвигаем дату окончания
    if (newStartDate > endDate) {
      setEndDate(newStartDate)
    }
  }

  const handleEndDateChange = (newEndDate: string) => {
    // Не позволяем установить дату окончания раньше даты начала
    if (newEndDate >= startDate) {
      setEndDate(newEndDate)
      setCurrentPage(0) // Сбрасываем на первую страницу при изменении фильтра
    }
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', startDate, endDate, currentPage, pageSize],
    queryFn: () => bookingApi.getBookings(startDate, endDate, currentPage, pageSize),
  })

  const bookings = data?.content || []
  const pageInfo = data?.pageInfo

  const getStatusText = (status: BookingStatus) => {
    const statusMap = {
      [BookingStatus.PENDING_PAYMENT]: 'В ожидании оплаты',
      [BookingStatus.PAID]: 'Подтверждено',
      [BookingStatus.CANCELLED]: 'Отменено'
    }
    return statusMap[status]
  }

  const getStatusColor = (status: BookingStatus) => {
    const colorMap = {
      [BookingStatus.PENDING_PAYMENT]: 'bg-blue-100 text-blue-800',
      [BookingStatus.PAID]: 'bg-green-100 text-green-800',
      [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800'
    }
    return colorMap[status]
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Ошибка загрузки бронирований" />

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Мои бронирования</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Дата начала</label>
            <input
              type="date"
              className="input"
              value={startDate}
              max={endDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Дата окончания</label>
            <input
              type="date"
              className="input"
              value={endDate}
              min={startDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {bookings && bookings.length > 0 ? (
        <>
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Link
                key={booking.id}
                to={`/bookings/${booking.club.id}/${booking.id}`}
                className="card hover:shadow-lg transition-shadow block"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">{booking.club.name}</h3>
                    <p className="text-gray-600">
                      {booking.city.name}, {booking.city.region.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Начало</p>
                    <p className="font-semibold">
                      {formatDateTime(booking.startDateTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Окончание</p>
                    <p className="font-semibold">
                      {formatDateTime(booking.endDateTime)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-gray-600">{booking.club.address}</p>
                </div>
              </Link>
            ))}
          </div>

          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={pageInfo.totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">У вас пока нет бронирований</p>
          <Link to="/search" className="btn-primary">
            Найти клубы
          </Link>
        </div>
      )}
    </div>
  )
}

export default BookingsPage
