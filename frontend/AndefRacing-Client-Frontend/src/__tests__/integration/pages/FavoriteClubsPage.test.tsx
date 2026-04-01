import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import FavoriteClubsPage from '@/pages/favorites/FavoriteClubsPage'
import { usePageStateStore } from '@/stores/pageStateStore'
import { useAuthStore } from '@/stores/authStore'
import { profileApi } from '@/api/profileApi'
import { AxiosError } from 'axios'

// Мокаем API модули
vi.mock('@/api/profileApi')

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

// Мокаем useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

const mockFavoriteClubs = [
  {
    id: 1,
    name: 'VR Club Moscow',
    phone: '+7-495-123-45-67',
    email: 'moscow@vrclub.ru',
    address: 'ул. Тверская, д. 10',
    cntEquipment: 10,
    isOpen: true,
    mainPhoto: { id: 1, url: '/files/clubs/1/main.jpg' },
    city: { id: 1, name: 'Москва', region: { id: 1, name: 'Московская область' } },
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
    city: { id: 2, name: 'Санкт-Петербург', region: { id: 2, name: 'Ленинградская область' } },
  },
]

const mockFavoriteClubsResponse = {
  content: mockFavoriteClubs,
  pageInfo: {
    pageNumber: 0,
    pageSize: 9,
    totalElements: 2,
    totalPages: 1,
    isLast: true,
  },
}

