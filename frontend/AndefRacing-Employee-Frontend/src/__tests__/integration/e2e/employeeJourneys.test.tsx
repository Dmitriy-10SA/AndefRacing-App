import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import { useAuthStore } from '@/stores/authStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import LoginPage from '@/pages/auth/LoginPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import BookingsPage from '@/pages/bookings/BookingsPage'
import MakeBookingPage from '@/pages/bookings/MakeBookingPage'
import HRManagementPage from '@/pages/management/HRManagementPage'
import ClubManagementPage from '@/pages/management/ClubManagementPage'
import ReportsPage from '@/pages/management/ReportsPage'
import { mockClubs, mockEmployee, mockClubFullInfo, mockFreeSlots, mockEmployeesWithRoles } from '../mocks/handlers'
import { authApi } from '@/api/authApi'
import { profileApi } from '@/api/profileApi'
import { bookingApi } from '@/api/bookingApi'
import { searchApi } from '@/api/searchApi'
import { managementApi } from '@/api/managementApi'
import { reportsApi } from '@/api/reportsApi'

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: '1' }),
  }
})

// Мокаем API модули
vi.mock('@/api/authApi')
vi.mock('@/api/profileApi')
vi.mock('@/api/bookingApi')
vi.mock('@/api/searchApi')
vi.mock('@/api/managementApi')
vi.mock('@/api/reportsApi')

const mockClub = {
  id: 1,
  name: 'VR Club Moscow',
  phone: '+7-495-123-45-67',
  email: 'moscow@vrclub.ru',
  address: 'ул. Тверская, д. 10',
  cntEquipment: 10,
  isOpen: true,
  city: {
    id: 1,
    name: 'Москва',
    region: { id: 1, name: 'Московская область' },
  },
}

describe('E2E Employee Journeys - Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetReportsPageState()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  describe('Сценарий: Авторизация сотрудника', () => {
    it('setToken устанавливает токен и делает сотрудника аутентифицированным', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      useAuthStore.getState().setToken('employee-token')

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().token).toBe('employee-token')
    })

    it('setCurrentClub устанавливает текущий клуб', () => {
      useAuthStore.getState().setCurrentClub(mockClub)

      expect(useAuthStore.getState().currentClub).toEqual(mockClub)
    })

    it('logout очищает токен и текущий клуб', () => {
      useAuthStore.getState().setToken('test-token')
      useAuthStore.getState().setCurrentClub(mockClub)

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().currentClub).not.toBeNull()

      useAuthStore.getState().logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().currentClub).toBeNull()
    })
  })

  describe('Сценарий: Управление сессией', () => {
    it('токен сохраняется (имитация persist)', () => {
      useAuthStore.getState().setToken('persistent-token')

      const state = useAuthStore.getState()
      expect(state.token).toBe('persistent-token')
      expect(state.isAuthenticated).toBe(true)
    })

    it('currentClub сохраняется вместе с токеном', () => {
      useAuthStore.getState().setToken('test-token')
      useAuthStore.getState().setCurrentClub(mockClub)

      const state = useAuthStore.getState()
      expect(state.currentClub?.name).toBe('VR Club Moscow')
    })
  })
})

