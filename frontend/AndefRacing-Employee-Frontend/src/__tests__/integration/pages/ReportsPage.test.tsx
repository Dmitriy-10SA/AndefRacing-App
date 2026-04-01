import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import ReportsPage from '@/pages/management/ReportsPage'
import { useAuthStore } from '@/stores/authStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import { mockClubs } from '../mocks/handlers'
import { reportsApi } from '@/api/reportsApi'
import { AxiosError } from 'axios'

// Мокаем useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Мокаем API модуль
vi.mock('@/api/reportsApi')

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

const mockBookingStats = {
  clubId: 1,
  startDate: '2024-03-01',
  endDate: '2024-03-31',
  bookingsCount: 150,
  cancellationsPercent: 5.5,
  dateAndBookingsCountDtoList: [
    { date: '2024-03-01', bookingsCount: 50 },
    { date: '2024-03-02', bookingsCount: 45 },
    { date: '2024-03-03', bookingsCount: 55 },
  ],
}

const mockFinancialStats = {
  clubId: 1,
  startDate: '2024-03-01',
  endDate: '2024-03-31',
  totalRevenue: 450000,
  averageReceipt: 3000,
  dateAndTotalRevenues: [
    { date: '2024-03-01', revenue: 150000 },
    { date: '2024-03-02', revenue: 135000 },
    { date: '2024-03-03', revenue: 165000 },
  ],
}

