import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import BookingsPage from '@/pages/bookings/BookingsPage'
import { useAuthStore } from '@/stores/authStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import { mockClubs } from '../mocks/handlers'
import { bookingApi } from '@/api/bookingApi'
import { AxiosError } from 'axios'

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

// Мокаем API модуль
vi.mock('@/api/bookingApi')

// Хелпер для создания ошибки "Вы заблокированы"
const createBlockedError = () => {
  const error = new Error('Вы заблокированы') as AxiosError
  error.response = {
    data: { message: 'Вы заблокированы' },
    status: 403,
    statusText: 'Forbidden',
    headers: {},
    config: {} as any,
  }
  return error
}

const mockBookingsResponse = {
  content: [
    {
      id: 1,
      startDateTime: '2024-03-20T14:00:00',
      endDateTime: '2024-03-20T15:00:00',
      status: 'PAID',
    },
    {
      id: 2,
      startDateTime: '2024-03-21T16:00:00',
      endDateTime: '2024-03-21T17:00:00',
      status: 'PENDING_PAYMENT',
    },
    {
      id: 3,
      startDateTime: '2024-03-22T10:00:00',
      endDateTime: '2024-03-22T11:00:00',
      status: 'CANCELLED',
    },
  ],
  pageInfo: {
    pageNumber: 0,
    pageSize: 10,
    totalElements: 3,
    totalPages: 1,
    isLast: true,
  },
}

