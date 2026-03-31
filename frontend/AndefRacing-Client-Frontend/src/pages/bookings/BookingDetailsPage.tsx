import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { bookingApi } from '../../api/bookingApi'
import { BookingStatus } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import { formatDateTime } from '../../utils/formatters'

// Вычислить разницу в часах между двумя датами
const calculateHoursDifference = (startDateTime: string, endDateTime: string): number => {
  // Парсим ISO строки напрямую
  const parseDateTime = (dateTimeStr: string): number => {
    const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/)
    if (!match) return 0

    const [, year, month, day, hours, minutes, seconds] = match
    // Создаем дату из компонентов
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    )
    return date.getTime()
  }

  const startMs = parseDateTime(startDateTime)
  const endMs = parseDateTime(endDateTime)

  return Math.floor((startMs - endMs) / (1000 * 60 * 60))
}

const BookingDetailsPage = () => {
  const { clubId, bookingId } = useParams<{ clubId: string; bookingId: string }>()
  const navigate = useNavigate()

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', clubId, bookingId],
    queryFn: () => bookingApi.getBookingFullInfo(Number(clubId), Number(bookingId)),
  })

  const getStatusText = (status: BookingStatus) => {
    const statusMap = {
      [BookingStatus.PENDING_PAYMENT]: 'В ожидании оплаты',
      [BookingStatus.PAID]: 'Подтверждено',
      [BookingStatus.CANCELLED]: 'Отменено',
    }
    return statusMap[status]
  }

  const getStatusColor = (status: BookingStatus) => {
    const colorMap = {
      [BookingStatus.PENDING_PAYMENT]: 'bg-blue-100 text-blue-800',
      [BookingStatus.PAID]: 'bg-green-100 text-green-800',
      [BookingStatus.CANCELLED]: 'bg-red-100 text-red-800',
    }
    return colorMap[status]
  }

  const canCancel = (startDateTime: string) => {
    // Получаем текущую дату и время
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const currentDateTime = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`

    const hoursUntilStart = calculateHoursDifference(startDateTime, currentDateTime)
    return hoursUntilStart >= 24
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Ошибка загрузки информации о бронировании" />
  if (!booking) return <ErrorMessage message="Бронирование не найдено" />

  return (
    <div className="max-w-3xl mx-auto">
      <button
        onClick={() => navigate('/bookings')}
        className="btn-secondary mb-6"
      >
        ← Назад
      </button>

      <div className="card">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Детали бронирования</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold self-start ${getStatusColor(booking.status)}`}>
            {getStatusText(booking.status)}
          </span>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold mb-3">Информация о клубе</h2>
            <div className="space-y-2">
              <p><strong>Название:</strong> {booking.club.name}</p>
              <p><strong>Адрес:</strong> {booking.club.address}</p>
              <p><strong>Город:</strong> {booking.city.name}, {booking.city.region.name}</p>
              <p><strong>Телефон:</strong> {booking.club.phone}</p>
              <p><strong>Email:</strong> {booking.club.email}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold mb-3">Информация о бронировании</h2>
            <div className="space-y-2">
              <p>
                <strong>Начало:</strong>{' '}
                {formatDateTime(booking.startDateTime)}
              </p>
              <p>
                <strong>Окончание:</strong>{' '}
                {formatDateTime(booking.endDateTime)}
              </p>
              <p><strong>Количество игровых мест:</strong> {booking.cntEquipment}</p>
              <p><strong>Стоимость:</strong> {booking.price} ₽</p>
              {booking.note && (
                <p><strong>Пожелания:</strong> {booking.note}</p>
              )}
            </div>
          </div>

          {canCancel(booking.startDateTime) && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-2">Отмена бронирования</p>
              <p className="text-sm mb-2">
                Для отмены бронирования свяжитесь с клубом не позднее чем за 24 часа до начала:
              </p>
              <p className="text-sm">
                <strong>Телефон:</strong> {booking.club.phone}
              </p>
              <p className="text-sm">
                <strong>Email:</strong> {booking.club.email}
              </p>
            </div>
          )}

          {!canCancel(booking.startDateTime) && booking.status !== BookingStatus.CANCELLED && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="text-sm">
                ⚠️ Отмена бронирования возможна только за 24 часа до начала
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingDetailsPage
