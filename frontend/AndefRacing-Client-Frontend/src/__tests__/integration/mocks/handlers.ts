import { http, HttpResponse } from 'msw'

const API_BASE = '/api'

// Моковые данные
export const mockUser = {
  phone: '+7-999-123-45-67',
  name: 'Тестовый Пользователь',
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
    mainPhoto: { id: 1, url: '/files/clubs/1/main.jpg' },
  },
  {
    id: 2,
    name: 'VR Club SPb',
    phone: '+7-812-123-45-67',
    email: 'spb@vrclub.ru',
    address: 'Невский пр., д. 100',
    cntEquipment: 8,
    isOpen: true,
    mainPhoto: { id: 2, url: '/files/clubs/2/main.jpg' },
  },
]

export const mockBookings = [
  {
    id: 1,
    startDateTime: '2024-03-20T14:00:00',
    endDateTime: '2024-03-20T15:00:00',
    status: 'PAID',
    club: mockClubs[0],
    city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
  },
]

// API handlers
export const handlers = [
  // Auth handlers
  http.post(`${API_BASE}/auth/client/login`, async ({ request }) => {
    const body = await request.json() as { phone: string; password: string }

    if (body.phone === '+7-999-123-45-67' && body.password === 'correctPassword123!') {
      return HttpResponse.json({ jwt: 'mock-jwt-token' })
    }

    return HttpResponse.json(
      { message: 'Неверный логин или пароль' },
      { status: 401 }
    )
  }),

  http.post(`${API_BASE}/auth/client/register`, async ({ request }) => {
    const body = await request.json() as { phone: string; password: string; name: string }

    if (body.phone === '+7-999-000-00-00') {
      return HttpResponse.json(
        { message: 'Пользователь с таким номером уже существует' },
        { status: 400 }
      )
    }

    return HttpResponse.json({ jwt: 'mock-jwt-token' })
  }),

  http.patch(`${API_BASE}/auth/client/change-password`, async () => {
    return HttpResponse.json({ jwt: 'new-mock-jwt-token' })
  }),

  // Profile handlers
  http.get(`${API_BASE}/profile/client/personal-info`, () => {
    return HttpResponse.json(mockUser)
  }),

  http.patch(`${API_BASE}/profile/client/change-personal-info`, async ({ request }) => {
    const body = await request.json() as { name: string; phone: string }
    return HttpResponse.json({ ...mockUser, ...body })
  }),

  // Search/Clubs handlers
  http.get(`${API_BASE}/search/regions`, () => {
    return HttpResponse.json([
      { id: 1, name: 'Московская область' },
      { id: 2, name: 'Ленинградская область' },
    ])
  }),

  http.get(`${API_BASE}/search/cities/:regionId`, ({ params }) => {
    const cities = params.regionId === '1'
      ? [{ id: 1, name: 'Москва' }, { id: 2, name: 'Химки' }]
      : [{ id: 3, name: 'Санкт-Петербург' }, { id: 4, name: 'Выборг' }]
    return HttpResponse.json(cities)
  }),

  http.get(`${API_BASE}/search/clubs/:cityId`, ({ request, params }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('pageNumber') || '0')
    const size = parseInt(url.searchParams.get('pageSize') || '10')

    return HttpResponse.json({
      content: mockClubs,
      pageInfo: {
        pageNumber: page,
        pageSize: size,
        totalElements: mockClubs.length,
        totalPages: 1,
        isLast: true,
      },
    })
  }),

  http.get(`${API_BASE}/search/clubs/:clubId/full-info`, ({ params }) => {
    const club = mockClubs.find(c => c.id === Number(params.clubId))
    if (!club) {
      return HttpResponse.json({ message: 'Клуб не найден' }, { status: 404 })
    }
    return HttpResponse.json({
      ...club,
      photos: [{ id: 1, url: '/files/clubs/1/photo1.jpg' }],
      games: [{ id: 1, name: 'Beat Saber', photo: null }],
      prices: [{ id: 1, durationMinutes: 60, value: 1500 }],
      workSchedules: [
        { id: 1, dayOfWeek: 'MONDAY', openTime: '10:00:00', closeTime: '22:00:00', isWorkDay: true },
      ],
    })
  }),

  // Bookings handlers
  http.get(`${API_BASE}/bookings/client`, ({ request }) => {
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

  http.get(`${API_BASE}/bookings/client/:clubId/:bookingId`, ({ params }) => {
    const booking = mockBookings.find(b => b.id === Number(params.bookingId))
    if (!booking) {
      return HttpResponse.json({ message: 'Бронирование не найдено' }, { status: 404 })
    }
    return HttpResponse.json({
      ...booking,
      cntEquipment: 2,
      price: 3000,
      note: 'Тестовое пожелание',
    })
  }),

  http.post(`${API_BASE}/bookings/client/make-booking/:clubId`, async () => {
    return HttpResponse.json({
      id: 999,
      startDateTime: '2024-03-25T14:00:00',
      endDateTime: '2024-03-25T15:00:00',
      status: 'PENDING_PAYMENT',
    })
  }),

  // Free slots for booking
  http.get(`${API_BASE}/bookings/client/free-slots/:clubId`, () => {
    return HttpResponse.json([
      { startDateTime: '2024-03-25T10:00:00', endDateTime: '2024-03-25T11:00:00' },
      { startDateTime: '2024-03-25T11:00:00', endDateTime: '2024-03-25T12:00:00' },
      { startDateTime: '2024-03-25T14:00:00', endDateTime: '2024-03-25T15:00:00' },
    ])
  }),

  // Favorites handlers
  http.get(`${API_BASE}/profile/client/favorite-clubs`, ({ request }) => {
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('pageNumber') || '0')

    return HttpResponse.json({
      content: mockClubs.map(club => ({
        ...club,
        city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
      })),
      pageInfo: {
        pageNumber: page,
        pageSize: 10,
        totalElements: mockClubs.length,
        totalPages: 1,
        isLast: true,
      },
    })
  }),

  http.post(`${API_BASE}/profile/client/favorite-clubs/:clubId`, () => {
    return new HttpResponse(null, { status: 201 })
  }),

  http.delete(`${API_BASE}/profile/client/favorite-clubs/:clubId`, () => {
    return new HttpResponse(null, { status: 204 })
  }),

  // Check if club is favorite
  http.get(`${API_BASE}/profile/client/favorite-clubs/:clubId/check`, () => {
    return HttpResponse.json(false)
  }),
]
