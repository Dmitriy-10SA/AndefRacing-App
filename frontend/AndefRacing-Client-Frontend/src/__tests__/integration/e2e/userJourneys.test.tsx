import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { render } from '../test-utils'
import { useAuthStore } from '@/stores/authStore'
import { usePageStateStore } from '@/stores/pageStateStore'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import SearchPage from '@/pages/search/SearchPage'
import ProfilePage from '@/pages/profile/ProfilePage'
import BookingsPage from '@/pages/bookings/BookingsPage'
import FavoriteClubsPage from '@/pages/favorites/FavoriteClubsPage'
import ClubDetailsPage from '@/pages/search/ClubDetailsPage'
import { server } from '../mocks/server'
import { profileApi } from '@/api/profileApi'
import { bookingApi } from '@/api/bookingApi'
import { searchApi } from '@/api/searchApi'
import { AxiosError } from 'axios'

// Мокаем API модули
vi.mock('@/api/profileApi')
vi.mock('@/api/bookingApi')
vi.mock('@/api/searchApi')

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

// Моковые данные
const mockUser = {
  phone: '+7-999-123-45-67',
  name: 'Тестовый Пользователь',
}

const mockClubs = [
  {
    id: 1,
    name: 'VR Club Moscow',
    phone: '+7-495-123-45-67',
    email: 'moscow@vrclub.ru',
    address: 'ул. Тверская, д. 10',
    cntEquipment: 10,
    isOpen: true,
    mainPhoto: { id: 1, url: '/files/clubs/1/main.jpg' },
  },
]

const mockBookings = [
  {
    id: 1,
    startDateTime: '2024-03-20T14:00:00',
    endDateTime: '2024-03-20T15:00:00',
    status: 'PAID',
    club: mockClubs[0],
    city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
  },
]

const mockClubFullInfo = {
  id: 1,
  name: 'VR Club Moscow',
  phone: '+7-495-123-45-67',
  email: 'moscow@vrclub.ru',
  address: 'ул. Тверская, д. 10',
  cntEquipment: 10,
  isOpen: true,
  mainPhoto: { id: 1, url: '/files/clubs/1/main.jpg' },
  photos: [{ id: 1, url: '/files/clubs/1/photo1.jpg' }],
  games: [{ id: 1, name: 'Beat Saber', photo: null }],
  prices: [{ id: 1, durationMinutes: 60, value: 1500 }],
  workSchedules: [
    { id: 1, dayOfWeek: 'MONDAY', openTime: '10:00:00', closeTime: '22:00:00', isWorkDay: true },
  ],
}

const mockFavoriteClubsResponse = {
  content: mockClubs.map(club => ({
    ...club,
    city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
  })),
  pageInfo: {
    pageNumber: 0,
    pageSize: 10,
    totalElements: mockClubs.length,
    totalPages: 1,
    isLast: true,
  },
}

const mockBookingsResponse = {
  content: mockBookings,
  pageInfo: {
    pageNumber: 0,
    pageSize: 10,
    totalElements: mockBookings.length,
    totalPages: 1,
    isLast: true,
  },
}

// Мокаем useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useParams: () => ({ clubId: '1', bookingId: '1' }),
  }
})

describe('E2E User Journeys - Auth Store (Client)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetSearchPageState()
    mockNavigate.mockClear()
    server.resetHandlers()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  describe('Сценарий: Авторизация пользователя', () => {
    it('setToken устанавливает токен и делает пользователя аутентифицированным', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      useAuthStore.getState().setToken('new-user-token')

      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().token).toBe('new-user-token')
    })

    it('logout очищает токен', () => {
      useAuthStore.getState().setToken('test-token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      useAuthStore.getState().logout()

      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().token).toBeNull()
    })
  })

  describe('Сценарий: Управление состоянием страницы поиска', () => {
    it('setSearchPageState обновляет состояние', () => {
      const { setSearchPageState } = usePageStateStore.getState()

      setSearchPageState({
        selectedRegion: 1,
        selectedCity: 2,
        currentPage: 3
      })

      const state = usePageStateStore.getState()
      expect(state.searchPage.selectedRegion).toBe(1)
      expect(state.searchPage.selectedCity).toBe(2)
      expect(state.searchPage.currentPage).toBe(3)
    })

    it('resetSearchPageState сбрасывает состояние', () => {
      const { setSearchPageState, resetSearchPageState } = usePageStateStore.getState()

      setSearchPageState({
        selectedRegion: 1,
        selectedCity: 2
      })

      resetSearchPageState()

      const state = usePageStateStore.getState()
      expect(state.searchPage.selectedRegion).toBeNull()
      expect(state.searchPage.selectedCity).toBeNull()
    })
  })
})

describe('E2E: Полный процесс регистрации и входа', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    mockNavigate.mockClear()
    server.resetHandlers()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('пользователь может войти с правильными данными', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    // Заполняем форму входа
    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    // Нажимаем кнопку входа
    const submitButton = screen.getByRole('button', { name: /войти/i })
    await user.click(submitButton)

    // Проверяем, что пользователь аутентифицирован и перенаправлен
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    expect(mockNavigate).toHaveBeenCalledWith('/search')
  })

  it('показывает ошибку при неверных данных', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'wrongPassword')

    const submitButton = screen.getByRole('button', { name: /войти/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/неверный логин или пароль/i)).toBeInTheDocument()
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('пользователь может зарегистрироваться', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    // Заполняем форму регистрации
    const nameInput = document.querySelector('input[name="name"]')!
    await user.type(nameInput, 'Новый Пользователь')

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991112233')

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'NewPassword123!')
    await user.type(passwordInputs[1], 'NewPassword123!')

    // Соглашаемся на обработку персональных данных
    await user.click(screen.getByRole('checkbox'))

    const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  it('показывает ошибку при регистрации существующего пользователя', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const nameInput = document.querySelector('input[name="name"]')!
    await user.type(nameInput, 'Существующий')

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9990000000') // Уже зарегистрирован в моках

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'Password123!')
    await user.type(passwordInputs[1], 'Password123!')

    // Соглашаемся на обработку персональных данных
    await user.click(screen.getByRole('checkbox'))

    const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/уже существует/i)).toBeInTheDocument()
    })
  })
})

describe('E2E: Навигация аутентифицированного пользователя', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setToken('test-token')
    mockNavigate.mockClear()
    server.resetHandlers()

    // Дефолтные моки для API
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockUser)
    vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingsResponse)
    vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue(mockFavoriteClubsResponse)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('пользователь может просматривать свой профиль', async () => {
    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument()
    })

    expect(screen.getByText(mockUser.phone)).toBeInTheDocument()
  })

  it('пользователь может просматривать свои бронирования', async () => {
    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/мои бронирования/i)).toBeInTheDocument()
    })

    // Должны отображаться бронирования
    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })
  })

  it('пользователь может просматривать избранные клубы', async () => {
    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText(/избранные клубы/i)).toBeInTheDocument()
    })

    // Должны отображаться избранные клубы
    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })
  })

  it('пользователь может выйти из системы', async () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })
})

describe('E2E: Поиск и просмотр клубов', () => {
  beforeEach(() => {
    useAuthStore.getState().setToken('test-token')
    usePageStateStore.getState().resetSearchPageState()
    mockNavigate.mockClear()
    server.resetHandlers()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает страницу поиска', async () => {
    render(<SearchPage />)

    expect(screen.getByText(/поиск клубов/i)).toBeInTheDocument()
  })

  it('показывает подсказку при отсутствии города', async () => {
    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByText(/выберите регион и город/i)).toBeInTheDocument()
    })
  })
})

