import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import MakeBookingPage from '@/pages/bookings/MakeBookingPage'
import { useAuthStore } from '@/stores/authStore'
import { searchApi } from '@/api/searchApi'
import { bookingApi } from '@/api/bookingApi'
import { AxiosError } from 'axios'

// Мокаем API модули
vi.mock('@/api/searchApi')
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

// Мокаем useParams и useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ clubId: '1' }),
  }
})

const mockClubFullInfo = {
  id: 1,
  name: 'VR Club Moscow',
  phone: '+7-495-123-45-67',
  email: 'moscow@vrclub.ru',
  address: 'ул. Тверская, д. 10',
  cntEquipment: 10,
  isOpen: true,
  mainPhoto: { id: 1, url: '/files/clubs/1/main.jpg' },
  photos: [{ id: 1, url: '/files/clubs/1/photo1.jpg', sequenceNumber: 1 }],
  games: [{ id: 1, name: 'Beat Saber' }],
  prices: [
    { id: 1, durationMinutes: 30, value: 750 },
    { id: 2, durationMinutes: 60, value: 1500 },
    { id: 3, durationMinutes: 120, value: 2500 },
  ],
  workSchedules: [
    { id: 1, dayOfWeek: 'MONDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
  ],
}

const mockFreeSlots = [
  { startDateTime: '2024-03-25T10:00:00', endDateTime: '2024-03-25T11:00:00' },
  { startDateTime: '2024-03-25T11:00:00', endDateTime: '2024-03-25T12:00:00' },
  { startDateTime: '2024-03-25T14:00:00', endDateTime: '2024-03-25T15:00:00' },
]

describe('MakeBookingPage Integration (Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтные моки для успешных ответов
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue(mockFreeSlots)
    vi.mocked(bookingApi.makeBooking).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает страницу бронирования', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByText(/Бронирование:/i)).toBeInTheDocument()
    })
  })

  it('отображает название клуба', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByText(/VR Club Moscow/i)).toBeInTheDocument()
    })
  })

  it('отображает поля формы бронирования', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByText('Дата')).toBeInTheDocument()
      expect(screen.getByText('Длительность')).toBeInTheDocument()
      expect(screen.getByText('Количество игровых мест')).toBeInTheDocument()
    })
  })

  it('отображает цены из информации о клубе', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      // Проверяем, что есть селект с длительностью
      const select = document.querySelector('select[name="durationMinutes"]')
      expect(select).toBeInTheDocument()
    })
  })

  it('показывает кнопку показа доступного времени', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })
  })

  it('показывает доступные слоты при нажатии кнопки', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('Выберите время')).toBeInTheDocument()
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })
  })

  it('позволяет выбрать слот времени', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    await user.click(screen.getByText('10:00'))

    const slotButton = screen.getByText('10:00')
    expect(slotButton).toHaveClass('border-primary-600')
  })

  it('показывает стоимость бронирования', async () => {
    render(<MakeBookingPage />)

    // Ждем загрузки данных клуба и отображения цены
    await waitFor(() => {
      expect(screen.getByText(/VR Club Moscow/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText(/Стоимость:/i)).toBeInTheDocument()
    })
  })

  it('позволяет ввести пожелания', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByText(/Пожелания/i)).toBeInTheDocument()
    })

    const textarea = screen.getByPlaceholderText(/Укажите ваши пожелания/i)
    await user.type(textarea, 'Тестовое пожелание')

    expect(textarea).toHaveValue('Тестовое пожелание')
  })

  it('кнопка бронирования отключена без выбора слота', async () => {
    render(<MakeBookingPage />)

    await waitFor(() => {
      const bookButton = screen.getByRole('button', { name: /Забронировать/i })
      expect(bookButton).toBeDisabled()
    })
  })

  it('показывает сообщение если нет доступных слотов', async () => {
    const user = userEvent.setup()

    vi.mocked(bookingApi.getFreeSlots).mockResolvedValue([])

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('Нет доступных слотов на выбранную дату')).toBeInTheDocument()
    })
  })

  it('успешно создает бронирование', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    await user.click(screen.getByText('10:00'))

    const bookButton = screen.getByRole('button', { name: /Забронировать/i })
    await user.click(bookButton)

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/bookings')
    })
  })

  it('показывает ошибку при неудачном создании бронирования', async () => {
    const user = userEvent.setup()

    vi.mocked(bookingApi.makeBooking).mockRejectedValue(
      { response: { data: { message: 'Ошибка создания бронирования' } } }
    )

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    await waitFor(() => {
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })

    await user.click(screen.getByText('10:00'))

    const bookButton = screen.getByRole('button', { name: /Забронировать/i })
    await user.click(bookButton)

    await waitFor(() => {
      expect(screen.getByText(/Ошибка создания бронирования/i)).toBeInTheDocument()
    })
  })

  it('переходит назад при нажатии кнопки назад', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getAllByText('← Назад').length).toBeGreaterThan(0)
    })

    await user.click(screen.getAllByText('← Назад')[0])

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('переходит назад при нажатии кнопки отмены', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Отмена/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Отмена/i }))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('показывает состояние загрузки слотов', async () => {
    const user = userEvent.setup()

    vi.mocked(bookingApi.getFreeSlots).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockFreeSlots), 100))
    )

    render(<MakeBookingPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('пересчитывает стоимость при изменении количества мест', async () => {
    const user = userEvent.setup()

    render(<MakeBookingPage />)

    // Ждем загрузки данных клуба
    await waitFor(() => {
      expect(screen.getByText(/VR Club Moscow/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText(/Стоимость:/i)).toBeInTheDocument()
    })

    const equipmentSelect = document.querySelector('select[name="cntEquipment"]') as HTMLSelectElement
    expect(equipmentSelect).toBeInTheDocument()

    // Проверяем, что отображается стоимость
    expect(screen.getByText(/Стоимость:/i)).toBeInTheDocument()

    // Меняем на 2 места
    await user.selectOptions(equipmentSelect, '2')

    // Стоимость должна измениться (проверяем что отображается расчет для 2 мест)
    await waitFor(() => {
      expect(screen.getByText(/× 2/i)).toBeInTheDocument()
    })
  })

  describe('Полный UI flow бронирования', () => {
    it('изменение даты перезапрашивает доступные слоты', async () => {
      const user = userEvent.setup()

      render(<MakeBookingPage />)

      await waitFor(() => {
        expect(screen.getByText('Дата')).toBeInTheDocument()
      })

      // Сначала показываем слоты для первой даты
      await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

      await waitFor(() => {
        expect(vi.mocked(bookingApi.getFreeSlots)).toHaveBeenCalledTimes(1)
      })

      // Изменяем дату
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      if (dateInput) {
        await user.clear(dateInput)
        await user.type(dateInput, '2024-03-26')

        // Снова запрашиваем слоты
        await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

        await waitFor(() => {
          expect(vi.mocked(bookingApi.getFreeSlots)).toHaveBeenCalledTimes(2)
        })
      }
    })

    it('изменение количества игровых мест перезапрашивает слоты', async () => {
      const user = userEvent.setup()

      render(<MakeBookingPage />)

      await waitFor(() => {
        expect(screen.getByText('Количество игровых мест')).toBeInTheDocument()
      })

      // Запрашиваем слоты с начальными параметрами
      await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

      await waitFor(() => {
        expect(vi.mocked(bookingApi.getFreeSlots)).toHaveBeenCalledTimes(1)
      })

      // Изменяем количество мест
      const equipmentSelect = document.querySelector('select[name="cntEquipment"]') as HTMLSelectElement
      if (equipmentSelect) {
        await user.selectOptions(equipmentSelect, '3')

        // Снова запрашиваем слоты
        await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

        await waitFor(() => {
          expect(vi.mocked(bookingApi.getFreeSlots)).toHaveBeenCalledTimes(2)
        })
      }
    })

    it('изменение длительности перезапрашивает слоты и пересчитывает цену', async () => {
      const user = userEvent.setup()

      render(<MakeBookingPage />)

      await waitFor(() => {
        expect(screen.getByText('Длительность')).toBeInTheDocument()
      })

      // Запрашиваем слоты с 30 минутами
      await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

      await waitFor(() => {
        expect(vi.mocked(bookingApi.getFreeSlots)).toHaveBeenCalledTimes(1)
      })

      // Изменяем длительность на 60 минут
      const durationSelect = document.querySelector('select[name="durationMinutes"]') as HTMLSelectElement
      if (durationSelect) {
        await user.selectOptions(durationSelect, '60')

        // Проверяем, что цена обновилась (1500 для 60 минут)
        // Используем более точный селектор, чтобы не захватить <option> элемент
        await waitFor(() => {
          const priceElement = document.querySelector('p.font-semibold')
          expect(priceElement?.textContent).toMatch(/1500/)
        })

        // Снова запрашиваем слоты
        await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

        await waitFor(() => {
          expect(vi.mocked(bookingApi.getFreeSlots)).toHaveBeenCalledTimes(2)
        })
      }
    })

    it('при бронировании пожелания (note) корректно отправляются в API', async () => {
      const user = userEvent.setup()

      render(<MakeBookingPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })

      await user.click(screen.getByText('10:00'))

      // Вводим пожелания
      const textarea = screen.getByPlaceholderText(/Укажите ваши пожелания/i)
      await user.type(textarea, 'Хочу игру Beat Saber')

      // Создаем бронирование
      const bookButton = screen.getByRole('button', { name: /Забронировать/i })
      await user.click(bookButton)

      await waitFor(() => {
        expect(vi.mocked(bookingApi.makeBooking)).toHaveBeenCalledWith(
          1, // clubId
          expect.objectContaining({
            note: 'Хочу игру Beat Saber',
          })
        )
      })
    })
  })

  describe('Обработка заблокированного клиента', () => {
    it('страница загружается при ошибке получения информации о клубе', async () => {
      vi.mocked(searchApi.getClubFullInfo).mockRejectedValue(createBlockedError())

      render(<MakeBookingPage />)

      await waitFor(() => {
        // Страница загружается, но название клуба не отображается
        expect(screen.getByText(/Бронирование:/i)).toBeInTheDocument()
      })
    })

    it('форма отображается даже при ошибке загрузки клуба', async () => {
      vi.mocked(searchApi.getClubFullInfo).mockRejectedValue(createBlockedError())

      render(<MakeBookingPage />)

      await waitFor(() => {
        // Форма все равно рендерится
        expect(screen.getByText('Параметры бронирования')).toBeInTheDocument()
      })
    })

    it('отображает сообщение об ошибке при попытке создания бронирования заблокированным клиентом', async () => {
      const user = userEvent.setup()

      vi.mocked(bookingApi.makeBooking).mockRejectedValue(createBlockedError())

      render(<MakeBookingPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

      await waitFor(() => {
        expect(screen.getByText('10:00')).toBeInTheDocument()
      })

      await user.click(screen.getByText('10:00'))

      const bookButton = screen.getByRole('button', { name: /Забронировать/i })
      await user.click(bookButton)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка/i)).toBeInTheDocument()
      })
    })

    it('обрабатывает ошибку при получении свободных слотов', async () => {
      const user = userEvent.setup()

      vi.mocked(bookingApi.getFreeSlots).mockRejectedValue(createBlockedError())

      render(<MakeBookingPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Показать доступное время/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Показать доступное время/i }))

      // API вызывается, но возвращает ошибку - проверяем что вызов был сделан
      await waitFor(() => {
        expect(vi.mocked(bookingApi.getFreeSlots)).toHaveBeenCalled()
      })
    })
  })
})
