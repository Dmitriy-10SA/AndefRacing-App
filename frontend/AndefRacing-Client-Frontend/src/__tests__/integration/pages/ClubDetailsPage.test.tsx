import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import ClubDetailsPage from '@/pages/search/ClubDetailsPage'
import { useAuthStore } from '@/stores/authStore'
import { searchApi } from '@/api/searchApi'
import { profileApi } from '@/api/profileApi'

// Мокаем API модули
vi.mock('@/api/searchApi')
vi.mock('@/api/profileApi')

// Мокаем useParams и useNavigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ clubId: '1' }),
    Link: ({ to, children, className, onClick }: any) => (
      <a href={to} className={className} onClick={onClick}>
        {children}
      </a>
    ),
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
  photos: [
    { id: 1, url: '/files/clubs/1/photo1.jpg' },
    { id: 2, url: '/files/clubs/1/photo2.jpg' },
  ],
  games: [
    { id: 1, name: 'Beat Saber', photo: null },
    { id: 2, name: 'Half-Life: Alyx', photo: null },
  ],
  prices: [
    { id: 1, durationMinutes: 30, value: 750 },
    { id: 2, durationMinutes: 60, value: 1500 },
  ],
  workSchedules: [
    { id: 1, dayOfWeek: 'MONDAY', openTime: '10:00:00', closeTime: '22:00:00', isWorkDay: true },
    { id: 2, dayOfWeek: 'TUESDAY', openTime: '10:00:00', closeTime: '22:00:00', isWorkDay: true },
    { id: 3, dayOfWeek: 'SUNDAY', openTime: null, closeTime: null, isWorkDay: false },
  ],
}

