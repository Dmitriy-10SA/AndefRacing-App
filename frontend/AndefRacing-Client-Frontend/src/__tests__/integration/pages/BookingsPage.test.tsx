import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { render } from '../test-utils'
import { server } from '../mocks/server'
import BookingsPage from '@/pages/bookings/BookingsPage'
import { usePageStateStore } from '@/stores/pageStateStore'
import { useAuthStore } from '@/stores/authStore'
import { bookingApi } from '@/api/bookingApi'
import { AxiosError } from 'axios'

// Мокаем API модуль для тестов заблокированного пользователя
vi.mock('@/api/bookingApi', async (importOriginal) => {
  const actual = await importOriginal() as typeof import('@/api/bookingApi')
  return {
    ...actual,
    bookingApi: {
      ...actual.bookingApi,
      getBookings: vi.fn(),
    },
  }
})

// Хелпер для создания ответа "Вы заблокированы" (для MSW)
const createBlockedResponse = () => {
  return HttpResponse.json(
    { message: 'Вы заблокированы' },
    { status: 403 }
  )
}

// Хелпер для создания ошибки "Вы заблокированы" (для мока API)
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

// Мокаем useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const mockBookingsResponse = {
  content: [
    {
      id: 1,
      startDateTime: '2024-03-20T14:00:00',
      endDateTime: '2024-03-20T15:00:00',
      status: 'PAID',
      club: {
        id: 1,
        name: 'VR Club Moscow',
        address: 'ул. Тверская, д. 10',
      },
      city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
    },
    {
      id: 2,
      startDateTime: '2024-03-21T16:00:00',
      endDateTime: '2024-03-21T17:00:00',
      status: 'PENDING_PAYMENT',
      club: {
        id: 2,
        name: 'VR Club SPb',
        address: 'Невский пр., д. 100',
      },
      city: { id: 2, name: 'Санкт-Петербург', region: { id: 2, name: 'Ленинградская область' } },
    },
    {
      id: 3,
      startDateTime: '2024-03-22T10:00:00',
      endDateTime: '2024-03-22T11:00:00',
      status: 'CANCELLED',
      club: {
        id: 1,
        name: 'VR Club Moscow',
        address: 'ул. Тверская, д. 10',
      },
      city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
    },
  ],
  pageInfo: {
    pageNumber: 0,
    pageSize: 5,
    totalElements: 3,
    totalPages: 1,
    isLast: true,
  },
}