describe('ReportsPage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePageStateStore.getState().resetReportsPageState()

    // Устанавливаем текущий клуб
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтные моки для успешных ответов
    vi.mocked(reportsApi.getBookingStatistics).mockResolvedValue(mockBookingStats)
    vi.mocked(reportsApi.getFinancialStatistics).mockResolvedValue(mockFinancialStats)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает страницу отчетов', () => {
    render(<ReportsPage />)

    expect(screen.getByText('Отчеты')).toBeInTheDocument()
    expect(screen.getByText('Параметры отчета')).toBeInTheDocument()
  })

  it('отображает фильтры отчетов', () => {
    render(<ReportsPage />)

    expect(screen.getByText('Тип отчета')).toBeInTheDocument()
    expect(screen.getByText('Дата начала')).toBeInTheDocument()
    expect(screen.getByText('Дата окончания')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Сформировать отчет/i })).toBeInTheDocument()
  })

  it('содержит селект типа отчета с двумя опциями', () => {
    render(<ReportsPage />)

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('Статистика бронирований')
    expect(options[1]).toHaveTextContent('Финансовая статистика')
  })

  it('генерирует отчет по бронированиям', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    // Нажимаем кнопку генерации отчета
    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Всего бронирований')).toBeInTheDocument()
    })

    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('5.5%')).toBeInTheDocument()
    expect(screen.getByText('Процент отмен')).toBeInTheDocument()
  })

  it('отображает таблицу бронирований по дням', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Бронирования по дням')).toBeInTheDocument()
    })

    expect(screen.getByText('Дата')).toBeInTheDocument()
    expect(screen.getByText('Количество бронирований')).toBeInTheDocument()
  })

  it('генерирует финансовый отчет', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    // Меняем тип отчета на финансовый
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'financial')

    // Генерируем отчет
    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    // Ждем загрузки данных
    await waitFor(() => {
      expect(screen.getByText('Общая выручка')).toBeInTheDocument()
    })

    expect(screen.getByText('Средний чек')).toBeInTheDocument()
  })

  it('отображает таблицу выручки по дням', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'financial')

    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Выручка по дням')).toBeInTheDocument()
    })

    expect(screen.getByText('Выручка')).toBeInTheDocument()
  })

  it('показывает состояние загрузки при генерации отчета', async () => {
    const user = userEvent.setup()

    // Задержка в моке для имитации загрузки
    vi.mocked(reportsApi.getBookingStatistics).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBookingStats), 100))
    )

    render(<ReportsPage />)

    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('показывает ошибку при неудачной загрузке отчета', async () => {
    const user = userEvent.setup()

    vi.mocked(reportsApi.getBookingStatistics).mockRejectedValue(new Error('Ошибка'))

    render(<ReportsPage />)

    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки отчета')).toBeInTheDocument()
    })
  })

  it('позволяет изменять дату начала', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    const dateInputs = document.querySelectorAll('input[type="date"]')
    const startDateInput = dateInputs[0] as HTMLInputElement

    await user.clear(startDateInput)
    await user.type(startDateInput, '2024-03-01')

    expect(startDateInput.value).toBe('2024-03-01')
  })

  it('позволяет изменять дату окончания', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    const dateInputs = document.querySelectorAll('input[type="date"]')
    const endDateInput = dateInputs[1] as HTMLInputElement

    await user.clear(endDateInput)
    await user.type(endDateInput, '2024-03-31')

    expect(endDateInput.value).toBe('2024-03-31')
  })

  it('сбрасывает состояние при смене типа отчета', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    // Генерируем отчет по бронированиям
    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Всего бронирований')).toBeInTheDocument()
    })

    // Меняем тип отчета
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'financial')

    // Старый отчет должен исчезнуть
    expect(screen.queryByText('Всего бронирований')).not.toBeInTheDocument()
  })

  it('отображает период отчета при успешной загрузке', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
    await user.click(generateButton)

    await waitFor(() => {
      expect(screen.getByText('Всего бронирований')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Проверяем что период отображается
    expect(screen.getByText('Период')).toBeInTheDocument()
  })

  it('сохраняет состояние фильтров в store', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'financial')

    const state = usePageStateStore.getState()
    expect(state.reportsPage.reportType).toBe('financial')
  })

  describe('Статистика бронирований', () => {
    it('отображает корректное количество бронирований', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('150')).toBeInTheDocument()
      })
    })

    it('отображает корректный процент отмен', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('5.5%')).toBeInTheDocument()
      })
    })

    it('отображает данные по дням в таблице', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Бронирования по дням')).toBeInTheDocument()
      })

      // Проверяем заголовки таблицы
      expect(screen.getByText('Дата')).toBeInTheDocument()
      expect(screen.getByText('Количество бронирований')).toBeInTheDocument()

      // Проверяем наличие данных
      expect(screen.getByText('50')).toBeInTheDocument()
      expect(screen.getByText('45')).toBeInTheDocument()
      expect(screen.getByText('55')).toBeInTheDocument()
    })

    it('отображает период отчета', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Период')).toBeInTheDocument()
      })
    })
  })

  describe('Финансовая статистика', () => {
    it('отображает общую выручку', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'financial')

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Общая выручка')).toBeInTheDocument()
      })

      // 450000 форматируется как "450 000 ₽"
      expect(screen.getByText(/450\s*000\s*₽/)).toBeInTheDocument()
    })

    it('отображает средний чек', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'financial')

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Средний чек')).toBeInTheDocument()
      })

      // 3000 форматируется как "3 000 ₽"
      expect(screen.getByText(/3\s*000\s*₽/)).toBeInTheDocument()
    })

    it('отображает выручку по дням в таблице', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'financial')

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Выручка по дням')).toBeInTheDocument()
      })

      // Проверяем заголовки таблицы
      expect(screen.getByText('Дата')).toBeInTheDocument()
      expect(screen.getByText('Выручка')).toBeInTheDocument()
    })

    it('корректно отображает период финансового отчета', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'financial')

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Период')).toBeInTheDocument()
      })
    })
  })

  describe('Фильтрация по датам', () => {
    it('ограничивает дату окончания минимальным значением даты начала', () => {
      render(<ReportsPage />)

      const dateInputs = document.querySelectorAll('input[type="date"]')
      const startDateInput = dateInputs[0] as HTMLInputElement
      const endDateInput = dateInputs[1] as HTMLInputElement

      expect(endDateInput.min).toBe(startDateInput.value)
    })

    it('ограничивает дату начала максимальным значением даты окончания', () => {
      render(<ReportsPage />)

      const dateInputs = document.querySelectorAll('input[type="date"]')
      const startDateInput = dateInputs[0] as HTMLInputElement
      const endDateInput = dateInputs[1] as HTMLInputElement

      expect(startDateInput.max).toBe(endDateInput.value)
    })

    it('перезапрашивает данные при изменении дат и повторной генерации', async () => {
      const user = userEvent.setup()

      render(<ReportsPage />)

      // Первая генерация
      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Всего бронирований')).toBeInTheDocument()
      })

      expect(vi.mocked(reportsApi.getBookingStatistics)).toHaveBeenCalledTimes(1)

      // Изменяем дату
      const dateInputs = document.querySelectorAll('input[type="date"]')
      const startDateInput = dateInputs[0] as HTMLInputElement

      await user.clear(startDateInput)
      await user.type(startDateInput, '2024-02-01')

      // Вторая генерация
      await user.click(generateButton)

      await waitFor(() => {
        expect(vi.mocked(reportsApi.getBookingStatistics)).toHaveBeenCalledTimes(2)
      })
    })
  })

  describe('Корректность расчётов', () => {
    it('отображает корректную сумму бронирований из данных', async () => {
      const user = userEvent.setup()

      // Мок с определенными данными
      vi.mocked(reportsApi.getBookingStatistics).mockResolvedValue({
        clubId: 1,
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        bookingsCount: 250,
        cancellationsPercent: 10.0,
        dateAndBookingsCountDtoList: [
          { date: '2024-03-01', bookingsCount: 100 },
          { date: '2024-03-02', bookingsCount: 150 },
        ],
      })

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('250')).toBeInTheDocument()
        expect(screen.getByText('10.0%')).toBeInTheDocument()
      })
    })

    it('отображает корректную выручку из данных', async () => {
      const user = userEvent.setup()

      vi.mocked(reportsApi.getFinancialStatistics).mockResolvedValue({
        clubId: 1,
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        totalRevenue: 1000000,
        averageReceipt: 5000,
        dateAndTotalRevenues: [
          { date: '2024-03-01', revenue: 500000 },
          { date: '2024-03-02', revenue: 500000 },
        ],
      })

      render(<ReportsPage />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'financial')

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('Общая выручка')).toBeInTheDocument()
      })

      // 1000000 форматируется как "1 000 000 ₽"
      expect(screen.getByText(/1\s*000\s*000\s*₽/)).toBeInTheDocument()
    })

    it('отображает нулевые значения корректно', async () => {
      const user = userEvent.setup()

      vi.mocked(reportsApi.getBookingStatistics).mockResolvedValue({
        clubId: 1,
        startDate: '2024-03-01',
        endDate: '2024-03-31',
        bookingsCount: 0,
        cancellationsPercent: 0,
        dateAndBookingsCountDtoList: [],
      })

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('0.0%')).toBeInTheDocument()
      })
    })
  })

  describe('Обработка заблокированного сотрудника', () => {
    it('отображает сообщение об ошибке при генерации отчета заблокированным сотрудником', async () => {
      const user = userEvent.setup()

      vi.mocked(reportsApi.getBookingStatistics).mockRejectedValue(createBlockedError())

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки отчета/i)).toBeInTheDocument()
      })
    })

    it('не отображает данные отчета для заблокированного сотрудника', async () => {
      const user = userEvent.setup()

      vi.mocked(reportsApi.getBookingStatistics).mockRejectedValue(createBlockedError())

      render(<ReportsPage />)

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки отчета/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('Всего бронирований')).not.toBeInTheDocument()
      expect(screen.queryByText('Процент отмен')).not.toBeInTheDocument()
    })

    it('отображает сообщение об ошибке при генерации финансового отчета заблокированным сотрудником', async () => {
      const user = userEvent.setup()

      vi.mocked(reportsApi.getFinancialStatistics).mockRejectedValue(createBlockedError())

      render(<ReportsPage />)

      const select = screen.getByRole('combobox')
      await user.selectOptions(select, 'financial')

      const generateButton = screen.getByRole('button', { name: /Сформировать отчет/i })
      await user.click(generateButton)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки отчета/i)).toBeInTheDocument()
      })
    })
  })
})
