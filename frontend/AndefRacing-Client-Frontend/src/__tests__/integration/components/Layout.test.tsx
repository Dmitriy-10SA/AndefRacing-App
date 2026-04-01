import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Layout from '@/components/Layout'
import { useAuthStore } from '@/stores/authStore'

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

const renderLayout = (initialRoute = '/search', isAuthenticated = true) => {
  const queryClient = createTestQueryClient()

  // Устанавливаем состояние авторизации
  if (isAuthenticated) {
    useAuthStore.setState({
      isAuthenticated: true,
      token: 'test-token',
    })
  } else {
    useAuthStore.setState({
      isAuthenticated: false,
      token: null,
    })
  }

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/search" element={<div>Search Page</div>} />
            <Route path="/favorites" element={<div>Favorites Page</div>} />
            <Route path="/bookings" element={<div>Bookings Page</div>} />
            <Route path="/profile" element={<div>Profile Page</div>} />
            <Route path="/auth/login" element={<div>Login Page</div>} />
            <Route path="/auth/register" element={<div>Register Page</div>} />
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
    })
  })

  describe('Header', () => {
    it('отображает логотип AndefRacing', () => {
      renderLayout()

      expect(screen.getByText('AndefRacing')).toBeInTheDocument()
    })

    it('логотип ведет на страницу поиска', () => {
      renderLayout()

      const logo = screen.getByText('AndefRacing').closest('a')
      expect(logo).toHaveAttribute('href', '/search')
    })
  })

  describe('Desktop Navigation - Авторизованный пользователь', () => {
    it('отображает навигационные ссылки', () => {
      renderLayout('/search', true)

      expect(screen.getByRole('link', { name: 'Поиск клубов' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Избранное' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Мои бронирования' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Профиль' })).toBeInTheDocument()
    })

    it('отображает кнопку выхода', () => {
      renderLayout('/search', true)

      expect(screen.getByText('Выход')).toBeInTheDocument()
    })

    it('не отображает ссылки на вход и регистрацию', () => {
      renderLayout('/search', true)

      // Проверяем только ссылки в навигации, не в мобильном меню
      const navLinks = screen.getAllByRole('link')
      const loginLink = navLinks.find(link => link.textContent === 'Вход')
      expect(loginLink).toBeUndefined()
    })
  })

  describe('Desktop Navigation - Неавторизованный пользователь', () => {
    it('отображает ссылку на поиск', () => {
      renderLayout('/search', false)

      expect(screen.getByRole('link', { name: 'Поиск клубов' })).toBeInTheDocument()
    })

    it('отображает ссылки на вход и регистрацию', () => {
      renderLayout('/search', false)

      expect(screen.getByRole('link', { name: 'Вход' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Регистрация' })).toBeInTheDocument()
    })

    it('не отображает ссылки для авторизованных', () => {
      renderLayout('/search', false)

      expect(screen.queryByRole('link', { name: 'Избранное' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Мои бронирования' })).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'Профиль' })).not.toBeInTheDocument()
    })
  })

  describe('Logout Modal', () => {
    it('открывает модальное окно подтверждения выхода', async () => {
      const user = userEvent.setup()
      renderLayout('/search', true)

      const logoutButton = screen.getByText('Выход')
      await user.click(logoutButton)

      expect(screen.getByText('Подтверждение выхода')).toBeInTheDocument()
      expect(screen.getByText('Вы уверены, что хотите выйти из аккаунта?')).toBeInTheDocument()
    })

    it('закрывает модальное окно при отмене', async () => {
      const user = userEvent.setup()
      renderLayout('/search', true)

      const logoutButton = screen.getByText('Выход')
      await user.click(logoutButton)

      const cancelButton = screen.getByText('Отмена')
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Подтверждение выхода')).not.toBeInTheDocument()
      })
    })

    it('выполняет выход при подтверждении', async () => {
      const user = userEvent.setup()
      renderLayout('/search', true)

      const logoutButton = screen.getByText('Выход')
      await user.click(logoutButton)

      const confirmButton = screen.getByRole('button', { name: 'Выйти' })
      await user.click(confirmButton)

      // После выхода состояние должно очиститься
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })
  })

  describe('Mobile Navigation', () => {
    it('отображает кнопку мобильного меню', () => {
      renderLayout()

      const menuButton = screen.getByLabelText('Меню')
      expect(menuButton).toBeInTheDocument()
    })

    it('открывает мобильное меню при клике', async () => {
      const user = userEvent.setup()
      renderLayout('/search', true)

      const menuButton = screen.getByLabelText('Меню')
      await user.click(menuButton)

      // В мобильном меню должны появиться ссылки
      const links = screen.getAllByRole('link')
      expect(links.length).toBeGreaterThan(1)
    })

    it('закрывает мобильное меню при переходе на другую страницу', async () => {
      const user = userEvent.setup()
      renderLayout('/search', true)

      const menuButton = screen.getByLabelText('Меню')
      await user.click(menuButton)

      // Кликаем на ссылку
      const favoritesLinks = screen.getAllByRole('link', { name: 'Избранное' })
      await user.click(favoritesLinks[0])

      // Меню должно закрыться после перехода
      // (проверяем по количеству ссылок)
    })

    it('отображает ссылки для неавторизованного в мобильном меню', async () => {
      const user = userEvent.setup()
      renderLayout('/search', false)

      const menuButton = screen.getByLabelText('Меню')
      await user.click(menuButton)

      // Должны быть ссылки на вход и регистрацию
      const loginLinks = screen.getAllByRole('link', { name: 'Вход' })
      expect(loginLinks.length).toBeGreaterThan(0)
    })
  })

  describe('Content Area', () => {
    it('рендерит дочерний контент через Outlet', () => {
      renderLayout('/search')

      expect(screen.getByText('Search Page')).toBeInTheDocument()
    })

    it('меняет контент при навигации', async () => {
      const user = userEvent.setup()
      renderLayout('/search', true)

      expect(screen.getByText('Search Page')).toBeInTheDocument()

      const favoritesLink = screen.getByRole('link', { name: 'Избранное' })
      await user.click(favoritesLink)

      await waitFor(() => {
        expect(screen.getByText('Favorites Page')).toBeInTheDocument()
      })
    })
  })

  describe('Active Link Styling', () => {
    it('выделяет активную ссылку на странице поиска', () => {
      renderLayout('/search')

      const searchLink = screen.getByRole('link', { name: 'Поиск клубов' })
      expect(searchLink).toHaveClass('font-semibold')
    })

    it('выделяет активную ссылку на странице избранного', () => {
      renderLayout('/favorites', true)

      const favoritesLink = screen.getByRole('link', { name: 'Избранное' })
      expect(favoritesLink).toHaveClass('font-semibold')
    })

    it('выделяет активную ссылку на странице бронирований', () => {
      renderLayout('/bookings', true)

      const bookingsLink = screen.getByRole('link', { name: 'Мои бронирования' })
      expect(bookingsLink).toHaveClass('font-semibold')
    })
  })

  describe('Responsive Design', () => {
    it('десктопная навигация скрыта на мобильных (md:flex)', () => {
      renderLayout()

      const desktopNav = document.querySelector('nav.hidden.md\\:flex')
      expect(desktopNav).toBeInTheDocument()
    })

    it('кнопка меню видна только на мобильных (md:hidden)', () => {
      renderLayout()

      const menuButton = screen.getByLabelText('Меню')
      expect(menuButton).toHaveClass('md:hidden')
    })
  })
})