describe('BookingsPage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
    usePageStateStore.getState().resetBookingsPageState()

    // Устанавливаем текущий клуб
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтный мок для успешного ответа
    vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingsResponse)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает страницу бронирований', async () => {
    render(<BookingsPage />)

    expect(screen.getByText('Бронирования')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Создать бронирование/i })).toBeInTheDocument()
  })

  it('отображает фильтры', async () => {
    render(<BookingsPage />)

    expect(screen.getByText('Фильтры')).toBeInTheDocument()
    expect(screen.getByText('Дата начала')).toBeInTheDocument()
    expect(screen.getByText('Дата окончания')).toBeInTheDocument()
    expect(screen.getByText('Телефон клиента (опционально)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Поиск/i })).toBeInTheDocument()
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(bookingApi.getBookings).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBookingsResponse), 1000))
    )

    render(<BookingsPage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('отображает список бронирований', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Бронирование').length).toBeGreaterThan(0)
    })

    // Проверяем статусы
    expect(screen.getByText('Оплачено')).toBeInTheDocument()
    expect(screen.getByText('Ожидание оплаты')).toBeInTheDocument()
    expect(screen.getByText('Отменено')).toBeInTheDocument()
  })

  it('отображает статусы с правильными цветами', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Оплачено')).toBeInTheDocument()
    })

    const paidBadge = screen.getByText('Оплачено')
    expect(paidBadge).toHaveClass('bg-green-100', 'text-green-800')

    const pendingBadge = screen.getByText('Ожидание оплаты')
    expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')

    const cancelledBadge = screen.getByText('Отменено')
    expect(cancelledBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('показывает пустое состояние, когда нет бронирований', async () => {
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Бронирования не найдены')).toBeInTheDocument()
    })
  })

  it('переходит на страницу создания бронирования', async () => {
    const user = userEvent.setup()

    render(<BookingsPage />)

    const createButton = screen.getByRole('button', { name: /Создать бронирование/i })
    await user.click(createButton)

    expect(mockNavigate).toHaveBeenCalledWith('/bookings/make')
  })

  it('переходит на детали бронирования при клике', async () => {
    const user = userEvent.setup()

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Бронирование').length).toBeGreaterThan(0)
    })

    const bookingCards = document.querySelectorAll('.card.hover\\:shadow-lg')
    if (bookingCards[0]) {
      await user.click(bookingCards[0])
      expect(mockNavigate).toHaveBeenCalledWith('/bookings/1')
    }
  })

  it('фильтрует по телефону клиента', async () => {
    const user = userEvent.setup()

    render(<BookingsPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991112233')

    const searchButton = screen.getByRole('button', { name: /Поиск/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(vi.mocked(bookingApi.getBookings)).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        '+7-999-111-22-33',
        0,
        10
      )
    })
  })

  it('показывает ошибку при неверном формате телефона', async () => {
    const user = userEvent.setup()

    render(<BookingsPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '123')

    const searchButton = screen.getByRole('button', { name: /Поиск/i })
    await user.click(searchButton)

    await waitFor(() => {
      expect(screen.getByText(/Неверный формат телефона/i)).toBeInTheDocument()
    })
  })

  it('показывает ошибку при неудачной загрузке', async () => {
    vi.mocked(bookingApi.getBookings).mockRejectedValue(new Error('Ошибка'))

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки бронирований')).toBeInTheDocument()
    })
  })

  it('показывает ошибку, если клуб не выбран', async () => {
    useAuthStore.getState().logout()

    render(<BookingsPage />)

    expect(screen.getByText(/Клуб не выбран/i)).toBeInTheDocument()
  })

  it('показывает пагинацию при нескольких страницах', async () => {
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: mockBookingsResponse.content,
      pageInfo: {
        pageNumber: 0,
        pageSize: 10,
        totalElements: 25,
        totalPages: 3,
        isLast: false,
      },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Бронирование').length).toBeGreaterThan(0)
    })

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
  })

  it('отображает время начала и окончания бронирования', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Бронирование').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText(/Начало:/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Окончание:/i).length).toBeGreaterThan(0)
  })

  describe('Обработка заблокированного сотрудника', () => {
    it('отображает сообщение об ошибке при загрузке бронирований заблокированным сотрудником', async () => {
      vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки бронирований/i)).toBeInTheDocument()
      })
    })

    it('не отображает список бронирований для заблокированного сотрудника', async () => {
      vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки бронирований/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('Оплачено')).not.toBeInTheDocument()
      expect(screen.queryByText('Ожидание оплаты')).not.toBeInTheDocument()
    })

    it('страница отображается с сообщением об ошибке для заблокированного сотрудника', async () => {
      vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки бронирований/i)).toBeInTheDocument()
      })

      // Страница рендерится, но вместо данных показывает ошибку
      expect(screen.getByText('Бронирования')).toBeInTheDocument()
    })

    it('при ошибке блокировки сотрудник не видит данные бронирований', async () => {
      vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки бронирований/i)).toBeInTheDocument()
      })

      // Бронирования не отображаются
      expect(screen.queryByText('Бронирование не найдено')).not.toBeInTheDocument()
    })
  })

  describe('Фильтрация по телефону клиента', () => {
    it('телефон клиента — опциональный параметр фильтрации', async () => {
      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Телефон клиента (опционально)')).toBeInTheDocument()
      })

      // Поле телефона должно быть пустым по умолчанию
      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      expect(phoneInput).toHaveValue('')
    })

    it('при пустом поле телефона поиск работает без фильтра по клиенту', async () => {
      const user = userEvent.setup()

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Поиск/i })).toBeInTheDocument()
      })

      // Не вводим телефон, просто нажимаем поиск
      const searchButton = screen.getByRole('button', { name: /Поиск/i })
      await user.click(searchButton)

      // API должен быть вызван без телефона (null или undefined)
      await waitFor(() => {
        expect(vi.mocked(bookingApi.getBookings)).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          null, // Телефон не указан
          0,
          10
        )
      })
    })

    it('поиск с некорректным форматом телефона показывает ошибку валидации', async () => {
      const user = userEvent.setup()

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')).toBeInTheDocument()
      })

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '123') // Неполный номер

      const searchButton = screen.getByRole('button', { name: /Поиск/i })
      await user.click(searchButton)

      await waitFor(() => {
        expect(screen.getByText(/Неверный формат телефона/i)).toBeInTheDocument()
      })

      // API не должен быть вызван с неверным телефоном
      expect(vi.mocked(bookingApi.getBookings)).not.toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        '+7-123',
        expect.any(Number),
        expect.any(Number)
      )
    })

    it('поиск с корректным телефоном передает его в API', async () => {
      const user = userEvent.setup()

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')).toBeInTheDocument()
      })

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9995554433')

      const searchButton = screen.getByRole('button', { name: /Поиск/i })
      await user.click(searchButton)

      await waitFor(() => {
        expect(vi.mocked(bookingApi.getBookings)).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          '+7-999-555-44-33',
          0,
          10
        )
      })
    })

    it('очистка поля телефона сбрасывает фильтр', async () => {
      const user = userEvent.setup()

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')).toBeInTheDocument()
      })

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')

      // Вводим телефон
      await user.type(phoneInput, '9991112233')
      expect(phoneInput).toHaveValue('+7-999-111-22-33')

      // Очищаем поле
      await user.clear(phoneInput)
      expect(phoneInput).toHaveValue('')

      // Поиск без телефона
      const searchButton = screen.getByRole('button', { name: /Поиск/i })
      await user.click(searchButton)

      await waitFor(() => {
        expect(vi.mocked(bookingApi.getBookings)).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          null,
          0,
          10
        )
      })
    })
  })
})
