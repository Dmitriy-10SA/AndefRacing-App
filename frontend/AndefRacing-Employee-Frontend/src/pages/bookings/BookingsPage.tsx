import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { bookingApi } from '@/api/bookingApi'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import Pagination from '@/components/Pagination'
import PhoneInput from '@/components/PhoneInput'
import { formatDateTime } from '@/utils/formatters'
import { validatePhone } from '@/utils/validators'
import { BookingStatus } from '@/types'
import { format } from 'date-fns'

const BookingsPage = () => {
  const navigate = useNavigate()
  const { currentClub } = useAuthStore()
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [clientPhone, setClientPhone] = useState('')
  const [pageNumber, setPageNumber] = useState(0)
  const [phoneError, setPhoneError] = useState('')
  const [searchParams, setSearchParams] = useState({
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    clientPhone: '',
  })
  const pageSize = 10

  const { data, isLoading, error } = useQuery({
    queryKey: ['bookings', searchParams.startDate, searchParams.endDate, searchParams.clientPhone, pageNumber],
    queryFn: () =>
      bookingApi.getBookings(
        searchParams.startDate,
        searchParams.endDate,
        searchParams.clientPhone || null,
        pageNumber,
        pageSize
      ),
  })

  const getStatusLabel = (status: BookingStatus): string => {
    switch (status) {
      case BookingStatus.PENDING_PAYMENT:
        return 'Ожидание оплаты'
      case BookingStatus.PAID:
        return 'Оплачено'
      case BookingStatus.CANCELLED:
        return 'Отменено'
      default:
        return status
    }
  }

  const getStatusColor = (status: BookingStatus): string => {
    switch (status) {
      case BookingStatus.PENDING_PAYMENT:
        return 'bg-yellow-100 text-yellow-800'
      case BookingStatus.PAID:
        return 'bg-green-100 text-green-800'
      case BookingStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSearch = () => {
    // Validate phone if provided
    if (clientPhone && !validatePhone(clientPhone)) {
      setPhoneError('Неверный формат телефона. Используйте формат: +7-XXX-XXX-XX-XX')
      return
    }

    setPhoneError('')
    setPageNumber(0)
    setSearchParams({
      startDate,
      endDate,
      clientPhone,
    })
  }

  if (!currentClub) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorMessage message="Клуб не выбран. Пожалуйста, войдите заново." />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Бронирования</h1>
        <button
          onClick={() => navigate('/bookings/make')}
          className="btn-primary"
        >
          Создать бронирование
        </button>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-4">Фильтры</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Дата начала</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="input"
            />
          </div>
          <div>
            <label className="label">Дата окончания</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="input"
            />
          </div>
          <div>
            <label className="label">Телефон клиента (опционально)</label>
            <PhoneInput
              value={clientPhone}
              onChange={(value) => {
                setClientPhone(value)
                setPhoneError('')
              }}
              placeholder="+7-XXX-XXX-XX-XX"
            />
            {phoneError && <p className="error-text mt-1">{phoneError}</p>}
          </div>
        </div>
        <button onClick={handleSearch} className="btn-primary mt-4">
          Поиск
        </button>
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {error && <ErrorMessage message="Ошибка загрузки бронирований" />}

      {data && (
        <>
          <div className="space-y-4">
            {data.content.length === 0 ? (
              <div className="card text-center py-8 text-gray-500">
                Бронирования не найдены
              </div>
            ) : (
              data.content.map((booking) => (
                <div
                  key={booking.id}
                  className="card hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/bookings/${booking.id}`)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          Бронирование #{booking.id}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <div className="text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Начало:</span>{' '}
                          {formatDateTime(booking.startDateTime)}
                        </p>
                        <p>
                          <span className="font-medium">Окончание:</span>{' '}
                          {formatDateTime(booking.endDateTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {data.pageInfo.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={pageNumber}
                totalPages={data.pageInfo.totalPages}
                onPageChange={setPageNumber}
              />
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default BookingsPage
