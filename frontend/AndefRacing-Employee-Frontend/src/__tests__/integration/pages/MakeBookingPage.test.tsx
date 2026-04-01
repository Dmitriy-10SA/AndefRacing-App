import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import MakeBookingPage from '@/pages/bookings/MakeBookingPage'
import { useAuthStore } from '@/stores/authStore'
import { mockClubs, mockClubFullInfo, mockFreeSlots } from '../mocks/handlers'
import { searchApi } from '@/api/searchApi'
import { bookingApi } from '@/api/bookingApi'

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Мокаем API модули
vi.mock('@/api/searchApi')
vi.mock('@/api/bookingApi')

describe('MakeBookingPage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтные моки для успешных ответов
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue(mockFreeSlots)
    vi.mocked(bookingApi.makeBooking).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает страницу создания бронирования', async () => {
    render(<MakeBookingPage />)

    // Используем getByRole для заголовка, так как "Создать бронирование" есть и в кнопке
    expect(screen.getByRole('heading', { name: /Создать бронирование/i })).toBeInTheDocument()
    expect(screen.getByText('Параметры бронирования')).toBeInTheDocument()
  })

  it('отображает поля формы', async () => {
    render(<MakeBookingPage />)

    expect(screen.getByText('Дата *')).toBeInTheDocument()
    expect(screen.getByText('Длительность (минут) *')).toBeInTheDocument()
    expect(screen.getByText('Количество игровых мест *')).toBeInTheDocument()
    expect(screen.getByText('Стоимость')).toBeInTheDocument()
  })

  it('отображает кнопку показа доступного времени', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })
  })

  it('показывает доступные слоты при нажатии кнопки', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('Выберите время начала бронирования:')).toBeInTheDocument()
    })
  })

  it('позволяет выбрать слот времени', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    await user.click(screen.getByText('10:00'))

    // Слот должен быть выделен
    const slotButton = screen.getByText('10:00')
    expect(slotButton).toHaveClass('border-primary-500')
  })

  it('показывает сообщение если нет доступных слотов', async () => {
    const user = userEvent.setup()

    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue([])

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('Нет доступных слотов на выбранную дату')).toBeInTheDocument()
    })
  })

  it('показывает ошибку, если клуб не выбран', async () => {
    useAuthStore.getState().logout()

    render(<MakeBookingPage />)

    expect(screen.getByText(/Клуб не выбран/i)).toBeInTheDocument()
  })

  it('кнопка создания бронирования отключена без выбора слота', async () => {
    render(<MakeBookingPage />)

    const submitButton = screen.getByRole('button', { name: /Создать бронирование/i })
    expect(submitButton).toBeDisabled()
  })

  it('позволяет ввести примечание', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    const noteTextarea = screen.getByPlaceholderText('Дополнительная информация о бронировании')
    await user.type(noteTextarea, 'Тестовое примечание')

    expect(noteTextarea).toHaveValue('Тестовое примечание')
  })

  it('переходит назад при нажатии кнопки отмены', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    const cancelButton = screen.getByRole('button', { name: /Отмена/i })
    await user.click(cancelButton)

    expect(mockNavigate).toHaveBeenCalledWith('/bookings')
  })

  it('переходит назад при клике на ссылку "Назад к списку"', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    const backLink = screen.getByText('← Назад к списку')
    await user.click(backLink)

    expect(mockNavigate).toHaveBeenCalledWith('/bookings')
  })

  it('отображает цены из информации о клубе', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      // Цены должны отображаться в селекте длительности
      expect(screen.getByText(/30 мин/i)).toBeInTheDocument()
    })
  })

  it('показывает ошибку при попытке создать бронирование без выбора слота', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    // Пытаемся отправить форму без выбора слота - кнопка должна быть disabled
    const submitButton = screen.getByRole('button', { name: /Создать бронирование/i })
    expect(submitButton).toBeDisabled()
  })

  it('успешно создает бронирование', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).not.toBeDisabled()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    await user.click(screen.getByText('10:00'))

    const submitButton = screen.getByRole('button', { name: /Создать бронирование/i })
    expect(submitButton).not.toBeDisabled()

    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Бронирование успешно создано')).toBeInTheDocument()
    })
  })
})