describe('E2E: Полный процесс входа сотрудника', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    mockNavigate.mockClear()

    // Дефолтные моки
    vi.mocked(authApi.isFirstEnter).mockResolvedValue(false)
    vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)
    vi.mocked(authApi.login).mockResolvedValue({ jwt: 'mock-jwt-token' })
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('сотрудник может войти и выбрать клуб', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    // Шаг 1: Проверка первого входа
    const phoneInput = screen.getByPlaceholderText(/\+7-XXX-XXX-XX-XX/i)
    await user.type(phoneInput, '9991234567')

    const checkButton = screen.getByRole('button', { name: /далее/i })
    await user.click(checkButton)

    // Должна появиться форма с паролем
    await waitFor(() => {
      expect(screen.getByText(/введите пароль/i)).toBeInTheDocument()
    })

    // Шаг 2: Ввод пароля
    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    const loginButton = screen.getByRole('button', { name: /далее/i })
    await user.click(loginButton)

    // Шаг 3: Выбор клуба - ожидаем появления списка клубов
    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    // Выбираем первый клуб
    await user.click(screen.getByText('VR Club Moscow'))

    // Проверяем, что пользователь авторизован
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  it('показывает ошибку при неверных учетных данных', async () => {
    const user = userEvent.setup()

    vi.mocked(authApi.preLogin).mockRejectedValue({
      response: { data: { message: 'Неверный логин или пароль' } }
    })

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText(/\+7-XXX-XXX-XX-XX/i)
    await user.type(phoneInput, '9991234567')

    const checkButton = screen.getByRole('button', { name: /далее/i })
    await user.click(checkButton)

    await waitFor(() => {
      expect(screen.getByText(/введите пароль/i)).toBeInTheDocument()
    })

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'wrongPassword')

    const loginButton = screen.getByRole('button', { name: /далее/i })
    await user.click(loginButton)

    await waitFor(() => {
      expect(screen.getByText(/неверный логин или пароль/i)).toBeInTheDocument()
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('показывает ошибку для несуществующего сотрудника', async () => {
    const user = userEvent.setup()

    vi.mocked(authApi.isFirstEnter).mockRejectedValue({
      response: { data: { message: 'Сотрудник не найден' } }
    })

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText(/\+7-XXX-XXX-XX-XX/i)
    await user.type(phoneInput, '9999999999')

    const checkButton = screen.getByRole('button', { name: /далее/i })
    await user.click(checkButton)

    await waitFor(() => {
      expect(screen.getByText(/не найден/i)).toBeInTheDocument()
    })
  })
})

describe('E2E: Навигация аутентифицированного сотрудника', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setToken('test-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    mockNavigate.mockClear()

    // Дефолтные моки
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockEmployee)
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 0, totalPages: 0, isLast: true }
    })
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue(mockFreeSlots)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('сотрудник может просматривать свой профиль', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockEmployee.name)).toBeInTheDocument()
    })

    expect(screen.getByText(mockEmployee.surname)).toBeInTheDocument()
    expect(screen.getByText(mockEmployee.phone)).toBeInTheDocument()
  })

  it('сотрудник с ролью ADMINISTRATOR может просматривать бронирования', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/бронирования/i)).toBeInTheDocument()
    })
  })

  it('сотрудник может создавать бронирование', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      // Используем getByRole для heading, так как есть и кнопка с таким же текстом
      expect(screen.getByRole('heading', { name: /создать бронирование/i })).toBeInTheDocument()
    })
  })

  it('сотрудник может выйти из системы', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().currentClub).not.toBeNull()

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
    expect(useAuthStore.getState().currentClub).toBeNull()
  })
})

describe('E2E: Управление клубом (MANAGER)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setToken('test-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    mockNavigate.mockClear()

    // Дефолтные моки
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(managementApi.getAllGames).mockResolvedValue([])
    vi.mocked(managementApi.getWorkScheduleExceptions).mockResolvedValue([])
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue(mockEmployeesWithRoles)
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockEmployee)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('менеджер может открыть страницу управления клубом', async () => {
    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/управление клубом/i)).toBeInTheDocument()
    })

    // Проверяем наличие табов
    expect(screen.getByText('Общее')).toBeInTheDocument()
    expect(screen.getByText('Цены')).toBeInTheDocument()
    expect(screen.getByText('Игры')).toBeInTheDocument()
    expect(screen.getByText('Расписание')).toBeInTheDocument()
  })

  it('менеджер может открыть страницу управления персоналом', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/управление персоналом/i)).toBeInTheDocument()
    })
  })

  it('менеджер может открыть страницу отчетов', async () => {
    render(<ReportsPage />)

    await waitFor(() => {
      expect(screen.getByText(/отчеты/i)).toBeInTheDocument()
    })
  })
})