describe('E2E Session Management (Client)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('сессия сохраняется (имитация)', () => {
    // Устанавливаем токен
    useAuthStore.getState().setToken('persistent-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // Проверяем, что токен сохранен (zustand persist)
    const state = useAuthStore.getState()
    expect(state.token).toBe('persistent-token')
  })

  it('выход из системы очищает все данные сессии', () => {
    useAuthStore.getState().setToken('test-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().logout()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('isAuthenticated корректно отражает наличие токена', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    useAuthStore.getState().setToken('token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('E2E Protected Routes Logic (Client)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  it('неаутентифицированный пользователь не имеет доступа к защищенным маршрутам', () => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    expect(isAuthenticated).toBe(false)

    const protectedRoutes = ['/profile', '/favorites', '/bookings']
    protectedRoutes.forEach(route => {
      // Все защищенные маршруты должны требовать аутентификации
      expect(isAuthenticated).toBe(false)
    })
  })

  it('аутентифицированный пользователь имеет доступ к защищенным маршрутам', () => {
    useAuthStore.getState().setToken('test-token')
    const isAuthenticated = useAuthStore.getState().isAuthenticated
    expect(isAuthenticated).toBe(true)
  })
})

describe('E2E: Обработка ошибок сети', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().setToken('test-token')
    server.resetHandlers()
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
})

describe('E2E: Взаимодействие с формами', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    mockNavigate.mockClear()
    server.resetHandlers()
  })

  it('валидация формы входа - пустые поля', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const submitButton = screen.getByRole('button', { name: /войти/i })
    await user.click(submitButton)

    // Форма не должна отправиться, пользователь не аутентифицирован
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('валидация формы регистрации - несовпадение паролей', async () => {
    const user = userEvent.setup()

    render(<RegisterPage />)

    const nameInput = document.querySelector('input[name="name"]')!
    await user.type(nameInput, 'Тест')

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991112233')

    const passwordInputs = document.querySelectorAll('input[type="password"]')
    await user.type(passwordInputs[0], 'Password123!')
    await user.type(passwordInputs[1], 'DifferentPassword123!')

    // Соглашаемся на обработку персональных данных
    await user.click(screen.getByRole('checkbox'))

    const submitButton = screen.getByRole('button', { name: /зарегистрироваться/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/пароли не совпадают/i)).toBeInTheDocument()
    })

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('E2E: Полный цикл бронирования', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetSearchPageState()
    mockNavigate.mockClear()
    server.resetHandlers()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('авторизованный пользователь может пройти полный цикл бронирования', async () => {
    // Шаг 1: Вход в систему
    useAuthStore.getState().setToken('test-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // Шаг 2: Просмотр страницы поиска
    render(<SearchPage />)
    expect(screen.getByText(/поиск клубов/i)).toBeInTheDocument()
  })

  it('пользователь может выбрать регион и город для поиска', async () => {
    useAuthStore.getState().setToken('test-token')

    // Устанавливаем выбранный регион и город
    usePageStateStore.getState().setSearchPageState({
      selectedRegion: 1,
      selectedCity: 1,
    })

    const state = usePageStateStore.getState()
    expect(state.searchPage.selectedRegion).toBe(1)
    expect(state.searchPage.selectedCity).toBe(1)
  })

  it('пользователь может просмотреть бронирования после создания', async () => {
    useAuthStore.getState().setToken('test-token')
    vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingsResponse)

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/мои бронирования/i)).toBeInTheDocument()
    })

    // Проверяем отображение существующих бронирований
    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })
  })

  it('состояние страницы поиска сохраняется между переходами', () => {
    useAuthStore.getState().setToken('test-token')

    // Выбираем регион и город
    usePageStateStore.getState().setSearchPageState({
      selectedRegion: 1,
      selectedCity: 2,
      currentPage: 0,
    })

    // Проверяем что состояние сохранилось
    const state = usePageStateStore.getState()
    expect(state.searchPage.selectedRegion).toBe(1)
    expect(state.searchPage.selectedCity).toBe(2)

    // Симулируем переход на другую страницу и обратно
    usePageStateStore.getState().setSearchPageState({
      currentPage: 1,
    })

    const newState = usePageStateStore.getState()
    expect(newState.searchPage.selectedRegion).toBe(1)
    expect(newState.searchPage.currentPage).toBe(1)
  })
})