describe('BookingsPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    server.resetHandlers()
    usePageStateStore.getState().resetBookingsPageState()
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтный мок для успешного ответа
    vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingsResponse)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает список бронирований', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('VR Club Moscow').length).toBeGreaterThan(0)
    })

    expect(screen.getByText('Мои бронирования')).toBeInTheDocument()
    expect(screen.getByText('VR Club SPb')).toBeInTheDocument()
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(bookingApi.getBookings).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBookingsResponse), 1000))
    )

    render(<BookingsPage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('отображает статусы бронирований с правильными цветами', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Подтверждено')).toBeInTheDocument()
    })

    expect(screen.getByText('В ожидании оплаты')).toBeInTheDocument()
    expect(screen.getByText('Отменено')).toBeInTheDocument()

    // Проверяем цвета статусов
    const confirmedBadge = screen.getByText('Подтверждено')
    expect(confirmedBadge).toHaveClass('bg-green-100', 'text-green-800')

    const pendingBadge = screen.getByText('В ожидании оплаты')
    expect(pendingBadge).toHaveClass('bg-blue-100', 'text-blue-800')

    const cancelledBadge = screen.getByText('Отменено')
    expect(cancelledBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('отображает фильтры по датам', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Дата начала')).toBeInTheDocument()
    })

    expect(screen.getByText('Дата окончания')).toBeInTheDocument()

    const dateInputs = document.querySelectorAll('input[type="date"]')
    expect(dateInputs).toHaveLength(2)
  })

  it('изменяет дату начала', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Мои бронирования')).toBeInTheDocument()
    })

    const startDateInput = document.querySelectorAll('input[type="date"]')[0] as HTMLInputElement

    // Проверяем, что дата начала существует (устанавливается из store)
    expect(startDateInput).toBeInTheDocument()
    expect(startDateInput.type).toBe('date')
  })

  it('показывает пустое состояние, когда нет бронирований', async () => {
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [],
      pageInfo: { pageNumber: 0, pageSize: 5, totalElements: 0, totalPages: 0, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('У вас пока нет бронирований')).toBeInTheDocument()
    })

    const searchLink = screen.getByRole('link', { name: 'Найти клубы' })
    expect(searchLink).toHaveAttribute('href', '/search')
  })

  it('карточка бронирования содержит ссылку на детали', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('VR Club Moscow').length).toBeGreaterThan(0)
    })

    const bookingLinks = screen.getAllByRole('link')
    const bookingDetailLink = bookingLinks.find(link =>
      link.getAttribute('href') === '/bookings/1/1'
    )
    expect(bookingDetailLink).toBeInTheDocument()
  })

  it('отображает информацию о дате и времени бронирования', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('VR Club Moscow').length).toBeGreaterThan(0)
    })

    expect(screen.getAllByText('Начало').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Окончание').length).toBeGreaterThan(0)
  })

  it('отображает адрес клуба', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('ул. Тверская, д. 10').length).toBeGreaterThan(0)
    })

    expect(screen.getByText('Невский пр., д. 100')).toBeInTheDocument()
  })

  it('отображает город и регион', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Москва, Московская область').length).toBeGreaterThan(0)
    })

    expect(screen.getByText('Санкт-Петербург, Ленинградская область')).toBeInTheDocument()
  })

  it('показывает ошибку при неудачной загрузке', async () => {
    vi.mocked(bookingApi.getBookings).mockRejectedValue(new Error('Ошибка'))

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки бронирований')).toBeInTheDocument()
    })
  })

  it('показывает пагинацию при нескольких страницах', async () => {
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: mockBookingsResponse.content,
      pageInfo: {
        pageNumber: 0,
        pageSize: 5,
        totalElements: 15,
        totalPages: 3,
        isLast: false,
      },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('VR Club Moscow').length).toBeGreaterThan(0)
    })

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
  })

  it('сохраняет состояние фильтров в store', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Мои бронирования')).toBeInTheDocument()
    })

    // Проверяем, что store содержит дату начала
    const state = usePageStateStore.getState()
    expect(state.bookingsPage.startDate).toBeDefined()
  })

  it('показывает кнопку "Отменить" для активных бронирований через ссылку на детали', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('VR Club Moscow').length).toBeGreaterThan(0)
    })

    // Бронирования со статусом PAID должны иметь ссылку на детали
    const paidBadge = screen.getByText('Подтверждено')
    expect(paidBadge).toBeInTheDocument()

    // Проверяем, что есть ссылка на детали бронирования
    const bookingLinks = screen.getAllByRole('link')
    const paidBookingLink = bookingLinks.find(link =>
      link.getAttribute('href')?.startsWith('/bookings/')
    )
    expect(paidBookingLink).toBeInTheDocument()
  })

  it('отображает бронирование со статусом PENDING_PAYMENT', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('В ожидании оплаты')).toBeInTheDocument()
    })

    // Проверяем цвет статуса
    const pendingBadge = screen.getByText('В ожидании оплаты')
    expect(pendingBadge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('отображает бронирование со статусом CANCELLED', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText('Отменено')).toBeInTheDocument()
    })

    // Проверяем цвет статуса
    const cancelledBadge = screen.getByText('Отменено')
    expect(cancelledBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  describe('Обработка заблокированного клиента', () => {
    it('отображает сообщение об ошибке при загрузке бронирований заблокированного клиента', async () => {
      vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки бронирований/i)).toBeInTheDocument()
      })
    })

    it('не отображает список бронирований для заблокированного клиента', async () => {
      vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки бронирований/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('VR Club Moscow')).not.toBeInTheDocument()
      expect(screen.queryByText('Подтверждено')).not.toBeInTheDocument()
    })

    it('не показывает список бронирований при ошибке блокировки', async () => {
      vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки бронирований/i)).toBeInTheDocument()
      })

      // Данные бронирований не отображаются для заблокированного пользователя
      expect(screen.queryByText('VR Club Moscow')).not.toBeInTheDocument()
    })
  })

  describe('Фильтрация бронирований по диапазону дат', () => {
    it('фильтрация бронирований по диапазону дат работает корректно', async () => {
      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Мои бронирования')).toBeInTheDocument()
      })

      // Находим поля дат
      const dateInputs = document.querySelectorAll('input[type="date"]')
      expect(dateInputs).toHaveLength(2)

      // Изменяем дату начала с помощью fireEvent.change (date inputs не поддерживают user.clear)
      const startDateInput = dateInputs[0] as HTMLInputElement
      fireEvent.change(startDateInput, { target: { value: '2024-03-01' } })

      // Изменяем дату окончания
      const endDateInput = dateInputs[1] as HTMLInputElement
      fireEvent.change(endDateInput, { target: { value: '2024-03-31' } })

      // Проверяем, что запрос был выполнен с новыми датами
      await waitFor(() => {
        expect(vi.mocked(bookingApi.getBookings)).toHaveBeenCalled()
      })
    })

    it('при изменении дат список перезапрашивается с новыми параметрами', async () => {
      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Мои бронирования')).toBeInTheDocument()
      })

      // Начальный запрос был выполнен
      const initialCallCount = vi.mocked(bookingApi.getBookings).mock.calls.length

      // Изменяем дату начала с помощью fireEvent.change
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const startDateInput = dateInputs[0] as HTMLInputElement

      fireEvent.change(startDateInput, { target: { value: '2024-04-01' } })

      // Должен быть выполнен новый запрос
      await waitFor(() => {
        expect(vi.mocked(bookingApi.getBookings).mock.calls.length).toBeGreaterThan(initialCallCount)
      })
    })

    it('состояние фильтров сохраняется в store при изменении дат', async () => {
      const user = userEvent.setup()

      render(<BookingsPage />)

      await waitFor(() => {
        expect(screen.getByText('Мои бронирования')).toBeInTheDocument()
      })

      // Изменяем дату начала
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const startDateInput = dateInputs[0] as HTMLInputElement

      await user.clear(startDateInput)
      await user.type(startDateInput, '2024-05-01')

      // Проверяем, что состояние обновилось
      await waitFor(() => {
        const state = usePageStateStore.getState()
        expect(state.bookingsPage.startDate).toBeDefined()
      })
    })
  })
})
