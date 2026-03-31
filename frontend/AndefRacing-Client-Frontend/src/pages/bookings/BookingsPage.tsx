import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { bookingApi } from '../../api/bookingApi'
import { BookingStatus } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Pagination from '../../components/Pagination'
import { formatDateTime } from '../../utils/formatters'
import { usePageStateStore } from '../../stores/pageStateStore'

const BookingsPage = () => {
  const { bookingsPage, setBookingsPageState } = usePageStateStore()
  const { startDate, endDate, currentPage } = bookingsPage
  const pageSize = 5

  const handleStartDateChange = (newStartDate: string) => {
    // Если новая дата начала позже даты окончания, сдвигаем дату окончания
    if (newStartDate > endDate) {
      setBookingsPageState({ startDate: newStartDate, endDate: newStartDate, currentPage: 0 })
    } else {
      setBookingsPageState({ startDate: newStartDate, currentPage: 0 })
    }
  }

  const handleEndDateChange = (newEndDate: string) => {
    // Не позволяем установить дату окончания раньше даты начала
    if (newEndDate >= startDate) {
      setBookingsPageState({ endDate: newEndDate, currentPage: 0 })
    }
  }

  const handlePageChange = (page: number) => {
    setBookingsPageState({ currentPage: page })
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
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Мои бронирования</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold mb-1">{booking.club.name}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {booking.city.name}, {booking.city.region.name}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-semibold self-start ${getStatusColor(booking.status)}`}>
                    {getStatusText(booking.status)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Начало</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {formatDateTime(booking.startDateTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Окончание</p>
                    <p className="font-semibold text-sm sm:text-base">
                      {formatDateTime(booking.endDateTime)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 sm:mt-4">
                  <p className="text-gray-600 text-sm sm:text-base">{booking.club.address}</p>
                </div>
              </Link>
            ))}
          </div>

          {pageInfo && pageInfo.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={pageInfo.totalPages}
                onPageChange={handlePageChange}
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