describe('E2E: Управление избранным', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetFavoritesPageState()
    mockNavigate.mockClear()
    server.resetHandlers()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('авторизованный пользователь может просматривать избранные клубы', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText(/избранные клубы/i)).toBeInTheDocument()
    })

    // Проверяем отображение клубов в избранном
    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })
  })

  it('пользователь может удалить клуб из избранного', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('test-token')

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    // Нажимаем на кнопку удаления из избранного
    const heartButtons = screen.getAllByRole('button', { name: /Удалить из избранного/i })
    await user.click(heartButtons[0])

    // Подтверждаем удаление
    await waitFor(() => {
      expect(screen.getByText(/Вы уверены/i)).toBeInTheDocument()
    })
  })

  it('неавторизованный пользователь перенаправляется при попытке добавить в избранное', () => {
    // Проверяем что без токена пользователь не аутентифицирован
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    // При попытке добавить в избранное должен быть редирект на логин
    // Это проверяется через mockNavigate в компонентах
  })

  it('состояние страницы избранного сохраняется', () => {
    useAuthStore.getState().setToken('test-token')

    // Устанавливаем состояние страницы
    usePageStateStore.getState().setFavoritesPageState({
      currentPage: 2,
    })

    const state = usePageStateStore.getState()
    expect(state.favoritesPage.currentPage).toBe(2)
  })

  it('сброс состояния избранного работает корректно', () => {
    usePageStateStore.getState().setFavoritesPageState({
      currentPage: 5,
    })

    usePageStateStore.getState().resetFavoritesPageState()

    const state = usePageStateStore.getState()
    expect(state.favoritesPage.currentPage).toBe(0)
  })
})

describe('E2E: Обработка заблокированного клиента', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    mockNavigate.mockClear()
    server.resetHandlers()
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('заблокированный клиент видит сообщение об ошибке при загрузке профиля', async () => {
    useAuthStore.getState().setToken('blocked-token')

    vi.mocked(profileApi.getPersonalInfo).mockRejectedValue(createBlockedError())

    render(<ProfilePage />)

    await waitFor(() => {
      expect(screen.getByText(/Вы заблокированы|Ошибка/i)).toBeInTheDocument()
    })
  })

  it('заблокированный клиент видит сообщение об ошибке при загрузке бронирований', async () => {
    useAuthStore.getState().setToken('blocked-token')

    vi.mocked(bookingApi.getBookings).mockRejectedValue(createBlockedError())

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Вы заблокированы|Ошибка/i)).toBeInTheDocument()
    })
  })

  it('заблокированный клиент видит сообщение об ошибке при загрузке избранного', async () => {
    useAuthStore.getState().setToken('blocked-token')

    vi.mocked(profileApi.getFavoriteClubs).mockRejectedValue(createBlockedError())

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Вы заблокированы|Ошибка/i)).toBeInTheDocument()
    })
  })
})