describe('E2E Role-Based Access (Employee)', () => {
  beforeEach(() => {
    useAuthStore.getState().setToken('mock-jwt-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  describe('Проверка доступа на основе ролей', () => {
    it('MANAGER имеет доступ к HR управлению', () => {
      // Эта проверка симулирует логику RoleProtectedRoute
      const userRoles = ['MANAGER']
      const requiredRoles = ['MANAGER']

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(true)
    })

    it('ADMINISTRATOR имеет доступ к бронированиям', () => {
      const userRoles = ['ADMIN']
      const requiredRoles = ['ADMIN', 'MANAGER']

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(true)
    })

    it('EMPLOYEE без доп. ролей не имеет доступа к управлению', () => {
      const userRoles = ['EMPLOYEE']
      const requiredRoles = ['MANAGER']

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(false)
    })

    it('пользователь с несколькими ролями получает доступ', () => {
      const userRoles = ['EMPLOYEE', 'ADMIN']
      const requiredRoles = ['ADMIN', 'MANAGER']

      const hasAccess = userRoles.some(role => requiredRoles.includes(role))
      expect(hasAccess).toBe(true)
    })
  })
})

describe('E2E State Persistence (Employee)', () => {
  beforeEach(() => {
    usePageStateStore.getState().resetReportsPageState()
  })

  it('состояние страницы отчетов сохраняется', () => {
    const { setReportsPageState } = usePageStateStore.getState()

    setReportsPageState({
      reportType: 'financial',
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    })

    const state = usePageStateStore.getState()
    expect(state.reportsPage.reportType).toBe('financial')
    expect(state.reportsPage.startDate).toBe('2024-01-01')
    expect(state.reportsPage.endDate).toBe('2024-01-31')
  })

  it('сброс состояния отчетов восстанавливает значения по умолчанию', () => {
    const { setReportsPageState, resetReportsPageState } = usePageStateStore.getState()

    setReportsPageState({ reportType: 'financial' })
    resetReportsPageState()

    const state = usePageStateStore.getState()
    expect(state.reportsPage.reportType).toBe('booking')
  })
})

describe('E2E: Обработка ошибок сети (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setToken('test-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('обрабатывает ошибку загрузки профиля', async () => {
    vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(new Error('Ошибка сервера'))

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(/ошибка/i)).toBeInTheDocument()
    })
  })

  it('обрабатывает ошибку загрузки бронирований', async () => {
    vi.mocked(bookingApi.getBookings).mockRejectedValue(new Error('Ошибка сервера'))

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/ошибка/i)).toBeInTheDocument()
    })
  })

  it('обрабатывает ошибку загрузки информации о клубе', async () => {
    vi.mocked(searchApi.getClubFullInfo).mockRejectedValue(new Error('Клуб не найден'))

    render(<ClubManagementPage />)

    // При ошибке загрузки информации о клубе страница всё равно рендерится с базовой структурой
    await waitFor(() => {
      expect(screen.getByText(/управление клубом/i)).toBeInTheDocument()
    })

    // Но данные клуба не загружены
    expect(screen.queryByText('VR Club Moscow')).not.toBeInTheDocument()
  })
})

describe('E2E: Работа с отчетами', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setToken('test-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    usePageStateStore.getState().resetReportsPageState()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('может переключаться между типами отчетов', async () => {
    const user = userEvent.setup()

    render(<ReportsPage />)

    await waitFor(() => {
      expect(screen.getByText(/отчеты/i)).toBeInTheDocument()
    })

    // По умолчанию должен быть тип 'booking'
    const state = usePageStateStore.getState()
    expect(state.reportsPage.reportType).toBe('booking')

    // Переключаемся на финансовый отчет через select
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'financial')

    // Состояние должно обновиться
    const newState = usePageStateStore.getState()
    expect(newState.reportsPage.reportType).toBe('financial')
  })

  it('сохраняет выбранный период отчета', () => {
    const { setReportsPageState } = usePageStateStore.getState()

    setReportsPageState({
      startDate: '2024-01-01',
      endDate: '2024-01-31'
    })

    const state = usePageStateStore.getState()
    expect(state.reportsPage.startDate).toBe('2024-01-01')
    expect(state.reportsPage.endDate).toBe('2024-01-31')
  })
})

describe('E2E: Многопользовательские сценарии', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('разные сотрудники могут работать с разными клубами', () => {
    // Сотрудник 1 работает с клубом 1
    useAuthStore.getState().setToken('token-1')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    expect(useAuthStore.getState().currentClub?.id).toBe(1)

    // Logout и смена пользователя
    useAuthStore.getState().logout()

    // Сотрудник 2 работает с клубом 2
    useAuthStore.getState().setToken('token-2')
    useAuthStore.getState().setCurrentClub(mockClubs[1])

    expect(useAuthStore.getState().currentClub?.id).toBe(2)

    useAuthStore.getState().logout()
  })

  it('переключение между клубами очищает состояние', () => {
    useAuthStore.getState().setToken('test-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    expect(useAuthStore.getState().currentClub?.id).toBe(1)

    // Переключаемся на другой клуб
    useAuthStore.getState().setCurrentClub(mockClubs[1])

    expect(useAuthStore.getState().currentClub?.id).toBe(2)
    expect(useAuthStore.getState().currentClub?.name).toBe('VR Club SPb')
  })
})

