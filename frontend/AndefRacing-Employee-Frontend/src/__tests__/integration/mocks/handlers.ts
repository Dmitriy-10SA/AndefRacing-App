import { http, HttpResponse } from 'msw'

const API_BASE = '/api'

// Моковые данные
export const mockEmployee = {
  id: 1,
  phone: '+7-999-123-45-67',
  name: 'Иван',
  surname: 'Иванов',
  patronymic: 'Иванович',
  roles: ['EMPLOYEE', 'ADMIN'],
}

export const mockClubs = [
  {
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
  },
  {
    id: 2,
    name: 'VR Club SPb',
    phone: '+7-812-123-45-67',
    email: 'spb@vrclub.ru',
    address: 'Невский пр., д. 100',
    cntEquipment: 8,
    isOpen: true,
    city: {
      id: 2,
      name: 'Санкт-Петербург',
      region: { id: 2, name: 'Ленинградская область' },
    },
  },
]

export const mockBookings = [
  {
    id: 1,
    startDateTime: '2024-03-20T14:00:00',
    endDateTime: '2024-03-20T15:00:00',
    status: 'PAID',
  },
]

export const mockGames = [
  { id: 1, name: 'Beat Saber', photoUrl: null, isActive: true },
  { id: 2, name: 'Half-Life: Alyx', photoUrl: null, isActive: true },
]