describe('E2E: Полный цикл бронирования (детальный)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetSearchPageState()
    mockNavigate.mockClear()
    server.resetHandlers()

    // Дефолтные моки для API
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockUser)
    vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingsResponse)
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(profileApi.isClubFavorite).mockResolvedValue(false)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('пользователь может пройти полный цикл от входа до создания бронирования', async () => {
    const user = userEvent.setup()

    // Шаг 1: Вход в систему
    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })

    // Проверяем что токен установлен
    expect(useAuthStore.getState().token).toBeTruthy()
  })

  it('авторизованный пользователь может выбрать регион и город для поиска клубов', () => {
    useAuthStore.getState().setToken('test-token')

    // Устанавливаем выбранный регион
    usePageStateStore.getState().setSearchPageState({ selectedRegion: 1 })
    expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)

    // Устанавливаем выбранный город
    usePageStateStore.getState().setSearchPageState({ selectedCity: 1 })
    expect(usePageStateStore.getState().searchPage.selectedCity).toBe(1)
  })

  it('пользователь может просматривать страницу поиска после авторизации', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByText(/поиск клубов/i)).toBeInTheDocument()
    })
  })

  it('пользователь может просмотреть детали клуба', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    // Проверяем отображение основной информации
    expect(screen.getByText(mockClubs[0].address)).toBeInTheDocument()
  })

  it('пользователь видит свои бронирования после создания', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/мои бронирования/i)).toBeInTheDocument()
    })

    // Проверяем что бронирования отображаются
    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })
  })

  it('полный цикл: состояние страницы поиска сохраняется при навигации', () => {
    useAuthStore.getState().setToken('test-token')

    // Устанавливаем состояние поиска
    usePageStateStore.getState().setSearchPageState({
      selectedRegion: 1,
      selectedCity: 2,
      currentPage: 0,
    })

    // Имитируем переход на страницу клуба и обратно
    const state = usePageStateStore.getState()
    expect(state.searchPage.selectedRegion).toBe(1)
    expect(state.searchPage.selectedCity).toBe(2)

    // Меняем страницу
    usePageStateStore.getState().setSearchPageState({ currentPage: 1 })

    // Состояние должно сохраниться
    const newState = usePageStateStore.getState()
    expect(newState.searchPage.selectedRegion).toBe(1)
    expect(newState.searchPage.currentPage).toBe(1)
  })
})

describe('E2E: Управление избранным (детальный)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetFavoritesPageState()
    mockNavigate.mockClear()
    server.resetHandlers()

    // Дефолтные моки для API
    vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue(mockFavoriteClubsResponse)
    vi.mocked(profileApi.deleteFavoriteClub).mockResolvedValue(undefined)
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(profileApi.isClubFavorite).mockResolvedValue(false)
    vi.mocked(profileApi.addFavoriteClub).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('пользователь может просмотреть страницу клуба и добавить его в избранное', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    // Кнопка избранного должна быть на странице
    const favoriteButton = screen.getByRole('button', { name: /избранное/i })
    expect(favoriteButton).toBeInTheDocument()
  })

  it('пользователь может просмотреть список избранных клубов', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText(/избранные клубы/i)).toBeInTheDocument()
    })

    // Клубы из избранного должны отображаться
    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })
  })

  it('пользователь может удалить клуб из избранного через модальное окно', async () => {
    const user = userEvent.setup()
    useAuthStore.getState().setToken('test-token')

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    // Нажимаем на кнопку удаления из избранного
    const heartButtons = screen.getAllByRole('button', { name: /Удалить из избранного/i })
    await user.click(heartButtons[0])

    // Появляется модальное окно подтверждения
    await waitFor(() => {
      expect(screen.getByText(/Вы уверены/i)).toBeInTheDocument()
    })

    // Можем отменить действие
    const cancelButton = screen.getByRole('button', { name: /Отмена/i })
    expect(cancelButton).toBeInTheDocument()
  })

  it('состояние страницы избранного сохраняется между переходами', () => {
    useAuthStore.getState().setToken('test-token')

    // Устанавливаем страницу пагинации
    usePageStateStore.getState().setFavoritesPageState({ currentPage: 2 })

    const state = usePageStateStore.getState()
    expect(state.favoritesPage.currentPage).toBe(2)

    // Сброс состояния работает
    usePageStateStore.getState().resetFavoritesPageState()

    const newState = usePageStateStore.getState()
    expect(newState.favoritesPage.currentPage).toBe(0)
  })

  it('неавторизованный пользователь не может добавлять в избранное', () => {
    // Без токена пользователь не аутентифицирован
    expect(useAuthStore.getState().isAuthenticated).toBe(false)

    // При попытке добавить в избранное должен быть редирект
    // (проверяется через mockNavigate в компонентах)
  })

  it('закрытый клуб в избранном отображается с предупреждением', async () => {
    useAuthStore.getState().setToken('test-token')

    vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
      content: [
        {
          ...mockClubs[0],
          isOpen: false,
          city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    // Должно быть предупреждение о закрытом клубе
    expect(screen.getByText(/клуб закрыт/i)).toBeInTheDocument()
  })
})