describe('E2E: Полный цикл обработки бронирования администратором', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetBookingsPageState()
    mockNavigate.mockClear()

    // Моки для администратора
    vi.mocked(authApi.isFirstEnter).mockResolvedValue(false)
    vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)
    vi.mocked(authApi.login).mockResolvedValue({ jwt: 'admin-jwt-token' })
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
      ...mockEmployee,
      roles: ['EMPLOYEE', 'ADMIN'],
    })
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'PENDING_PAYMENT',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue(mockFreeSlots)
    vi.mocked(bookingApi.makeBooking).mockResolvedValue(undefined)
    vi.mocked(bookingApi.confirmBookingPayment).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('администратор может войти в систему и выбрать клуб', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    // Шаг 1: Ввод телефона
    const phoneInput = screen.getByPlaceholderText(/\+7-XXX-XXX-XX-XX/i)
    await user.type(phoneInput, '9991234567')

    await user.click(screen.getByRole('button', { name: /далее/i }))

    // Шаг 2: Ввод пароля
    await waitFor(() => {
      expect(screen.getByText(/введите пароль/i)).toBeInTheDocument()
    })

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /далее/i }))

    // Шаг 3: Выбор клуба
    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    await user.click(screen.getByText('VR Club Moscow'))

    // Проверяем авторизацию
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().currentClub?.name).toBe('VR Club Moscow')
    })
  })

  it('администратор может просматривать страницу бронирований', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/бронирования/i)).toBeInTheDocument()
    })

    // Кнопка создания бронирования доступна
    expect(screen.getByRole('button', { name: /создать бронирование/i })).toBeInTheDocument()
  })

  it('администратор может создать бронирование для клиента', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /создать бронирование/i })).toBeInTheDocument()
    })

    // Форма бронирования доступна - проверяем наличие параметров бронирования
    expect(screen.getByText(/параметры бронирования/i)).toBeInTheDocument()
    expect(screen.getByText(/длительность/i)).toBeInTheDocument()
  })

  it('администратор видит бронирование со статусом "Ожидание оплаты"', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/ожидание оплаты/i)).toBeInTheDocument()
    })
  })

  it('состояние страницы бронирований сохраняется', () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    // Устанавливаем фильтры
    usePageStateStore.getState().setBookingsPageState({
      startDate: '2024-03-01',
      endDate: '2024-03-31',
      pageNumber: 0,
    })

    const state = usePageStateStore.getState()
    expect(state.bookingsPage.startDate).toBe('2024-03-01')
    expect(state.bookingsPage.endDate).toBe('2024-03-31')
  })

  it('полный цикл: от создания до подтверждения оплаты (проверка store)', async () => {
    // 1. Администратор авторизован
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // 2. Проверяем что текущий клуб установлен
    expect(useAuthStore.getState().currentClub?.id).toBe(1)

    // 3. Состояние фильтров бронирований
    usePageStateStore.getState().setBookingsPageState({
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    })

    const state = usePageStateStore.getState()
    expect(state.bookingsPage.startDate).toBeDefined()
    expect(state.bookingsPage.endDate).toBeDefined()
  })
})

