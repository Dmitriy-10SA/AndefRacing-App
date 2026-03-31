import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { profileApi } from '../../api/profileApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const ProfilePage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getPersonalInfo,
  })

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Ошибка загрузки профиля" />

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Мой профиль</h1>
        <Link to="/profile/edit" className="btn-primary text-center">
          Редактировать
        </Link>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="label">Имя</label>
          <p className="text-lg">{data?.name}</p>
        </div>

        <div>
          <label className="label">Номер телефона</label>
          <p className="text-lg">{data?.phone}</p>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
