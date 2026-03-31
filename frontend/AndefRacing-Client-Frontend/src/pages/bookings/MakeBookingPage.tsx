import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { searchApi } from '../../api/searchApi'
import { bookingApi } from '../../api/bookingApi'
import { ClientMakeBookingDto, FreeBookingSlotDto } from '../../types'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import { usePageStateStore } from '../../stores/pageStateStore'

// Получить текущую дату в формате YYYY-MM-DD
const getCurrentDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Получить текущее время в формате HH:mm:ss
const getCurrentTime = (): string => {
  const now = new Date()
  const hours = String(now.getHours()).padStart(2, '0')
  const minutes = String(now.getMinutes()).padStart(2, '0')
  const seconds = String(now.getSeconds()).padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

interface BookingFormData {
  date: string
  durationMinutes: number
  cntEquipment: number
  note: string
}

const MakeBookingPage = () => {
  const { clubId } = useParams<{ clubId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { resetBookingsPageState } = usePageStateStore()
  const [selectedSlot, setSelectedSlot] = useState<FreeBookingSlotDto | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [shouldFetchSlots, setShouldFetchSlots] = useState(false)

  const { data: club } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => searchApi.getClubFullInfo(Number(clubId)),
  })

  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingFormData>({
    defaultValues: {
      date: getCurrentDate(),
      durationMinutes: club?.prices[0]?.durationMinutes || 60,
      cntEquipment: 1,
      note: '',
    },
  })

  const date = watch('date')
  const durationMinutes = watch('durationMinutes')
  const cntEquipment = watch('cntEquipment')

  // Сбрасываем отображение слотов при изменении параметров
  useEffect(() => {
    setShouldFetchSlots(false)
    setSelectedSlot(null)
  }, [date, durationMinutes, cntEquipment])

  const { data: slots, isLoading: slotsLoading, refetch: refetchSlots } = useQuery({
    queryKey: ['freeSlots', clubId, date, durationMinutes, cntEquipment],
    queryFn: () => {
      const userCurrentDate = getCurrentDate()
      const userCurrentTime = getCurrentTime()
      return bookingApi.getFreeSlots(
        Number(clubId),
        Number(durationMinutes),
        Number(cntEquipment),
        date,
        userCurrentDate,
        userCurrentTime
      )
    },
    enabled: false, // Отключаем автоматическую загрузку
  })

  const handleShowSlots = () => {
    setSelectedSlot(null) // Сбрасываем выбранный слот
    setShouldFetchSlots(true)
    refetchSlots() // Принудительно загружаем слоты
  }

  const bookingMutation = useMutation({
    mutationFn: (data: ClientMakeBookingDto) =>
      bookingApi.makeBooking(Number(clubId), data),
    onSuccess: () => {
      // Инвалидируем кэш бронирований, чтобы данные загрузились заново
      queryClient.invalidateQueries({ queryKey: ['bookings'] })
      // Сбрасываем фильтры страницы бронирований к дефолтным значениям (текущая дата + 7 дней)
      resetBookingsPageState()
      navigate('/bookings')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка создания бронирования'
      setErrorMessage(message)
    },
  })

  const onSubmit = (data: BookingFormData) => {
    if (!selectedSlot) {
      setErrorMessage('Выберите время бронирования')
      return
    }

    const bookingData: ClientMakeBookingDto = {
      cntEquipment: Number(data.cntEquipment),
      slot: selectedSlot,
      note: data.note || undefined,
    }

    setErrorMessage('')
    bookingMutation.mutate(bookingData)
  }

  const calculatePrice = (durationMinutes: number): number | null => {
    if (!club?.prices) return null

    const priceInfo = club.prices.find((p) => p.durationMinutes === Number(durationMinutes))
    if (!priceInfo) return null

    return priceInfo.value
  }

  const price = calculatePrice(Number(durationMinutes))

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="btn-secondary mb-6"
      >
        ← Назад
      </button>

      <h1 className="text-3xl font-bold mb-6">Бронирование: {club?.name}</h1>

      {errorMessage && (
        <div className="mb-6">
          <ErrorMessage message={errorMessage} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold mb-4">Параметры бронирования</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="label">Дата</label>
              <input
                type="date"
                className="input"
                min={getCurrentDate()}
                {...register('date', { required: 'Дата обязательна' })}
              />
              {errors.date && (
                <p className="error-text">{errors.date.message}</p>
              )}
            </div>

            <div>
              <label className="label">Длительность</label>
              <select
                className="input rounded-lg"
                {...register('durationMinutes', {
                  required: 'Длительность обязательна',
                })}
              >
                {club?.prices.map((price) => {
                  const hours = Math.floor(price.durationMinutes / 60)
                  const minutes = price.durationMinutes % 60
                  let label = ''
                  if (hours > 0) {
                    label += `${hours} ${hours === 1 ? 'час' : hours < 5 ? 'часа' : 'часов'}`
                  }
                  if (minutes > 0) {
                    if (label) label += ' '
                    label += `${minutes} минут`
                  }
                  return (
                    <option key={price.id} value={price.durationMinutes}>
                      {label} ({price.value} ₽)
                    </option>
                  )
                }) || (
                  <option value={60}>1 час</option>
                )}
              </select>
              {errors.durationMinutes && (
                <p className="error-text">{errors.durationMinutes.message}</p>
              )}
            </div>

            <div>
              <label className="label">Количество игровых мест</label>
              <select
                className="input rounded-lg"
                {...register('cntEquipment', {
                  required: 'Количество игровых мест обязательно',
                  min: { value: 1, message: 'Минимум 1 игровое место' },
                })}
              >
                {club && Array.from({ length: club.cntEquipment }, (_, i) => i + 1).map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? 'игровое место' : num < 5 ? 'игровых места' : 'игровых мест'}
                  </option>
                )) || (
                  <option value={1}>1 игровое место</option>
                )}
              </select>
              {errors.cntEquipment && (
                <p className="error-text">{errors.cntEquipment.message}</p>
              )}
            </div>
          </div>

          {price !== null && (
            <div className="bg-primary-50 border border-primary-200 text-primary-800 px-4 py-3 rounded-lg mb-4">
              <p className="font-semibold">
                Стоимость: {price * Number(cntEquipment)} ₽
                <span className="text-sm font-normal ml-2">
                  ({price} ₽ × {cntEquipment} {Number(cntEquipment) === 1 ? 'игровое место' : Number(cntEquipment) < 5 ? 'игровых места' : 'игровых мест'})
                </span>
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleShowSlots}
            disabled={!date || !durationMinutes || !cntEquipment}
            className="btn-primary w-full"
          >
            Показать доступное время
          </button>
        </div>

        {shouldFetchSlots && (
          <div className="card">
            <h2 className="text-xl font-bold mb-4">Выберите время</h2>

            {slotsLoading && <LoadingSpinner />}

            {!slotsLoading && slots && slots.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {slots.map((slot, index) => {
                  // Извлекаем время из строки
                  const timeMatch = slot.startDateTime.match(/T(\d{2}:\d{2})/)
                  const timeString = timeMatch ? timeMatch[1] : slot.startDateTime
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedSlot === slot
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-300 hover:border-primary-400'
                      }`}
                    >
                      {timeString}
                    </button>
                  )
                })}
              </div>
            )}

            {!slotsLoading && slots && slots.length === 0 && (
              <p className="text-gray-600">Нет доступных слотов на выбранную дату</p>
            )}
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-bold mb-4">Пожелания (необязательно)</h2>
          <textarea
            className="input"
            rows={4}
            placeholder="Укажите ваши пожелания к бронированию..."
            {...register('note')}
          />
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={!selectedSlot || bookingMutation.isPending}
            className="btn-primary"
          >
            {bookingMutation.isPending ? 'Бронирование...' : 'Забронировать'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Отмена
          </button>
        </div>
      </form>
    </div>
  )
}

export default MakeBookingPage
