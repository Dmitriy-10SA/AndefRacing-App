import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useQuery } from '@tanstack/react-query'
import { profileApi } from '@/api/profileApi'
import ConfirmModal from './ConfirmModal'
import { EmployeeRole } from '@/types'

const Layout = () => {
  const { isAuthenticated, logout, currentClub } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const { data: personalInfo } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getPersonalInfo,
    enabled: isAuthenticated,
  })

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const getLinkClassName = (path: string) => {
    const baseClass = "transition-colors border-b-2"
    if (isActive(path)) {
      return `${baseClass} border-white font-semibold`
    }
    return `${baseClass} border-transparent hover:border-primary-200 hover:text-primary-200`
  }

  const getMobileLinkClassName = (path: string) => {
    const baseClass = "block py-3 px-4 transition-colors"
    if (isActive(path)) {
      return `${baseClass} bg-primary-700 font-semibold`
    }
    return `${baseClass} hover:bg-primary-700`
  }

  const handleLogoutClick = () => {
    setShowLogoutModal(true)
    setIsMobileMenuOpen(false)
  }

  const handleLogoutConfirm = () => {
    logout()
    setShowLogoutModal(false)
    navigate('/auth/login')
  }

  const handleLogoutCancel = () => {
    setShowLogoutModal(false)
  }

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false)
  }

  const isManager = personalInfo?.roles.includes(EmployeeRole.MANAGER)
  const isAdmin = personalInfo?.roles.includes(EmployeeRole.ADMINISTRATOR)
  const hasAccessToBookings = isManager || isAdmin

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to={hasAccessToBookings ? "/bookings" : "/profile"}
              className="text-xl md:text-2xl font-bold flex items-center gap-2 md:gap-3"
            >
              <img src="/race-flag.svg" alt="AndefRacing" className="w-6 h-6 md:w-8 md:h-8" />
              <span className="hidden sm:inline">AndefRacing</span>
              <span className="sm:hidden">AR</span>
              {currentClub && (
                <span className="text-xs md:text-sm font-normal hidden md:inline">• {currentClub.name}</span>
              )}
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              {isAuthenticated && (
                <>
                  {hasAccessToBookings && (
                    <Link to="/bookings" className={getLinkClassName('/bookings')}>
                      Бронирования
                    </Link>
                  )}
                  {isManager && (
                    <>
                      <Link to="/management/hr" className={getLinkClassName('/management/hr')}>
                        Персонал
                      </Link>
                      <Link to="/management/club" className={getLinkClassName('/management/club')}>
                        Клуб
                      </Link>
                      <Link to="/management/reports" className={getLinkClassName('/management/reports')}>
                        Отчеты
                      </Link>
                    </>
                  )}
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
                <Link to="/auth/login" className={getLinkClassName('/auth/login')}>
                  Вход
                </Link>
              )}
            </nav>

            {/* Mobile Menu Button */}
            {isAuthenticated && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 hover:bg-primary-700 rounded transition-colors"
                aria-label="Меню"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>

          {/* Mobile Menu */}
          {isAuthenticated && isMobileMenuOpen && (
            <nav className="lg:hidden mt-4 border-t border-primary-700 pt-4">
              {currentClub && (
                <div className="px-4 py-2 text-sm text-primary-200 border-b border-primary-700 mb-2">
                  {currentClub.name}
                </div>
              )}
              {hasAccessToBookings && (
                <Link
                  to="/bookings"
                  className={getMobileLinkClassName('/bookings')}
                  onClick={handleMobileLinkClick}
                >
                  Бронирования
                </Link>
              )}
              {isManager && (
                <>
                  <Link
                    to="/management/hr"
                    className={getMobileLinkClassName('/management/hr')}
                    onClick={handleMobileLinkClick}
                  >
                    Персонал
                  </Link>
                  <Link
                    to="/management/club"
                    className={getMobileLinkClassName('/management/club')}
                    onClick={handleMobileLinkClick}
                  >
                    Клуб
                  </Link>
                  <Link
                    to="/management/reports"
                    className={getMobileLinkClassName('/management/reports')}
                    onClick={handleMobileLinkClick}
                  >
                    Отчеты
                  </Link>
                </>
              )}
              <Link
                to="/profile"
                className={getMobileLinkClassName('/profile')}
                onClick={handleMobileLinkClick}
              >
                Профиль
              </Link>
              <button
                onClick={handleLogoutClick}
                className="block w-full text-left py-3 px-4 hover:bg-primary-700 transition-colors border-t border-primary-700 mt-2"
              >
                Выход
              </button>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-3 sm:px-4 py-4 sm:py-8">
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
