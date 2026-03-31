import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookingApi } from '@/api/bookingApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import { formatDateTime, formatPrice, formatPhone } from '@/utils/formatters'
import { BookingStatus } from '@/types'

const BookingDetailsPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: showError, ToastContainer } = useToast()
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showConfirmPaymentModal, setShowConfirmPaymentModal] = useState(false)

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getBookingFullInfo(Number(id)),
    enabled: !!id,
  })

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancelBooking(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setShowCancelModal(false)
      success('Бронирование отменено')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Ошибка отмены бронирования')
    },
  })

  const confirmPaymentMutation = useMutation({
    mutationFn: () => bookingApi.confirmBookingPayment(Number(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking', id] })
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      setShowConfirmPaymentModal(false)
      success('Оплата подтверждена')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Ошибка подтверждения оплаты')
    },
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto">
        <ErrorMessage message="Ошибка загрузки информации о бронировании" />
        <button onClick={() => navigate('/bookings')} className="btn-secondary mt-4">
          Назад к списку
        </button>
      </div>
    )
  }

  const canCancel = booking.status !== BookingStatus.CANCELLED
  const canConfirmPayment = booking.status === BookingStatus.PENDING_PAYMENT

  return (
    <div className="max-w-2xl mx-auto">
      <ToastContainer />
      <button
        onClick={() => navigate('/bookings')}
        className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2"
      >
        ← Назад к списку
      </button>

      <div className="card">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">Бронирование</h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
              booking.status
            )}`}
          >
            {getStatusLabel(booking.status)}
          </span>
        </div>

        <div className="space-y-4">
          {booking.client && (
            <div>
              <label className="label">Клиент</label>
              <p className="text-lg">{booking.client.name}</p>
              <p className="text-gray-600">{formatPhone(booking.client.phone)}</p>
            </div>
          )}

          <div>
            <label className="label">Начало</label>
            <p className="text-lg">{formatDateTime(booking.startDateTime)}</p>
          </div>

          <div>
            <label className="label">Окончание</label>
            <p className="text-lg">{formatDateTime(booking.endDateTime)}</p>
          </div>

          <div>
            <label className="label">Количество игровых мест</label>
            <p className="text-lg">{booking.cntEquipment}</p>
          </div>

          <div>
            <label className="label">Стоимость</label>
            <p className="text-lg font-semibold text-primary-600">
              {formatPrice(booking.price)}
            </p>
          </div>

          {booking.note && (
            <div>
              <label className="label">Примечание</label>
              <p className="text-lg">{booking.note}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          {canConfirmPayment && (
            <button
              onClick={() => setShowConfirmPaymentModal(true)}
              className="btn-primary flex-1"
            >
              Подтвердить оплату
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="btn-danger flex-1"
            >
              Отменить бронирование
            </button>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showCancelModal}
        title="Отмена бронирования"
        message="Вы уверены, что хотите отменить это бронирование?"
        confirmText="Отменить бронирование"
        cancelText="Назад"
        onConfirm={() => cancelMutation.mutate()}
        onCancel={() => setShowCancelModal(false)}
      />

      <ConfirmModal
        isOpen={showConfirmPaymentModal}
        title="Подтверждение оплаты"
        message="Вы уверены, что хотите подтвердить оплату этого бронирования?"
        confirmText="Подтвердить оплату"
        cancelText="Назад"
        onConfirm={() => confirmPaymentMutation.mutate()}
        onCancel={() => setShowConfirmPaymentModal(false)}
      />
    </div>
  )
}

export default BookingDetailsPage
