import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import BookingDetailsPage from '@/pages/bookings/BookingDetailsPage'
import { useAuthStore } from '@/stores/authStore'
import { mockClubs, mockBookingFullInfo } from '../mocks/handlers'
import { bookingApi } from '@/api/bookingApi'

// Мокаем useParams и useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  }
})

// Мокаем API модуль
vi.mock('@/api/bookingApi')

describe('BookingDetailsPage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтный мок для успешного ответа
    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue(mockBookingFullInfo)
    vi.mocked(bookingApi.confirmBookingPayment).mockResolvedValue(undefined)
    vi.mocked(bookingApi.cancelBooking).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает информацию о бронировании', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Бронирование')).toBeInTheDocument()
    })

    expect(screen.getByText('Ожидание оплаты')).toBeInTheDocument()
    expect(screen.getByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText('3 000 ₽')).toBeInTheDocument()
    expect(screen.getByText('Тестовая заметка')).toBeInTheDocument()
  })

  it('показывает кнопку подтверждения оплаты для статуса PENDING_PAYMENT', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Подтвердить оплату/i })).toBeInTheDocument()
    })
  })

  it('показывает кнопку отмены для неотмененных бронирований', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Отменить бронирование/i })).toBeInTheDocument()
    })
  })

  it('не показывает кнопку подтверждения оплаты для оплаченных бронирований', async () => {
    vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({ ...mockBookingFullInfo, status: 'PAID' })

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Оплачено')).toBeInTheDocument()
    })

    expect(screen.queryByRole('button', { name: /Подтвердить оплату/i })).not.toBeInTheDocument()
  })

  it('открывает модал отмены при нажатии кнопки отмены', async () => {
    const user = userEvent.setup()

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Отменить бронирование/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Отменить бронирование/i }))

    expect(screen.getByText('Отмена бронирования')).toBeInTheDocument()
    expect(screen.getByText('Вы уверены, что хотите отменить это бронирование?')).toBeInTheDocument()
  })

  it('открывает модал подтверждения оплаты при нажатии кнопки', async () => {
    const user = userEvent.setup()

    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Подтвердить оплату/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Подтвердить оплату/i }))

    expect(screen.getByText('Подтверждение оплаты')).toBeInTheDocument()
    expect(screen.getByText('Вы уверены, что хотите подтвердить оплату этого бронирования?')).toBeInTheDocument()
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(bookingApi.getBookingFullInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBookingFullInfo), 1000))
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
      expect(screen.getByText('Бронирование')).toBeInTheDocument()
    })

    const backButton = screen.getByText('← Назад к списку')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/bookings')
  })

  it('отображает информацию о клиенте', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Клиент')).toBeInTheDocument()
    })

    expect(screen.getByText('Иван Иванов')).toBeInTheDocument()
    expect(screen.getByText('+7-999-111-22-33')).toBeInTheDocument()
  })

  it('отображает время начала и окончания', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Начало')).toBeInTheDocument()
      expect(screen.getByText('Окончание')).toBeInTheDocument()
    })
  })

  it('отображает количество игровых мест', async () => {
    render(<BookingDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Количество игровых мест')).toBeInTheDocument()
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Отмена бронирования', () => {
    it('успешно отменяет бронирование', async () => {
      const user = userEvent.setup()

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Отменить бронирование/i })).toBeInTheDocument()
      })

      // Открываем модал отмены
      await user.click(screen.getByRole('button', { name: /Отменить бронирование/i }))

      await waitFor(() => {
        expect(screen.getByText('Отмена бронирования')).toBeInTheDocument()
      })

      // Подтверждаем отмену - используем within для поиска в модале
      const modal = screen.getByText('Вы уверены, что хотите отменить это бронирование?').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Отменить бронирование$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(bookingApi.cancelBooking)).toHaveBeenCalledWith(1)
      })
    })

    it('закрывает модал при нажатии "Назад"', async () => {
      const user = userEvent.setup()

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Отменить бронирование/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Отменить бронирование/i }))

      await waitFor(() => {
        expect(screen.getByText('Отмена бронирования')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Вы уверены, что хотите отменить это бронирование?').closest('.fixed')!
      const backButton = within(modal as HTMLElement).getByRole('button', { name: /Назад/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.queryByText('Вы уверены, что хотите отменить это бронирование?')).not.toBeInTheDocument()
      })
    })

    it('обрабатывает ошибку при отмене бронирования', async () => {
      const user = userEvent.setup()

      vi.mocked(bookingApi.cancelBooking).mockRejectedValue({
        response: { data: { message: 'Невозможно отменить бронирование' } }
      })

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Отменить бронирование/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Отменить бронирование/i }))

      await waitFor(() => {
        expect(screen.getByText('Отмена бронирования')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Вы уверены, что хотите отменить это бронирование?').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Отменить бронирование$/i })
      await user.click(confirmButton)

      // Ошибка должна отобразиться через Toast
      await waitFor(() => {
        expect(vi.mocked(bookingApi.cancelBooking)).toHaveBeenCalled()
      })
    })

    it('не показывает кнопку отмены для отмененных бронирований', async () => {
      vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
        ...mockBookingFullInfo,
        status: 'CANCELLED'
      })

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('Отменено')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /Отменить бронирование/i })).not.toBeInTheDocument()
    })

    it('обновляет данные после успешной отмены', async () => {
      const user = userEvent.setup()

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Отменить бронирование/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Отменить бронирование/i }))

      await waitFor(() => {
        expect(screen.getByText('Отмена бронирования')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Вы уверены, что хотите отменить это бронирование?').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Отменить бронирование$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(bookingApi.cancelBooking)).toHaveBeenCalled()
      })

      // После успешной отмены должен показаться Toast с подтверждением
    })
  })

  describe('Подтверждение оплаты', () => {
    it('успешно подтверждает оплату', async () => {
      const user = userEvent.setup()

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Подтвердить оплату/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Подтвердить оплату/i }))

      await waitFor(() => {
        expect(screen.getByText('Подтверждение оплаты')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Вы уверены, что хотите подтвердить оплату этого бронирования?').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Подтвердить оплату$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(bookingApi.confirmBookingPayment)).toHaveBeenCalledWith(1)
      })
    })

    it('закрывает модал при нажатии "Назад"', async () => {
      const user = userEvent.setup()

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Подтвердить оплату/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Подтвердить оплату/i }))

      await waitFor(() => {
        expect(screen.getByText('Подтверждение оплаты')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Вы уверены, что хотите подтвердить оплату этого бронирования?').closest('.fixed')!
      const backButton = within(modal as HTMLElement).getByRole('button', { name: /Назад/i })
      await user.click(backButton)

      await waitFor(() => {
        expect(screen.queryByText('Вы уверены, что хотите подтвердить оплату этого бронирования?')).not.toBeInTheDocument()
      })
    })

    it('обрабатывает ошибку при подтверждении оплаты', async () => {
      const user = userEvent.setup()

      vi.mocked(bookingApi.confirmBookingPayment).mockRejectedValue({
        response: { data: { message: 'Ошибка подтверждения оплаты' } }
      })

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Подтвердить оплату/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Подтвердить оплату/i }))

      await waitFor(() => {
        expect(screen.getByText('Подтверждение оплаты')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Вы уверены, что хотите подтвердить оплату этого бронирования?').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Подтвердить оплату$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(bookingApi.confirmBookingPayment)).toHaveBeenCalled()
      })
    })
  })

  describe('Различные статусы бронирования', () => {
    it('показывает статус PAID с зеленым бейджем', async () => {
      vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
        ...mockBookingFullInfo,
        status: 'PAID'
      })

      render(<BookingDetailsPage />)

      await waitFor(() => {
        const badge = screen.getByText('Оплачено')
        expect(badge).toHaveClass('bg-green-100', 'text-green-800')
      })
    })

    it('показывает статус PENDING_PAYMENT с желтым бейджем', async () => {
      render(<BookingDetailsPage />)

      await waitFor(() => {
        const badge = screen.getByText('Ожидание оплаты')
        expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
      })
    })

    it('показывает статус CANCELLED с красным бейджем', async () => {
      vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
        ...mockBookingFullInfo,
        status: 'CANCELLED'
      })

      render(<BookingDetailsPage />)

      await waitFor(() => {
        const badge = screen.getByText('Отменено')
        expect(badge).toHaveClass('bg-red-100', 'text-red-800')
      })
    })
  })

  describe('Бронирование без клиента', () => {
    it('не показывает блок клиента, если клиент отсутствует', async () => {
      vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
        ...mockBookingFullInfo,
        client: null
      })

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('Бронирование')).toBeInTheDocument()
      })

      expect(screen.queryByText('Клиент')).not.toBeInTheDocument()
    })
  })

  describe('Бронирование без примечания', () => {
    it('не показывает блок примечания, если оно отсутствует', async () => {
      vi.mocked(bookingApi.getBookingFullInfo).mockResolvedValue({
        ...mockBookingFullInfo,
        note: null
      })

      render(<BookingDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('Бронирование')).toBeInTheDocument()
      })

      expect(screen.queryByText('Примечание')).not.toBeInTheDocument()
    })
  })
})
