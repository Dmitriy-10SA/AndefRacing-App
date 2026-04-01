import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import BookingDetailsPage from '@/pages/bookings/BookingDetailsPage'
import { useAuthStore } from '@/stores/authStore'
import { bookingApi } from '@/api/bookingApi'

// Мокаем API модули
vi.mock('@/api/bookingApi')

// Мокаем useParams и useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ clubId: '1', bookingId: '1' }),
  }
})

const mockClub = {
  id: 1,
  name: 'VR Club Moscow',
  phone: '+7-495-123-45-67',
  email: 'moscow@vrclub.ru',
  address: 'ул. Тверская, д. 10',
  cntEquipment: 10,
  isOpen: true,
  mainPhoto: { id: 1, url: '/files/clubs/1/main.jpg' },
}

const mockBookingDetails = {
  id: 1,
  startDateTime: '2024-03-20T14:00:00',
  endDateTime: '2024-03-20T15:00:00',
  status: 'PAID',
  cntEquipment: 2,
  price: 3000,
  note: 'Тестовое пожелание',
  club: mockClub,
  city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
}

describe('BookingDetailsPage Integration (Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтный мок для успешного ответа
    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue(mockBookingDetails)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает детали бронирования', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Детали бронирования')).toBeInTheDocument()
    })
  })

  it('отображает информацию о клубе', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Информация о клубе')).toBeInTheDocument()
    })

    expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    expect(screen.getByText('ул. Тверская, д. 10')).toBeInTheDocument()
    expect(screen.getByText(/Москва/i)).toBeInTheDocument()
  })

  it('отображает контакты клуба', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('+7-495-123-45-67')).toBeInTheDocument()
      expect(screen.getByText('moscow@vrclub.ru')).toBeInTheDocument()
    })
  })

  it('отображает информацию о бронировании', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Информация о бронировании')).toBeInTheDocument()
    })

    expect(screen.getByText('Начало:')).toBeInTheDocument()
    expect(screen.getByText('Окончание:')).toBeInTheDocument()
    expect(screen.getByText(/Количество игровых мест:/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('отображает стоимость бронирования', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Стоимость:')).toBeInTheDocument()
      expect(screen.getByText('3000 ₽')).toBeInTheDocument()
    })
  })

  it('отображает пожелания если они есть', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Пожелания:')).toBeInTheDocument()
      expect(screen.getByText('Тестовое пожелание')).toBeInTheDocument()
    })
  })

  it('отображает статус бронирования', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Подтверждено')).toBeInTheDocument()
    })
  })

  it('показывает статус "В ожидании оплаты" для PENDING_PAYMENT', async () => {
    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({ ...mockBookingDetails, status: 'PENDING_PAYMENT' })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('В ожидании оплаты')).toBeInTheDocument()
    })
  })

  it('показывает статус "Отменено" для CANCELLED', async () => {
    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({ ...mockBookingDetails, status: 'CANCELLED' })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Отменено')).toBeInTheDocument()
    })
  })

  it('показывает информацию об отмене для бронирований за 24+ часов', async () => {
    // Бронирование далеко в будущем
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 7)
    const futureIsoDate = futureDate.toISOString().slice(0, 19)

    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
      ...mockBookingDetails,
      startDateTime: futureIsoDate,
      status: 'PAID',
    })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Отмена бронирования/i)).toBeInTheDocument()
    })

    expect(screen.getByText(/свяжитесь с клубом не позднее чем за 24 часа/i)).toBeInTheDocument()
  })

  it('показывает предупреждение для бронирований менее чем за 24 часа', async () => {
    // Бронирование через 12 часов
    const nearDate = new Date()
    nearDate.setHours(nearDate.getHours() + 12)
    const nearIsoDate = nearDate.toISOString().slice(0, 19)

    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
      ...mockBookingDetails,
      startDateTime: nearIsoDate,
      status: 'PAID',
    })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Отмена бронирования возможна только за 24 часа до начала/i)).toBeInTheDocument()
    })
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(bookingApi.getBookingFullInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBookingDetails), 1000))
    )

    render(<BookingDetailsPage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('показывает ошибку при неудачной загрузке', async () => {
    vi.mocked(bookingApi.getBookingFullInfo).mockRejectedValue(new Error('Ошибка'))

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки информации о бронировании')).toBeInTheDocument()
    })
  })

  it('переходит назад к списку бронирований', async () => {
    const user = userEvent.setup()

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Детали бронирования')).toBeInTheDocument()
    })

    const backButton = screen.getByText('← Назад')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/bookings')
  })

  it('не показывает информацию об отмене для отмененных бронирований', async () => {
    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
      ...mockBookingDetails,
      status: 'CANCELLED',
    })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Отменено')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Отмена бронирования/i)).not.toBeInTheDocument()
  })

  it('отображает город и регион', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Москва, Московская область/i)).toBeInTheDocument()
    })
  })
})