export const mockClubFullInfo = {
  id: 1,
  name: 'VR Club Moscow',
  phone: '+7-495-123-45-67',
  email: 'moscow@vrclub.ru',
  address: 'ул. Тверская, д. 10',
  cntEquipment: 10,
  isOpen: true,
  photos: [{ id: 1, url: '/files/clubs/1/photo1.jpg', sequenceNumber: 1 }],
  games: [{ id: 1, name: 'Beat Saber' }],
  prices: [
    { id: 1, durationMinutes: 30, value: 750 },
    { id: 2, durationMinutes: 60, value: 1500 },
  ],
  workSchedules: [
    { id: 1, dayOfWeek: 'MONDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
    { id: 2, dayOfWeek: 'TUESDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
    { id: 3, dayOfWeek: 'WEDNESDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
    { id: 4, dayOfWeek: 'THURSDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
    { id: 5, dayOfWeek: 'FRIDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
    { id: 6, dayOfWeek: 'SATURDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
    { id: 7, dayOfWeek: 'SUNDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: false },
  ],
}

export const mockFreeSlots = [
  { startDateTime: '2024-03-25T10:00:00', endDateTime: '2024-03-25T11:00:00' },
  { startDateTime: '2024-03-25T11:00:00', endDateTime: '2024-03-25T12:00:00' },
  { startDateTime: '2024-03-25T14:00:00', endDateTime: '2024-03-25T15:00:00' },
]

export const mockBookingFullInfo = {
  id: 1,
  startDateTime: '2024-03-20T14:00:00',
  endDateTime: '2024-03-20T15:00:00',
  status: 'PENDING_PAYMENT',
  cntEquipment: 2,
  price: 3000,
  note: 'Тестовая заметка',
  client: { id: 1, name: 'Иван Иванов', phone: '+7-999-111-22-33' },
}

export const mockEmployeesWithRoles = [
  {
    employeeDto: {
      id: 2,
      surname: 'Петров',
      name: 'Петр',
      patronymic: 'Петрович',
      phone: '+7-999-222-22-22',
    },
    roles: ['EMPLOYEE'],
  },
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
]

export const mockWorkScheduleExceptions = [
  {
    id: 1,
    date: '2024-03-25',
    openTime: '12:00',
    closeTime: '20:00',
    isWorkDay: true,
    description: 'Сокращенный день',
  },
  {
    id: 2,
    date: '2024-03-26',
    openTime: null,
    closeTime: null,
    isWorkDay: false,
    description: 'Праздник',
  },
]

// API handlers
export const handlers = [
  // Auth handlers
  http.get(`${API_BASE}/auth/employee/is-first-enter`, ({ request }) => {
    const url = new URL(request.url)
    const phone = url.searchParams.get('phone')

    if (phone === '+7-999-123-45-67') {
      return HttpResponse.json(false) // Не первый вход
    } else if (phone === '+7-999-000-00-00') {
      return HttpResponse.json(true) // Первый вход
    }

    return HttpResponse.json(
      { message: `Сотрудник с номером телефона ${phone} не найден` },
      { status: 404 }
    )
  }),

  http.post(`${API_BASE}/auth/employee/pre-login`, async ({ request }) => {
    const body = await request.json() as { phone: string; password: string }

    if (body.phone === '+7-999-123-45-67' && body.password === 'correctPassword123!') {
      return HttpResponse.json(mockClubs)
    }

    return HttpResponse.json(
      { message: 'Неверный логин или пароль' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE}/auth/employee/login/:clubId`, async ({ params, request }) => {
    const body = await request.json() as { phone: string; password: string }

    if (body.phone === '+7-999-123-45-67' && body.password === 'correctPassword123!') {
      return HttpResponse.json({ jwt: 'mock-jwt-token' })
    }

    return HttpResponse.json(
      { message: 'Ошибка входа' },
      { status: 401 }
    )
  }),

  // Profile handlers
  http.get(`${API_BASE}/profile/employee/personal-info`, () => {
    return HttpResponse.json(mockEmployee)
  }),

  // Bookings handlers
  http.get(`${API_BASE}/bookings/employee`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('pageNumber') || '0')

    return HttpResponse.json({
      content: mockBookings,
      pageInfo: {
        pageNumber: page,
        pageSize: 10,
        totalElements: mockBookings.length,
        totalPages: 1,
        isLast: true,
      },
    })
  }),

  // Management handlers - Games
  http.get(`${API_BASE}/clubs/:clubId/games`, () => {
    return HttpResponse.json(mockGames)
  }),

  http.post(`${API_BASE}/clubs/:clubId/games`, async ({ request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({
      id: 999,
      name: body.name,
      photoUrl: null,
      isActive: true,
    })
  }),

  http.patch(`${API_BASE}/clubs/:clubId/games/:gameId`, async ({ params, request }) => {
    const body = await request.json() as { name: string }
    return HttpResponse.json({
      id: Number(params.gameId),
      name: body.name,
      photoUrl: null,
      isActive: true,
    })
  }),

  // Management handlers - Employees
  http.get(`${API_BASE}/clubs/:clubId/employees`, () => {
    return HttpResponse.json([
      {
        employeeDto: {
          id: 1,
          surname: 'Иванов',
          name: 'Иван',
          patronymic: 'Иванович',
          phone: '+7-999-111-11-11',
        },
        roles: ['EMPLOYEE'],
      },
    ])
  }),

  http.post(`${API_BASE}/clubs/:clubId/employees`, async () => {
    return new HttpResponse(null, { status: 201 })
  }),

  // Reports handlers
  http.get(`${API_BASE}/reports/booking-statistics`, ({ request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    return HttpResponse.json({
      clubId: 1,
      startDate,
      endDate,
      bookingsCount: 150,
      cancellationsPercent: 5.5,
      dateAndBookingsCountDtoList: [
        { date: startDate, bookingsCount: 50 },
      ],
    })
  }),

  http.get(`${API_BASE}/reports/financial-statistics`, ({ request }) => {
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate')
    const endDate = url.searchParams.get('endDate')

    return HttpResponse.json({
      clubId: 1,
      startDate,
      endDate,
      totalRevenue: 450000,
      averageReceipt: 3000,
      dateAndTotalRevenues: [
        { date: startDate, revenue: 150000 },
      ],
    })
  }),

  // Club full info
  http.get(`${API_BASE}/search/clubs/:clubId/full-info`, ({ params }) => {
    if (Number(params.clubId) === 1) {
      return HttpResponse.json(mockClubFullInfo)
    }
    return HttpResponse.json({ message: 'Клуб не найден' }, { status: 404 })
  }),

  // Free slots for booking
  http.get(`${API_BASE}/bookings/employee/free-slots`, () => {
    return HttpResponse.json(mockFreeSlots)
  }),

  // Make booking
  http.post(`${API_BASE}/bookings/employee/make-booking`, () => {
    return HttpResponse.json({
      id: 999,
      startDateTime: '2024-03-25T10:00:00',
      endDateTime: '2024-03-25T11:00:00',
      status: 'PENDING_PAYMENT',
    })
  }),

  // Booking full info
  http.get(`${API_BASE}/bookings/employee/full-info/:bookingId`, ({ params }) => {
    const bookingId = Number(params.bookingId)
    if (bookingId === 1) {
      return HttpResponse.json(mockBookingFullInfo)
    }
    if (bookingId === 2) {
      return HttpResponse.json({ ...mockBookingFullInfo, id: 2, status: 'PAID' })
    }
    if (bookingId === 3) {
      return HttpResponse.json({ ...mockBookingFullInfo, id: 3, status: 'CANCELLED' })
    }
    return HttpResponse.json({ message: 'Бронирование не найдено' }, { status: 404 })
  }),

  // Cancel booking
  http.patch(`${API_BASE}/bookings/employee/cancel/:bookingId`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // Confirm payment
  http.patch(`${API_BASE}/bookings/employee/confirm-booking-payment/:bookingId`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // HR Management - Get employees with roles
  http.get(`${API_BASE}/club-management/hr`, () => {
    return HttpResponse.json(mockEmployeesWithRoles)
  }),

  // HR Management - Check if employee in system
  http.get(`${API_BASE}/club-management/hr/is-employee-in-system`, ({ request }) => {
    const url = new URL(request.url)
    const phone = url.searchParams.get('employeePhone')
    if (phone === '+7-999-222-22-22') {
      return HttpResponse.json(true)
    }
    return HttpResponse.json(false)
  }),

  // HR Management - Add existing employee
  http.post(`${API_BASE}/club-management/hr/add-existing-employee-to-club`, () => {
    return new HttpResponse(null, { status: 201 })
  }),

  // HR Management - Add new employee
  http.post(`${API_BASE}/club-management/hr/add-new-employee-to-club`, () => {
    return new HttpResponse(null, { status: 201 })
  }),

  // HR Management - Delete employee from club
  http.delete(`${API_BASE}/club-management/hr/delete-employee-from-club/:employeeId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // HR Management - Add role to employee
  http.post(`${API_BASE}/club-management/hr/add-role-to-employee-in-club/:employeeId`, () => {
    return new HttpResponse(null, { status: 201 })
  }),

  // HR Management - Delete role from employee
  http.delete(`${API_BASE}/club-management/hr/delete-employee-role-in-club/:employeeId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Club Management - Update equipment count
  http.patch(`${API_BASE}/club-management`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // Club Management - Open/Close club
  http.patch(`${API_BASE}/club-management/open`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  http.patch(`${API_BASE}/club-management/close`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // Club Management - Prices
  http.post(`${API_BASE}/club-management/prices`, () => {
    return HttpResponse.json({ id: 3, durationMinutes: 90, value: 2000 })
  }),

  http.delete(`${API_BASE}/club-management/prices/:priceId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Club Management - Games
  http.get(`${API_BASE}/club-management/games`, () => {
    return HttpResponse.json(mockGames)
  }),

  http.post(`${API_BASE}/club-management/games/:gameId`, () => {
    return new HttpResponse(null, { status: 201 })
  }),

  http.delete(`${API_BASE}/club-management/games/:gameId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Club Management - Work schedule
  http.put(`${API_BASE}/club-management/work-schedule`, () => {
    return new HttpResponse(null, { status: 200 })
  }),

  // Club Management - Work schedule exceptions
  http.get(`${API_BASE}/club-management/work-schedule/exceptions`, () => {
    return HttpResponse.json(mockWorkScheduleExceptions)
  }),

  http.post(`${API_BASE}/club-management/work-schedule/exceptions`, () => {
    return HttpResponse.json({ id: 3, date: '2024-03-27', isWorkDay: false, description: 'Новый выходной' })
  }),

  http.delete(`${API_BASE}/club-management/work-schedule/exceptions/:id`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Club Management - Photos
  http.post(`${API_BASE}/club-management/photos/manage`, () => {
    return new HttpResponse(null, { status: 200 })
  }),
]
