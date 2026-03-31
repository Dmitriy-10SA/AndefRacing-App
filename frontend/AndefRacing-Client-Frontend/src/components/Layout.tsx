import { useState, useEffect } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import ConfirmModal from './ConfirmModal'

const Layout = () => {
  const { isAuthenticated, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Закрываем мобильное меню при переходе на другую страницу
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const getLinkClassName = (path: string, mobile = false) => {
    if (mobile) {
      const baseClass = "block py-2 px-4 rounded-lg transition-colors"
      if (isActive(path)) {
        return `${baseClass} bg-primary-700 font-semibold`
      }
      return `${baseClass} hover:bg-primary-700`
    }
    const baseClass = "transition-colors border-b-2"
    if (isActive(path)) {
      return `${baseClass} border-white font-semibold`
    }
    return `${baseClass} border-transparent hover:border-primary-200 hover:text-primary-200`
  }

  const handleLogoutClick = () => {
    setIsMobileMenuOpen(false)
    setShowLogoutModal(true)
  }

  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutModal(false)
    navigate('/auth/login')
  }

  const handleLogoutCancel = () => {
    setShowLogoutModal(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/search" className="text-xl sm:text-2xl font-bold flex items-center gap-2 sm:gap-3">
              <img src="/race-flag.svg" alt="AndefRacing" className="w-7 h-7 sm:w-8 sm:h-8" />
              AndefRacing
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/search" className={getLinkClassName('/search')}>
                Поиск клубов
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/favorites" className={getLinkClassName('/favorites')}>
                    Избранное
                  </Link>
                  <Link to="/bookings" className={getLinkClassName('/bookings')}>
                    Мои бронирования
                  </Link>
                  <Link to="/profile" className={getLinkClassName('/profile')}>
                    Профиль
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="hover:text-primary-200 transition-colors"
                  >
                    Выход
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Link to="/auth/login" className={getLinkClassName('/auth/login')}>
                    Вход
                  </Link>
                  <Link to="/auth/register" className="btn bg-white text-primary-600 hover:bg-gray-100">
                    Регистрация
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-primary-700 transition-colors"
              aria-label="Меню"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-2 space-y-1">
              <Link to="/search" className={getLinkClassName('/search', true)}>
                Поиск клубов
              </Link>
              {isAuthenticated && (
                <>
                  <Link to="/favorites" className={getLinkClassName('/favorites', true)}>
                    Избранное
                  </Link>
                  <Link to="/bookings" className={getLinkClassName('/bookings', true)}>
                    Мои бронирования
                  </Link>
                  <Link to="/profile" className={getLinkClassName('/profile', true)}>
                    Профиль
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="block w-full text-left py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Выход
                  </button>
                </>
              )}
              {!isAuthenticated && (
                <>
                  <Link to="/auth/login" className={getLinkClassName('/auth/login', true)}>
                    Вход
                  </Link>
                  <Link to="/auth/register" className={getLinkClassName('/auth/register', true)}>
                    Регистрация
                  </Link>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <ConfirmModal
        isOpen={showLogoutModal}
        title="Подтверждение выхода"
        message="Вы уверены, что хотите выйти из аккаунта?"
        confirmText="Выйти"
        cancelText="Отмена"
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </div>
  )
}

export default Layout
