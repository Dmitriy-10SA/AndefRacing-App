import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from '@tanstack/react-query'
import { bookingApi } from '@/api/bookingApi'
import { searchApi } from '@/api/searchApi'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import { useToast } from '@/hooks/useToast'
import { EmployeeMakeBookingDto, FreeBookingSlotDto } from '@/types'
import { formatTime, formatPrice } from '@/utils/formatters'
import { format } from 'date-fns'

interface BookingFormData {
  date: string
  durationMinutes: number
  cntEquipment: number
  note: string
}

const MakeBookingPage = () => {
  const navigate = useNavigate()
  const { currentClub } = useAuthStore()
  const { success, error: showError, ToastContainer } = useToast()
  const [selectedSlot, setSelectedSlot] = useState<FreeBookingSlotDto | null>(null)
  const [showSlots, setShowSlots] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      durationMinutes: 60,
      cntEquipment: 1,
      note: '',
    },
  })

  const date = watch('date')
  const durationMinutes = watch('durationMinutes')
  const cntEquipment = watch('cntEquipment')

  const { data: clubInfo } = useQuery({
    queryKey: ['clubInfo', currentClub?.id],
    queryFn: () => searchApi.getClubFullInfo(currentClub!.id),
    enabled: !!currentClub,
  })

  const {
    data: freeSlots,
    isLoading: slotsLoading,
    refetch: refetchSlots,
  } = useQuery({
    queryKey: ['freeSlots', date, durationMinutes, cntEquipment],
    queryFn: () =>
      bookingApi.getFreeSlots(
        durationMinutes,
        cntEquipment,
        date,
        format(new Date(), 'yyyy-MM-dd'),
        format(new Date(), 'HH:mm:ss')
      ),
    enabled: false,
  })

  const makeBookingMutation = useMutation({
    mutationFn: (data: EmployeeMakeBookingDto) => bookingApi.makeBooking(data),
    onSuccess: () => {
      success('Бронирование успешно создано')
      setTimeout(() => navigate('/bookings'), 1000)
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Ошибка создания бронирования')
    },
  })

  const handleSearchSlots = () => {
    if (!clubInfo?.isOpen) {
      showError('Клуб закрыт. Невозможно создать бронирование.')
      return
    }
    setSelectedSlot(null)
    setShowSlots(true)
    refetchSlots()
  }

  const onSubmit = (data: BookingFormData) => {
    if (!selectedSlot) {
      showError('Пожалуйста, выберите время начала бронирования')
      return
    }

    const bookingData: EmployeeMakeBookingDto = {
      cntEquipment: data.cntEquipment,
      slot: selectedSlot,
      note: data.note || undefined,
    }

    makeBookingMutation.mutate(bookingData)
  }

  const getPrice = (): number | null => {
    if (!clubInfo) return null
    const price = clubInfo.prices.find((p) => p.durationMinutes === Number(durationMinutes))
    return price ? price.value * Number(cntEquipment) : null
  }

  const price = getPrice()

  if (!currentClub) {
    return (
      <div className="max-w-4xl mx-auto">
        <ErrorMessage message="Клуб не выбран. Пожалуйста, войдите заново." />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <ToastContainer />
      <button
        onClick={() => navigate('/bookings')}
        className="mb-4 text-primary-600 hover:text-primary-700 flex items-center gap-2 text-sm sm:text-base"
      >
        ← Назад к списку
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Создать бронирование</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Параметры бронирования</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Дата *</label>
              <input
                type="date"
                {...register('date', { required: 'Дата обязательна' })}
                className="input"
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              {errors.date && <p className="error-text">{errors.date.message}</p>}
            </div>

            <div>
              <label className="label">Длительность (минут) *</label>
              <select
                {...register('durationMinutes', {
                  valueAsNumber: true,
                })}
                className="input"
              >
                {clubInfo?.prices.map((price) => (
                  <option key={price.id} value={price.durationMinutes}>
                    {price.durationMinutes} мин - {formatPrice(price.value)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Количество игровых мест *</label>
              <select
                {...register('cntEquipment', {
                  required: 'Количество обязательно',
                  valueAsNumber: true,
                })}
                className="input"
              >
                {clubInfo && Array.from({ length: clubInfo.cntEquipment }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num}
                  </option>
                ))}
              </select>
              {errors.cntEquipment && (
                <p className="error-text">{errors.cntEquipment.message}</p>
              )}
            </div>

            <div>
              <label className="label">Стоимость</label>
              <p className="text-2xl font-bold text-primary-600">
                {price ? formatPrice(price) : 'Не указана'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <button
              type="button"
              onClick={handleSearchSlots}
              className="btn-secondary"
              disabled={!price}
            >
              Показать доступное время
            </button>
          </div>
        </div>

        {showSlots && (
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Выберите время начала бронирования:</h2>
            {slotsLoading && <LoadingSpinner />}
            {freeSlots && freeSlots.length === 0 && (
              <p className="text-gray-500">Нет доступных слотов на выбранную дату</p>
            )}
            {freeSlots && freeSlots.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
                {freeSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={`p-2 sm:p-3 border rounded-lg transition-colors text-sm sm:text-base ${
                      selectedSlot === slot
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-300 hover:border-primary-300'
                    }`}
                  >
                    {formatTime(slot.startDateTime)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Примечание (опционально)</h2>
          <textarea
            {...register('note')}
            className="input"
            rows={3}
            placeholder="Дополнительная информация о бронировании"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => navigate('/bookings')}
            className="btn-secondary flex-1 order-2 sm:order-1"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={!selectedSlot || makeBookingMutation.isPending}
            className="btn-primary flex-1 order-1 sm:order-2"
          >
            {makeBookingMutation.isPending ? 'Создание...' : 'Создать бронирование'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MakeBookingPage
