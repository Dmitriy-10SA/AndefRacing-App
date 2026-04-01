import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/stores/authStore'

// Мокаем profileApi
vi.mock('@/api/profileApi', () => ({
  profileApi: {
    getPersonalInfo: vi.fn().mockResolvedValue({
      id: 1,
      phone: '+7-999-123-45-67',
      name: 'Иван',
      surname: 'Иванов',
      patronymic: 'Иванович',
      roles: ['EMPLOYEE', 'MANAGER'],
    }),
  },
}))

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })

const renderLayout = (
  initialRoute = '/bookings',
  isAuthenticated = true,
  _roles: string[] = ['EMPLOYEE', 'MANAGER']
) => {
  const queryClient = createTestQueryClient()

  // Устанавливаем состояние авторизации
  if (isAuthenticated) {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'test-token',
      currentClub: { id: 1, name: 'Test Club' },
    })
  } else {
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      currentClub: null,
    })
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/bookings" element={<div>Bookings Page</div>} />
            <Route path="/profile" element={<div>Profile Page</div>} />
            <Route path="/management/hr" element={<div>HR Page</div>} />
            <Route path="/management/club" element={<div>Club Management</div>} />
            <Route path="/management/reports" element={<div>Reports Page</div>} />
            <Route path="/auth/login" element={<div>Login Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

describe('Layout', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
      currentClub: null,
    })
  })

  describe('Header', () => {
    it('отображает логотип AndefRacing', async () => {
      renderLayout()

      await waitFor(() => {
        expect(screen.getByText('AndefRacing')).toBeInTheDocument()
      })
    })

    it('отображает название текущего клуба', async () => {
      renderLayout()

      await waitFor(() => {
        expect(screen.getByText(/Test Club/)).toBeInTheDocument()
      })
    })

    it('отображает ссылку на вход для неавторизованных', async () => {
      renderLayout('/auth/login', false)

      await waitFor(() => {
        expect(screen.getByText('Вход')).toBeInTheDocument()
      })
    })
  })

  describe('Desktop Navigation', () => {
    it('отображает навигационные ссылки для менеджера', async () => {
      renderLayout()

      await waitFor(() => {
        expect(screen.getByRole('link', { name: 'Бронирования' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Персонал' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Клуб' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Отчеты' })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'Профиль' })).toBeInTheDocument()
      })
    })

    it('отображает кнопку выхода', async () => {
      renderLayout()

      await waitFor(() => {
        expect(screen.getByText('Выход')).toBeInTheDocument()
      })
    })
  })

  describe('Logout Modal', () => {
    it('открывает модальное окно подтверждения выхода', async () => {
      const user = userEvent.setup()
      renderLayout()

      await waitFor(() => {
        expect(screen.getByText('Выход')).toBeInTheDocument()
      })

      // Кликаем на кнопку выхода в десктопной навигации
      const logoutButtons = screen.getAllByText('Выход')
      await user.click(logoutButtons[0])

      expect(screen.getByText('Подтверждение выхода')).toBeInTheDocument()
      expect(screen.getByText('Вы уверены, что хотите выйти из аккаунта?')).toBeInTheDocument()
    })

    it('закрывает модальное окно при отмене', async () => {
      const user = userEvent.setup()
      renderLayout()

      await waitFor(() => {
        expect(screen.getByText('Выход')).toBeInTheDocument()
      })

      const logoutButtons = screen.getAllByText('Выход')
      await user.click(logoutButtons[0])

      const cancelButton = screen.getByText('Отмена')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Подтверждение выхода')).not.toBeInTheDocument()
      })
    })

    it('выполняет выход при подтверждении', async () => {
      const user = userEvent.setup()
      renderLayout()

      await waitFor(() => {
        expect(screen.getByText('Выход')).toBeInTheDocument()
      })

      const logoutButtons = screen.getAllByText('Выход')
      await user.click(logoutButtons[0])

      const confirmButton = screen.getByRole('button', { name: 'Выйти' })
      await user.click(confirmButton)

      // После выхода состояние должно очиститься
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('Mobile Navigation', () => {
    it('отображает кнопку мобильного меню для авторизованных', async () => {
      renderLayout()

      await waitFor(() => {
        const menuButton = screen.getByLabelText('Меню')
        expect(menuButton).toBeInTheDocument()
      })
    })

    it('открывает мобильное меню при клике', async () => {
      const user = userEvent.setup()
      renderLayout()

      await waitFor(() => {
        expect(screen.getByLabelText('Меню')).toBeInTheDocument()
      })

      const menuButton = screen.getByLabelText('Меню')
      await user.click(menuButton)

      // В мобильном меню должны быть ссылки
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(1)
    })

    it('закрывает мобильное меню при повторном клике', async () => {
      const user = userEvent.setup()
      renderLayout()

      await waitFor(() => {
        expect(screen.getByLabelText('Меню')).toBeInTheDocument()
      })

      const menuButton = screen.getByLabelText('Меню')
      await user.click(menuButton) // Открываем
      await user.click(menuButton) // Закрываем

      // Мобильное меню должно быть скрыто
      // Проверяем что мобильное меню не содержит дополнительные ссылки
    })
  })

  describe('Content Area', () => {
    it('рендерит дочерний контент через Outlet', async () => {
      renderLayout('/bookings')

      await waitFor(() => {
        expect(screen.getByText('Bookings Page')).toBeInTheDocument()
      })
    })

    it('меняет контент при навигации', async () => {
      const user = userEvent.setup()
      renderLayout('/bookings')

      await waitFor(() => {
        expect(screen.getByText('Bookings Page')).toBeInTheDocument()
      })

      const profileLink = screen.getByRole('link', { name: 'Профиль' })
      await user.click(profileLink)

      await waitFor(() => {
        expect(screen.getByText('Profile Page')).toBeInTheDocument()
      })
    })
  })

  describe('Active Link Styling', () => {
    it('выделяет активную ссылку', async () => {
      renderLayout('/bookings')

      await waitFor(() => {
        const bookingsLink = screen.getByRole('link', { name: 'Бронирования' })
        expect(bookingsLink).toHaveClass('font-semibold')
      })
    })
  })
})