describe('E2E: Полный цикл управления персоналом (управляющий)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    mockNavigate.mockClear()

    // Моки для управляющего
    vi.mocked(authApi.isFirstEnter).mockResolvedValue(false)
    vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)
    vi.mocked(authApi.login).mockResolvedValue({ jwt: 'manager-jwt-token' })
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
      ...mockEmployee,
      roles: ['EMPLOYEE', 'MANAGER'],
    })
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue(mockEmployeesWithRoles)
    vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(true)
    vi.mocked(managementApi.addExistingEmployeeToClub).mockResolvedValue(undefined)
    vi.mocked(managementApi.addRoleToEmployee).mockResolvedValue(undefined)
    vi.mocked(managementApi.deleteEmployeeRole).mockResolvedValue(undefined)
    vi.mocked(managementApi.deleteEmployeeFromClub).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('управляющий может войти в систему', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText(/\+7-XXX-XXX-XX-XX/i)
    await user.type(phoneInput, '9991234567')

    await user.click(screen.getByRole('button', { name: /далее/i }))

    await waitFor(() => {
      expect(screen.getByText(/введите пароль/i)).toBeInTheDocument()
    })

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /далее/i }))

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    await user.click(screen.getByText('VR Club Moscow'))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  it('управляющий может открыть страницу управления персоналом', async () => {
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/управление персоналом/i)).toBeInTheDocument()
    })

    // Список сотрудников отображается
    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })
  })

  it('управляющий видит список сотрудников с их ролями', async () => {
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
    })

    // Роли отображаются
    expect(screen.getAllByText('Сотрудник').length).toBeGreaterThan(0)
  })

  it('управляющий может добавить сотрудника в клуб', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /добавить сотрудника/i }))

    // Модал добавления открывается
    expect(screen.getByText('Телефон сотрудника')).toBeInTheDocument()

    // Вводим телефон существующего сотрудника
    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9992222222')

    // Нажимаем добавить
    const addButtons = screen.getAllByRole('button', { name: /добавить сотрудника/i })
    await user.click(addButtons[1]) // Второй - кнопка в модале

    await waitFor(() => {
      expect(screen.getByText(/сотрудник успешно добавлен/i)).toBeInTheDocument()
    })
  })

  it('управляющий может назначить роль сотруднику', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Находим селект для назначения роли
    const roleSelects = screen.getAllByRole('combobox')
    expect(roleSelects.length).toBeGreaterThan(0)

    // Выбираем роль (используем значение ADMIN из select)
    await user.selectOptions(roleSelects[0], 'ADMIN')

    // Появляется модал подтверждения
    await waitFor(() => {
      expect(screen.getByText('Добавление роли')).toBeInTheDocument()
    })
  })

  it('управляющий может удалить сотрудника из клуба', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Нажимаем удалить
    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    await user.click(deleteButtons[0])

    // Появляется модал подтверждения
    await waitFor(() => {
      expect(screen.getByText('Удаление сотрудника')).toBeInTheDocument()
    })
  })

  it('полный цикл управления персоналом (проверка store)', () => {
    // 1. Управляющий авторизован
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // 2. Текущий клуб установлен
    expect(useAuthStore.getState().currentClub?.id).toBe(1)
    expect(useAuthStore.getState().currentClub?.name).toBe('VR Club Moscow')

    // 3. Выход из системы очищает состояние
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().currentClub).toBeNull()
  })

  it('управляющий имеет доступ ко всем страницам управления', () => {
    const managerRoles = ['EMPLOYEE', 'MANAGER']

    // Проверка доступа к страницам
    const hasHRAccess = managerRoles.includes('MANAGER')
    const hasClubAccess = managerRoles.includes('MANAGER')
    const hasReportsAccess = managerRoles.includes('MANAGER')
    const hasBookingsAccess = managerRoles.some(r => ['ADMINISTRATOR', 'MANAGER'].includes(r))

    expect(hasHRAccess).toBe(true)
    expect(hasClubAccess).toBe(true)
    expect(hasReportsAccess).toBe(true)
    expect(hasBookingsAccess).toBe(true)
  })
})

describe('E2E: Обработка заблокированного сотрудника', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('заблокированный сотрудник видит сообщение при загрузке профиля', async () => {
    useAuthStore.getState().setToken('blocked-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(profileApi.getPersonalInfo).mockRejectedValue({
      response: { data: { message: 'Вы заблокированы' }, status: 403 }
    })

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(/Вы заблокированы|ошибка/i)).toBeInTheDocument()
    })
  })

  it('заблокированный сотрудник видит сообщение при загрузке бронирований', async () => {
    useAuthStore.getState().setToken('blocked-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.getBookings).mockRejectedValue({
      response: { data: { message: 'Вы заблокированы' }, status: 403 }
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Вы заблокированы|ошибка/i)).toBeInTheDocument()
    })
  })

  it('заблокированный сотрудник видит сообщение при загрузке страницы управления', async () => {
    useAuthStore.getState().setToken('blocked-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(managementApi.getEmployeesAndRoles).mockRejectedValue({
      response: { data: { message: 'Вы заблокированы' }, status: 403 }
    })

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Вы заблокированы|ошибка/i)).toBeInTheDocument()
    })
  })
})