describe('FavoriteClubsPage Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    usePageStateStore.getState().resetFavoritesPageState()
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтные моки для успешных ответов
    vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue(mockFavoriteClubsResponse)
    vi.mocked(profileApi.deleteFavoriteClub).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает список избранных клубов', async () => {
    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    expect(screen.getByText('Избранные клубы')).toBeInTheDocument()
    expect(screen.getByText('VR Club SPb')).toBeInTheDocument()
    expect(screen.getByText('ул. Тверская, д. 10')).toBeInTheDocument()
    expect(screen.getByText('Невский пр., д. 100')).toBeInTheDocument()
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(profileApi.getFavoriteClubs).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockFavoriteClubsResponse), 1000))
    )

    render(<FavoriteClubsPage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('показывает пустое состояние, когда нет избранных клубов', async () => {
    vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
      content: [],
      pageInfo: { pageNumber: 0, pageSize: 9, totalElements: 0, totalPages: 0, isLast: true },
    })

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('У вас пока нет избранных клубов')).toBeInTheDocument()
    })

    const searchLink = screen.getByRole('link', { name: 'Найти клубы' })
    expect(searchLink).toHaveAttribute('href', '/search')
  })

  it('показывает предупреждение для закрытых клубов', async () => {
    vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
      content: [
        {
          ...mockFavoriteClubs[0],
          isOpen: false,
        },
      ],
      pageInfo: { pageNumber: 0, pageSize: 9, totalElements: 1, totalPages: 1, isLast: true },
    })

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('⚠️ Клуб закрыт')).toBeInTheDocument()
    })
  })

  it('открывает модальное окно подтверждения при удалении', async () => {
    const user = userEvent.setup()

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    // Нажимаем на кнопку удаления из избранного (иконка сердца)
    const heartButtons = screen.getAllByRole('button', { name: /Удалить из избранного/i })

    await user.click(heartButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Вы уверены, что хотите удалить этот клуб из избранного?')).toBeInTheDocument()
    })
  })

  it('удаляет клуб из избранного при подтверждении', async () => {
    const user = userEvent.setup()

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    // Нажимаем на кнопку удаления
    const heartButtons = screen.getAllByRole('button', { name: /Удалить из избранного/i })

    await user.click(heartButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Вы уверены, что хотите удалить этот клуб из избранного?')).toBeInTheDocument()
    })

    // Подтверждаем удаление
    const confirmButton = screen.getByRole('button', { name: 'Удалить' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(vi.mocked(profileApi.deleteFavoriteClub)).toHaveBeenCalled()
      expect(vi.mocked(profileApi.deleteFavoriteClub).mock.calls[0][0]).toBe(1)
    })
  })

  it('закрывает модальное окно при отмене', async () => {
    const user = userEvent.setup()

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    const heartButtons = screen.getAllByRole('button', { name: /Удалить из избранного/i })

    await user.click(heartButtons[0])

    await waitFor(() => {
      expect(screen.getByText('Вы уверены, что хотите удалить этот клуб из избранного?')).toBeInTheDocument()
    })

    // Нажимаем Отмена
    const cancelButton = screen.getByRole('button', { name: 'Отмена' })
    await user.click(cancelButton)

    await waitFor(() => {
      expect(screen.queryByText('Вы уверены, что хотите удалить этот клуб из избранного?')).not.toBeInTheDocument()
    })
  })

  it('карточка клуба содержит ссылку на детали', async () => {
    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    const clubLinks = screen.getAllByRole('link')
    const moscowClubLink = clubLinks.find(link => link.getAttribute('href') === '/clubs/1')
    expect(moscowClubLink).toBeInTheDocument()
  })

  it('показывает ошибку при неудачной загрузке', async () => {
    vi.mocked(profileApi.getFavoriteClubs).mockRejectedValue(new Error('Ошибка'))

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки избранных клубов')).toBeInTheDocument()
    })
  })

  it('показывает пагинацию при нескольких страницах', async () => {
    vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
      content: mockFavoriteClubs,
      pageInfo: {
        pageNumber: 0,
        pageSize: 9,
        totalElements: 20,
        totalPages: 3,
        isLast: false,
      },
    })

    render(<FavoriteClubsPage />)

    await waitFor(() => {
      expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument()
  })

  describe('Обработка заблокированного клиента', () => {
    it('отображает сообщение об ошибке при загрузке избранных клубов заблокированного клиента', async () => {
      vi.mocked(profileApi.getFavoriteClubs).mockRejectedValue(createBlockedError())

      render(<FavoriteClubsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки избранных клубов/i)).toBeInTheDocument()
      })
    })

    it('не отображает список избранных клубов для заблокированного клиента', async () => {
      vi.mocked(profileApi.getFavoriteClubs).mockRejectedValue(createBlockedError())

      render(<FavoriteClubsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки избранных клубов/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('VR Club Moscow')).not.toBeInTheDocument()
      expect(screen.queryByText('VR Club SPb')).not.toBeInTheDocument()
    })

    it('не показывает кнопки управления избранным для заблокированного клиента', async () => {
      vi.mocked(profileApi.getFavoriteClubs).mockRejectedValue(createBlockedError())

      render(<FavoriteClubsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки избранных клубов/i)).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /Удалить из избранного/i })).not.toBeInTheDocument()
    })
  })

  describe('Отображение закрытого клуба в избранном', () => {
    it('закрытый клуб в избранном показывает оповещение о закрытии', async () => {
      vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
        content: [
          {
            ...mockFavoriteClubs[0],
            isOpen: false,
          },
        ],
        pageInfo: { pageNumber: 0, pageSize: 9, totalElements: 1, totalPages: 1, isLast: true },
      })

      render(<FavoriteClubsPage />)

      await waitFor(() => {
        expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
      })

      expect(screen.getByText('⚠️ Клуб закрыт')).toBeInTheDocument()
    })

    it('для закрытого клуба в избранном кнопка бронирования недоступна', async () => {
      vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
        content: [
          {
            ...mockFavoriteClubs[0],
            isOpen: false,
          },
        ],
        pageInfo: { pageNumber: 0, pageSize: 9, totalElements: 1, totalPages: 1, isLast: true },
      })

      render(<FavoriteClubsPage />)

      await waitFor(() => {
        expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
      })

      // Для закрытого клуба не должно быть кнопки бронирования или она должна быть заблокирована
      const bookingButton = screen.queryByRole('button', { name: /Забронировать/i })
      if (bookingButton) {
        expect(bookingButton).toBeDisabled()
      } else {
        // Кнопка отсутствует - это тоже допустимо
        expect(bookingButton).toBeNull()
      }
    })

    it('закрытый клуб в избранном отображается с визуальным отличием', async () => {
      vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
        content: [
          {
            ...mockFavoriteClubs[0],
            isOpen: false,
          },
          {
            ...mockFavoriteClubs[1],
            isOpen: true,
          },
        ],
        pageInfo: { pageNumber: 0, pageSize: 9, totalElements: 2, totalPages: 1, isLast: true },
      })

      render(<FavoriteClubsPage />)

      await waitFor(() => {
        expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
        expect(screen.getByText('VR Club SPb')).toBeInTheDocument()
      })

      // Только закрытый клуб показывает предупреждение
      expect(screen.getByText('⚠️ Клуб закрыт')).toBeInTheDocument()
    })

    it('можно просмотреть детали закрытого клуба из избранного', async () => {
      vi.mocked(profileApi.getFavoriteClubs).mockResolvedValue({
        content: [
          {
            ...mockFavoriteClubs[0],
            isOpen: false,
          },
        ],
        pageInfo: { pageNumber: 0, pageSize: 9, totalElements: 1, totalPages: 1, isLast: true },
      })

      render(<FavoriteClubsPage />)

      await waitFor(() => {
        expect(screen.getByText('VR Club Moscow')).toBeInTheDocument()
      })

      // Ссылка на детали клуба должна быть доступна
      const clubLink = screen.getByRole('link', { name: /VR Club Moscow/i })
        || screen.getAllByRole('link').find(link => link.getAttribute('href') === '/clubs/1')
      expect(clubLink).toBeInTheDocument()
    })
  })
})
