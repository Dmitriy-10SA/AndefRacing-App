import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { profileApi } from '@/api/profileApi'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import { useToast } from '@/hooks/useToast'
import { formatPhone } from '@/utils/formatters'
import { EmployeeRole } from '@/types'

const ProfilePage = () => {
  const navigate = useNavigate()
  const { currentClub } = useAuthStore()
  const { info, ToastContainer } = useToast()

  const { data: personalInfo, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getPersonalInfo,
  })

  const handleChangeClub = () => {
    // For changing club, we need to re-authenticate
    info('Для смены клуба необходимо выйти и войти заново, выбрав другой клуб')
    setTimeout(() => navigate('/auth/login'), 2000)
  }

  const getRoleLabel = (role: EmployeeRole): string => {
    switch (role) {
      case EmployeeRole.EMPLOYEE:
        return 'Сотрудник'
      case EmployeeRole.ADMINISTRATOR:
        return 'Администратор'
      case EmployeeRole.MANAGER:
        return 'Управляющий'
      default:
        return role
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Ошибка загрузки профиля" />

  return (
    <div className="max-w-2xl mx-auto">
      <ToastContainer />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Мой профиль</h1>
      </div>

      <div className="space-y-6">
        <div className="card space-y-4">
          <h2 className="text-xl font-semibold section-divider">Личные данные</h2>

          <div>
            <label className="label">Фамилия</label>
            <p className="text-lg">{personalInfo?.surname}</p>
          </div>

          <div>
            <label className="label">Имя</label>
            <p className="text-lg">{personalInfo?.name}</p>
          </div>

          {personalInfo?.patronymic && (
            <div>
              <label className="label">Отчество</label>
              <p className="text-lg">{personalInfo.patronymic}</p>
            </div>
          )}

          <div>
            <label className="label">Номер телефона</label>
            <p className="text-lg">{formatPhone(personalInfo?.phone || '')}</p>
          </div>

          <div>
            <label className="label">Роли в текущем клубе</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {personalInfo?.roles.map((role) => (
                <span
                  key={role}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium"
                >
                  {getRoleLabel(role)}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-xl font-semibold section-divider">Текущий клуб</h2>

          {currentClub && (
            <>
              <div>
                <label className="label">Название</label>
                <p className="text-lg">{currentClub.name}</p>
              </div>

              <div>
                <label className="label">Адрес</label>
                <p className="text-lg">{currentClub.address}</p>
              </div>

              <div>
                <label className="label">Город</label>
                <p className="text-lg">
                  {currentClub.city.name}, {currentClub.city.region.name}
                </p>
              </div>

              <div>
                <label className="label">Телефон</label>
                <p className="text-lg">{formatPhone(currentClub.phone)}</p>
              </div>

              <div>
                <label className="label">Email</label>
                <p className="text-lg">{currentClub.email}</p>
              </div>

              <button
                onClick={handleChangeClub}
                className="btn-secondary w-full"
              >
                Сменить текущий клуб
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