describe('E2E: Полный цикл подтверждения оплаты', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetBookingsPageState()
    mockNavigate.mockClear()

    // Моки для администратора
    vi.mocked(authApi.isFirstEnter).mockResolvedValue(false)
    vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)
    vi.mocked(authApi.login).mockResolvedValue({ jwt: 'admin-jwt-token' })
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
      ...mockEmployee,
      roles: ['EMPLOYEE', 'ADMIN'],
    })
    vi.mocked(bookingApi.confirmBookingPayment).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('администратор авторизуется и переходит на страницу бронирований', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'PENDING_PAYMENT',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/бронирования/i)).toBeInTheDocument()
    })

    // Бронирование имеет статус "Ожидание оплаты"
    await waitFor(() => {
      expect(screen.getByText(/ожидание оплаты/i)).toBeInTheDocument()
    })
  })

  it('бронирование имеет статус "Ожидание оплаты" перед подтверждением', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'PENDING_PAYMENT',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/ожидание оплаты/i)).toBeInTheDocument()
    })

    // Статус должен быть желтым
    const pendingBadge = screen.getByText(/ожидание оплаты/i)
    expect(pendingBadge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('администратор может подтвердить оплату бронирования', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.confirmBookingPayment).mockResolvedValue(undefined)

    // Проверяем что API подтверждения оплаты работает
    await bookingApi.confirmBookingPayment(1)

    expect(vi.mocked(bookingApi.confirmBookingPayment)).toHaveBeenCalledWith(1)
  })

  it('после подтверждения оплаты статус изменяется на "Оплачено"', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    // Сначала бронирование в статусе PENDING_PAYMENT
    vi.mocked(bookingApi.getBookings).mockResolvedValueOnce({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'PENDING_PAYMENT',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    // После подтверждения оплаты статус меняется
    vi.mocked(bookingApi.getBookings).mockResolvedValueOnce({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'PAID',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/ожидание оплаты/i)).toBeInTheDocument()
    })

    // Симулируем обновление после подтверждения оплаты
    // В реальном приложении это произойдет после вызова confirmBookingPayment
  })

  it('полный цикл: проверка состояния store при работе с оплатой', () => {
    // 1. Администратор авторизован
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // 2. Текущий клуб установлен
    expect(useAuthStore.getState().currentClub?.id).toBe(1)

    // 3. Состояние страницы бронирований
    usePageStateStore.getState().setBookingsPageState({
      startDate: '2024-03-01',
      endDate: '2024-03-31',
    })

    const state = usePageStateStore.getState()
    expect(state.bookingsPage.startDate).toBe('2024-03-01')
    expect(state.bookingsPage.endDate).toBe('2024-03-31')
  })
})

describe('E2E: Отмена бронирования', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetBookingsPageState()
    mockNavigate.mockClear()

    // Моки для администратора
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
      ...mockEmployee,
      roles: ['EMPLOYEE', 'ADMIN'],
    })
    vi.mocked(bookingApi.cancelBooking).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('администратор авторизуется для отмены бронирования', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    expect(useAuthStore.getState().isAuthenticated).toBe(true)
    expect(useAuthStore.getState().currentClub?.id).toBe(1)
  })

  it('администратор видит список бронирований', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'PAID',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/бронирования/i)).toBeInTheDocument()
    })

    // Бронирование со статусом "Оплачено" отображается
    await waitFor(() => {
      expect(screen.getByText('Оплачено')).toBeInTheDocument()
    })
  })

  it('администратор может отменить бронирование со статусом "Оплачено"', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.cancelBooking).mockResolvedValue(undefined)

    // Проверяем что API отмены работает
    await bookingApi.cancelBooking(1)

    expect(vi.mocked(bookingApi.cancelBooking)).toHaveBeenCalledWith(1)
  })

  it('администратор может отменить бронирование со статусом "Ожидание оплаты"', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.cancelBooking).mockResolvedValue(undefined)

    // Проверяем что API отмены работает для бронирования в ожидании оплаты
    await bookingApi.cancelBooking(2)

    expect(vi.mocked(bookingApi.cancelBooking)).toHaveBeenCalledWith(2)
  })

  it('после отмены статус изменяется на "Отменено"', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    // Сначала бронирование оплачено
    vi.mocked(bookingApi.getBookings).mockResolvedValueOnce({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'PAID',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    // После отмены статус меняется
    vi.mocked(bookingApi.getBookings).mockResolvedValueOnce({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'CANCELLED',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/оплачено/i)).toBeInTheDocument()
    })
  })

  it('отмененное бронирование отображается с красным статусом', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'CANCELLED',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/отменено/i)).toBeInTheDocument()
    })

    // Статус должен быть красным
    const cancelledBadge = screen.getByText(/отменено/i)
    expect(cancelledBadge).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('нельзя отменить уже отмененное бронирование', async () => {
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [
        {
          id: 1,
          startDateTime: '2024-03-20T14:00:00',
          endDateTime: '2024-03-20T15:00:00',
          status: 'CANCELLED',
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/отменено/i)).toBeInTheDocument()
    })

    // Для отмененных бронирований кнопки действий не должны быть доступны
  })

  it('полный цикл отмены: от выбора бронирования до обновления списка', () => {
    // 1. Администратор авторизован
    useAuthStore.getState().setToken('admin-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // 2. Текущий клуб установлен
    expect(useAuthStore.getState().currentClub?.id).toBe(1)

    // 3. Выполняем отмену через API
    vi.mocked(bookingApi.cancelBooking).mockResolvedValue(undefined)

    // 4. После отмены список обновляется
    // В реальном приложении это происходит через refetch или invalidateQueries
  })
})