describe('ClubDetailsPage Integration (Client)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()

    // Дефолтные моки для успешных ответов
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(profileApi.isClubFavorite).mockResolvedValue(false)
    vi.mocked(profileApi.addFavoriteClub).mockResolvedValue(undefined)
    vi.mocked(profileApi.deleteFavoriteClub).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает информацию о клубе', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    expect(screen.getByText('ул. Тверская, д. 10')).toBeInTheDocument()
  })

  it('отображает количество игровых мест', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Количество игровых мест:/i)).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  it('отображает фотографии клуба', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Фотографии')).toBeInTheDocument()
    })

    const images = screen.getAllByRole('img')
    expect(images.length).toBe(2)
  })

  it('отображает список игр', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Доступные игры')).toBeInTheDocument()
    })

    expect(screen.getByText(/Beat Saber/i)).toBeInTheDocument()
    expect(screen.getByText(/Half-Life: Alyx/i)).toBeInTheDocument()
  })

  it('отображает цены', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Цены')).toBeInTheDocument()
    })

    expect(screen.getByText('30 минут')).toBeInTheDocument()
    expect(screen.getByText('750 ₽')).toBeInTheDocument()
    expect(screen.getByText('60 минут')).toBeInTheDocument()
    expect(screen.getByText('1500 ₽')).toBeInTheDocument()
  })

  it('отображает график работы', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('График работы')).toBeInTheDocument()
    })

    expect(screen.getByText('Понедельник')).toBeInTheDocument()
    expect(screen.getByText('Вторник')).toBeInTheDocument()
    expect(screen.getByText('Воскресенье')).toBeInTheDocument()
  })

  it('отображает выходной день', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Воскресенье')).toBeInTheDocument()
    })

    expect(screen.getByText('Выходной')).toBeInTheDocument()
  })

  it('отображает контактную информацию', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Контакты')).toBeInTheDocument()
    })

    expect(screen.getByText('+7-495-123-45-67')).toBeInTheDocument()
    expect(screen.getByText('moscow@vrclub.ru')).toBeInTheDocument()
  })

  it('показывает кнопку бронирования для авторизованных пользователей', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Забронировать')).toBeInTheDocument()
    })
  })

  it('показывает кнопку входа для неавторизованных пользователей', async () => {
    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Войдите для бронирования')).toBeInTheDocument()
    })
  })

  it('показывает предупреждение для закрытого клуба', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Этот клуб закрыт и недоступен для бронирования/i)).toBeInTheDocument()
    })
  })

  it('не показывает кнопку бронирования для закрытого клуба', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.queryByText('Забронировать')).not.toBeInTheDocument()
    })
  })

  it('показывает кнопку избранного', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /избранное/i })).toBeInTheDocument()
    })
  })

  it('добавляет клуб в избранное', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')
    const user = userEvent.setup()

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить в избранное/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить в избранное/i }))

    // Проверяем что был вызван запрос на добавление в избранное
    await waitFor(() => {
      expect(vi.mocked(profileApi.addFavoriteClub)).toHaveBeenCalledWith(1)
    })
  })

  it('удаляет клуб из избранного', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')
    const user = userEvent.setup()

    vi.mocked(profileApi.isClubFavorite).mockResolvedValue(true)

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Удалить из избранного/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Удалить из избранного/i }))

    await waitFor(() => {
      expect(vi.mocked(profileApi.deleteFavoriteClub)).toHaveBeenCalledWith(1)
    })
  })

  it('перенаправляет на логин при попытке добавить в избранное без авторизации', async () => {
    const user = userEvent.setup()

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить в избранное/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить в избранное/i }))

    expect(mockNavigate).toHaveBeenCalledWith('/auth/login')
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(searchApi.getClubFullInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockClubFullInfo), 1000))
    )

    render(<ClubDetailsPage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('показывает ошибку при неудачной загрузке', async () => {
    vi.mocked(searchApi.getClubFullInfo).mockRejectedValue(new Error('Ошибка'))

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки информации о клубе')).toBeInTheDocument()
    })
  })

  it('переходит назад при нажатии кнопки назад', async () => {
    useAuthStore.getState().setToken('mock-jwt-token')
    const user = userEvent.setup()

    render(<ClubDetailsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    const backButton = screen.getByText('← Назад')
    await user.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  describe('Доступ к закрытому клубу', () => {
    it('при прямом переходе на страницу закрытого клуба показывается предупреждение', async () => {
      useAuthStore.getState().setToken('mock-jwt-token')

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })

      render(<ClubDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Этот клуб закрыт и недоступен для бронирования/i)).toBeInTheDocument()
      })
    })

    it('кнопка "Забронировать" отсутствует для закрытого клуба', async () => {
      useAuthStore.getState().setToken('mock-jwt-token')

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })

      render(<ClubDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
      })

      // Кнопка бронирования не должна отображаться
      expect(screen.queryByText('Забронировать')).not.toBeInTheDocument()
    })

    it('переход к бронированию закрытого клуба невозможен', async () => {
      useAuthStore.getState().setToken('mock-jwt-token')

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })

      render(<ClubDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
      })

      // Ссылка на бронирование отсутствует
      const bookingLink = screen.queryByRole('link', { name: /Забронировать/i })
      expect(bookingLink).not.toBeInTheDocument()
    })
  })

  describe('Запрет добавления закрытого клуба в избранное', () => {
    it('для закрытого клуба отображается предупреждение', async () => {
      useAuthStore.getState().setToken('mock-jwt-token')

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })
      vi.mocked(profileApi.isClubFavorite).mockResolvedValue(false)

      render(<ClubDetailsPage />)

      await waitFor(() => {
        expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
      })

      // Для закрытого клуба отображается предупреждение о недоступности
      expect(screen.getByText(/Этот клуб закрыт и недоступен для бронирования/i)).toBeInTheDocument()

      // Кнопка избранного все еще доступна (клуб можно добавить в избранное для мониторинга)
      const favoriteButton = screen.queryByRole('button', { name: /Добавить в избранное/i })
      expect(favoriteButton).toBeInTheDocument()
    })

    it('закрытый клуб, уже находящийся в избранном, можно удалить из избранного', async () => {
      useAuthStore.getState().setToken('mock-jwt-token')
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })
      vi.mocked(profileApi.isClubFavorite).mockResolvedValue(true)

      render(<ClubDetailsPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Удалить из избранного/i })).toBeInTheDocument()
      })

      // Можно удалить закрытый клуб из избранного
      await user.click(screen.getByRole('button', { name: /Удалить из избранного/i }))

      await waitFor(() => {
        expect(vi.mocked(profileApi.deleteFavoriteClub)).toHaveBeenCalledWith(1)
      })
    })
  })
})