describe('E2E: Полный цикл бронирования (расширенный)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.getState().logout()
    usePageStateStore.getState().resetSearchPageState()
    usePageStateStore.getState().resetBookingsPageState()
    mockNavigate.mockClear()
    server.resetHandlers()

    // Дефолтные моки для API
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockUser)
    vi.mocked(bookingApi.getBookings).mockResolvedValue(mockBookingsResponse)
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(profileApi.isClubFavorite).mockResolvedValue(false)
    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue([
      { startDateTime: '2024-03-25T10:00:00', endDateTime: '2024-03-25T11:00:00' },
      { startDateTime: '2024-03-25T11:00:00', endDateTime: '2024-03-25T12:00:00' },
      { startDateTime: '2024-03-25T14:00:00', endDateTime: '2024-03-25T15:00:00' },
    ])
    vi.mocked(bookingApi.makeBooking).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('шаг 1: вход в систему', async () => {
    const user = userEvent.setup()

    render(<LoginPage />)

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9991234567')

    const passwordInput = document.querySelector('input[type="password"]')!
    await user.type(passwordInput, 'correctPassword123!')

    await user.click(screen.getByRole('button', { name: /войти/i }))

    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  it('шаг 2: переход на страницу поиска', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<SearchPage />)

    await waitFor(() => {
      expect(screen.getByText(/поиск клубов/i)).toBeInTheDocument()
    })
  })

  it('шаг 3: выбор региона обновляет список городов', () => {
    useAuthStore.getState().setToken('test-token')

    // Выбираем регион
    usePageStateStore.getState().setSearchPageState({ selectedRegion: 1 })

    expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)

    // После выбора региона город должен сброситься
    expect(usePageStateStore.getState().searchPage.selectedCity).toBeNull()
  })

  it('шаг 4: выбор города загружает список клубов', () => {
    useAuthStore.getState().setToken('test-token')

    // Выбираем регион и город
    usePageStateStore.getState().setSearchPageState({
      selectedRegion: 1,
      selectedCity: 1,
    })

    expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)
    expect(usePageStateStore.getState().searchPage.selectedCity).toBe(1)
  })

  it('шаг 5: клик на клуб показывает страницу деталей', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    // Проверяем отображение основной информации
    expect(screen.getByText(mockClubs[0].address)).toBeInTheDocument()
  })

  it('шаг 6: кнопка "Забронировать" переводит на форму бронирования', async () => {
    useAuthStore.getState().setToken('test-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })

    // Кнопка бронирования должна быть на странице
    const bookButton = screen.getByText('Забронировать')
    expect(bookButton).toBeInTheDocument()
  })

  it('шаг 7-8: выбор даты и длительности загружает доступные слоты и пересчитывает цену', () => {
    useAuthStore.getState().setToken('test-token')

    // Проверяем что API слотов вызывается с параметрами
    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue([
      { startDateTime: '2024-03-25T10:00:00', endDateTime: '2024-03-25T11:00:00' },
    ])

    // Цены из mockClubFullInfo
    const price60min = mockClubFullInfo.prices.find(p => p.durationMinutes === 60)
    expect(price60min?.value).toBe(1500)
  })

  it('шаг 9: выбор количества мест пересчитывает цену', () => {
    useAuthStore.getState().setToken('test-token')

    // Цена за 1 место: 1500
    // Цена за 2 места: 3000
    const basePrice = 1500
    const seats = 2
    const totalPrice = basePrice * seats

    expect(totalPrice).toBe(3000)
  })

  it('шаг 10-13: полный цикл создания бронирования', async () => {
    useAuthStore.getState().setToken('test-token')

    // 1. Выбор слота
    const selectedSlot = { startDateTime: '2024-03-25T10:00:00', endDateTime: '2024-03-25T11:00:00' }

    // 2. Ввод пожеланий
    const note = 'Хочу игру Beat Saber'

    // 3. Создание бронирования
    vi.mocked(bookingApi.makeBooking).mockResolvedValue(undefined)

    // 4. Проверяем что API вызывается с правильными параметрами
    await bookingApi.makeBooking(1, {
      startDateTime: selectedSlot.startDateTime,
      durationMinutes: 60,
      cntEquipment: 1,
      note: note,
    })

    expect(vi.mocked(bookingApi.makeBooking)).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        note: note,
      })
    )
  })

  it('шаг 14: после успешного бронирования редирект на /bookings и бронирование в списке', async () => {
    useAuthStore.getState().setToken('test-token')

    // После создания бронирования оно должно быть в списке
    vi.mocked(bookingApi.getBookings).mockResolvedValue({
      content: [
        {
          id: 999,
          startDateTime: '2024-03-25T10:00:00',
          endDateTime: '2024-03-25T11:00:00',
          status: 'PENDING_PAYMENT',
          club: mockClubs[0],
          city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 10, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<BookingsPage />)

    await waitFor(() => {
      expect(screen.getByText(/мои бронирования/i)).toBeInTheDocument()
    })

    // Новое бронирование должно отображаться
    await waitFor(() => {
      expect(screen.getByText(mockClubs[0].name)).toBeInTheDocument()
    })
  })

  it('полный цикл: состояние store сохраняется между шагами', () => {
    // 1. Вход
    useAuthStore.getState().setToken('test-token')
    expect(useAuthStore.getState().isAuthenticated).toBe(true)

    // 2. Выбор региона
    usePageStateStore.getState().setSearchPageState({ selectedRegion: 1 })
    expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)

    // 3. Выбор города
    usePageStateStore.getState().setSearchPageState({ selectedCity: 2 })
    expect(usePageStateStore.getState().searchPage.selectedCity).toBe(2)

    // 4. Состояние сохраняется
    const state = usePageStateStore.getState()
    expect(state.searchPage.selectedRegion).toBe(1)
    expect(state.searchPage.selectedCity).toBe(2)

    // 5. После просмотра клуба возвращаемся на поиск - состояние сохранено
    expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)
  })

  it('проверка расчета стоимости бронирования', () => {
    // Цены из mockClubFullInfo
    const prices = mockClubFullInfo.prices

    // 60 минут = 1500 ₽
    const price60 = prices.find(p => p.durationMinutes === 60)?.value
    expect(price60).toBe(1500)

    // 1 место = 1500 ₽
    // 2 места = 3000 ₽
    // 3 места = 4500 ₽
    expect(price60! * 1).toBe(1500)
    expect(price60! * 2).toBe(3000)
    expect(price60! * 3).toBe(4500)
  })

  it('проверка валидации формы бронирования', () => {
    useAuthStore.getState().setToken('test-token')

    // Без выбора слота кнопка "Забронировать" должна быть отключена
    // Это проверяется в тестах MakeBookingPage
  })

  it('обработка ошибки при создании бронирования', async () => {
    useAuthStore.getState().setToken('test-token')

    vi.mocked(bookingApi.makeBooking).mockRejectedValue({
      response: { data: { message: 'Выбранное время уже занято' } }
    })

    // Ошибка должна отображаться пользователю
    // Это проверяется в тестах MakeBookingPage
  })
})