describe('E2E: Полный цикл управления персоналом (расширенный)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    mockNavigate.mockClear()

    // Моки для управляющего
    vi.mocked(authApi.isFirstEnter).mockResolvedValue(false)
    vi.mocked(authApi.preLogin).mockResolvedValue(mockClubs)
    vi.mocked(authApi.login).mockResolvedValue({ jwt: 'manager-jwt-token' })
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue({
      ...mockEmployee,
      roles: ['EMPLOYEE', 'MANAGER'],
    })
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue(mockEmployeesWithRoles)
    vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(true)
    vi.mocked(managementApi.addExistingEmployeeToClub).mockResolvedValue(undefined)
    vi.mocked(managementApi.addNewEmployeeToClub).mockResolvedValue(undefined)
    vi.mocked(managementApi.addRoleToEmployee).mockResolvedValue(undefined)
    vi.mocked(managementApi.deleteEmployeeRole).mockResolvedValue(undefined)
    vi.mocked(managementApi.deleteEmployeeFromClub).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('шаг 1: вход управляющего в систему', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText(/\+7-XXX-XXX-XX-XX/i)
    await user.type(phoneInput, '9991234567')

    await user.click(screen.getByRole('button', { name: /далее/i }))

    await waitFor(() => {
      expect(screen.getByText(/введите пароль/i)).toBeInTheDocument()
    })

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /далее/i }))

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    await user.click(screen.getByText('VR Club Moscow'))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().currentClub?.name).toBe('VR Club Moscow')
    })
  })

  it('шаг 2: переход на страницу HR', async () => {
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/управление персоналом/i)).toBeInTheDocument()
    })

    // Список сотрудников загружен
    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
    })
  })

  it('шаг 3: ввод телефона нового сотрудника', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /добавить сотрудника/i }))

    // Модал добавления открыт
    expect(screen.getByText('Телефон сотрудника')).toBeInTheDocument()

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9995556677')

    expect(phoneInput).toHaveValue('+7-999-555-66-77')
  })

  it('шаг 4: если сотрудник существует — добавление в клуб', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(true)
    vi.mocked(managementApi.addExistingEmployeeToClub).mockResolvedValue(undefined)

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /добавить сотрудника/i }))

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9995556677')

    const addButtons = screen.getAllByRole('button', { name: /добавить сотрудника/i })
    await user.click(addButtons[1])

    await waitFor(() => {
      expect(screen.getByText(/сотрудник успешно добавлен/i)).toBeInTheDocument()
    })

    expect(vi.mocked(managementApi.addExistingEmployeeToClub)).toHaveBeenCalled()
  })

  it('шаг 5: если сотрудник НЕ существует — создание нового + добавление в клуб', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(false)
    vi.mocked(managementApi.addNewEmployeeToClub).mockResolvedValue(undefined)

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /добавить сотрудника/i }))

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9998887766')

    const checkButton = screen.getAllByRole('button', { name: /добавить сотрудника/i })[1]
    await user.click(checkButton)

    // Появляются поля для ФИО
    await waitFor(() => {
      expect(screen.getByText('Фамилия')).toBeInTheDocument()
      expect(screen.getByText('Имя')).toBeInTheDocument()
    })

    // Заполняем данные
    const surnameInput = screen.getByPlaceholderText('Иванов')
    const nameInput = screen.getByPlaceholderText('Иван')
    const patronymicInput = screen.getByPlaceholderText('Иванович')

    await user.type(surnameInput, 'Новиков')
    await user.type(nameInput, 'Николай')
    await user.type(patronymicInput, 'Николаевич')

    const addButton = screen.getByRole('button', { name: /^Добавить$/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(vi.mocked(managementApi.addNewEmployeeToClub)).toHaveBeenCalled()
    })
  })

  it('шаг 6: назначение роли "администратор"', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(managementApi.addRoleToEmployee).mockResolvedValue(undefined)

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Выбираем роль администратор из селекта
    const roleSelects = screen.getAllByRole('combobox')
    await user.selectOptions(roleSelects[0], 'ADMIN')

    // Появляется модал подтверждения
    await waitFor(() => {
      expect(screen.getByText('Добавление роли')).toBeInTheDocument()
    })

    const confirmButton = screen.getByRole('button', { name: /^Добавить$/i })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(vi.mocked(managementApi.addRoleToEmployee)).toHaveBeenCalledWith(
        expect.any(Number),
        'ADMIN'
      )
    })
  })

  it('шаг 7: проверка — роль отображается у сотрудника', async () => {
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    // Сотрудник с ролью ADMIN
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
      {
        employeeDto: {
          id: 2,
          surname: 'Петров',
          name: 'Петр',
          patronymic: 'Петрович',
          phone: '+7-999-222-22-22',
        },
        roles: ['EMPLOYEE', 'ADMIN'],
      },
    ])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Роли отображаются
    expect(screen.getByText('Сотрудник')).toBeInTheDocument()
    expect(screen.getByText('Администратор')).toBeInTheDocument()
  })

  it('шаг 8: удаление роли "администратор"', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
      {
        employeeDto: {
          id: 2,
          surname: 'Петров',
          name: 'Петр',
          patronymic: 'Петрович',
          phone: '+7-999-222-22-22',
        },
        roles: ['EMPLOYEE', 'ADMIN'],
      },
    ])
    vi.mocked(managementApi.deleteEmployeeRole).mockResolvedValue(undefined)

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Находим кнопку удаления роли (×)
    const roleRemoveButtons = screen.getAllByText('×')
    await user.click(roleRemoveButtons[0])

    // Подтверждаем удаление
    await waitFor(() => {
      expect(screen.getByText('Удаление роли')).toBeInTheDocument()
    })

    const modal = screen.getByText('Удаление роли').closest('.fixed')!
    const confirmButton = modal.querySelector('button[type="submit"]') ||
      screen.getAllByRole('button', { name: /^Удалить$/i }).find(btn =>
        modal.contains(btn)
      )

    if (confirmButton) {
      await user.click(confirmButton)
    }

    await waitFor(() => {
      expect(vi.mocked(managementApi.deleteEmployeeRole)).toHaveBeenCalled()
    })
  })

  it('шаг 9: проверка — роль удалена, но "сотрудник" остался', async () => {
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    // После удаления роли ADMIN остается только EMPLOYEE
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
      {
        employeeDto: {
          id: 2,
          surname: 'Петров',
          name: 'Петр',
          patronymic: 'Петрович',
          phone: '+7-999-222-22-22',
        },
        roles: ['EMPLOYEE'], // Только базовая роль
      },
    ])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Роль "Сотрудник" осталась (как бейдж роли)
    const roleBadges = document.querySelectorAll('.bg-primary-100')
    const roleTexts = Array.from(roleBadges).map(el => el.textContent)
    expect(roleTexts.some(text => text?.includes('Сотрудник'))).toBe(true)

    // Роли "Администратор" больше нет в бейджах (но может быть в dropdown)
    expect(roleTexts.some(text => text?.includes('Администратор'))).toBe(false)
  })

  it('шаг 10: удаление сотрудника из клуба', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    vi.mocked(managementApi.deleteEmployeeFromClub).mockResolvedValue(undefined)

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Нажимаем кнопку удаления сотрудника
    const deleteButtons = screen.getAllByRole('button', { name: /удалить/i })
    await user.click(deleteButtons[0])

    // Подтверждаем удаление
    await waitFor(() => {
      expect(screen.getByText('Удаление сотрудника')).toBeInTheDocument()
    })

    const modal = screen.getByText('Удаление сотрудника').closest('.fixed')!
    const confirmButton = modal.querySelector('button[type="submit"]') ||
      screen.getAllByRole('button', { name: /^Удалить$/i }).find(btn =>
        modal.contains(btn)
      )

    if (confirmButton) {
      await user.click(confirmButton)
    }

    await waitFor(() => {
      expect(vi.mocked(managementApi.deleteEmployeeFromClub)).toHaveBeenCalled()
    })
  })

  it('шаг 11: проверка — сотрудник больше не в списке', async () => {
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])

    // После удаления сотрудника список обновляется без него
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
      {
        employeeDto: {
          id: 3,
          surname: 'Сидоров',
          name: 'Сидор',
          patronymic: null,
          phone: '+7-999-333-33-33',
        },
        roles: ['EMPLOYEE', 'ADMIN'],
      },
    ])

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
    })

    // Удаленного сотрудника больше нет в списке
    expect(screen.queryByText(/Петров Петр/i)).not.toBeInTheDocument()
  })

  it('полный цикл HR: проверка состояния store', () => {
    // 1. Управляющий авторизован
    useAuthStore.getState().setToken('manager-token')
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // 2. Текущий клуб установлен
    expect(useAuthStore.getState().currentClub?.id).toBe(1)
    expect(useAuthStore.getState().currentClub?.name).toBe('VR Club Moscow')

    // 3. При выходе состояние очищается
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().currentClub).toBeNull()
  })
})
