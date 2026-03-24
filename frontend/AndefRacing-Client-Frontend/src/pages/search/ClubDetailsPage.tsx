import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { searchApi } from '../../api/searchApi'
import { profileApi } from '../../api/profileApi'
import { useAuthStore } from '../../stores/authStore'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import FavoriteButton from '../../components/FavoriteButton'
import { getImageUrl } from '../../utils/formatters'

const ClubDetailsPage = () => {
  const { clubId } = useParams<{ clubId: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const { data: club, isLoading, error } = useQuery({
    queryKey: ['club', clubId],
    queryFn: () => searchApi.getClubFullInfo(Number(clubId)),
  })

  const { data: isFavorite = false } = useQuery({
    queryKey: ['isClubFavorite', clubId],
    queryFn: () => profileApi.isClubFavorite(Number(clubId)),
    enabled: isAuthenticated && !!clubId,
    staleTime: 0, // Данные сразу считаются устаревшими
    gcTime: 0, // Не кешировать данные
  })

  const addFavoriteMutation = useMutation({
    mutationFn: () => profileApi.addFavoriteClub(Number(clubId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isClubFavorite', clubId] })
      queryClient.invalidateQueries({ queryKey: ['favoriteClubs'] })
    },
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: () => profileApi.deleteFavoriteClub(Number(clubId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isClubFavorite', clubId] })
      queryClient.invalidateQueries({ queryKey: ['favoriteClubs'] })
    },
  })

  const handleFavoriteToggle = () => {
    if (!isAuthenticated) {
      navigate('/auth/login')
      return
    }

    if (isFavorite) {
      removeFavoriteMutation.mutate()
    } else {
      addFavoriteMutation.mutate()
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Ошибка загрузки информации о клубе" />
  if (!club) return <ErrorMessage message="Клуб не найден" />

  const getDayName = (day: string) => {
    const days: Record<string, string> = {
      'MONDAY': 'Понедельник',
      'TUESDAY': 'Вторник',
      'WEDNESDAY': 'Среда',
      'THURSDAY': 'Четверг',
      'FRIDAY': 'Пятница',
      'SATURDAY': 'Суббота',
      'SUNDAY': 'Воскресенье',
    }
    return days[day] || day
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="btn-secondary mb-6"
      >
        ← Назад
      </button>

      {!club.isOpen && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg mb-6">
          <p className="font-semibold">⚠️ Этот клуб закрыт и недоступен для бронирования</p>
        </div>
      )}

      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-3xl font-bold">{club.name}</h1>
          <FavoriteButton
            isFavorite={isFavorite}
            onClick={handleFavoriteToggle}
            disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
          />
        </div>

        <div className="space-y-2 mb-6">
          <p><strong>Адрес:</strong> {club.address}</p>
          <p><strong>Количество игровых мест:</strong> {club.cntEquipment}</p>
        </div>

        {club.photos.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Фотографии</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {club.photos.map((photo) => (
                <img
                  key={photo.id}
                  src={getImageUrl(photo.url)}
                  alt={club.name}
                  className="w-full h-48 object-cover rounded-lg"
                />
              ))}
            </div>
          </div>
        )}

        {club.games.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Доступные игры</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {club.games.map((game) => (
                <div
                  key={game.id}
                  className="bg-white border-2 border-primary-200 rounded-lg overflow-hidden hover:border-primary-400 transition-colors"
                >
                  {game.photo && (
                    <img
                      src={getImageUrl(game.photo.url)}
                      alt={game.name}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-3 text-center">
                    <span className="font-medium text-primary-800">{game.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {club.prices.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Цены</h2>
            <div className="space-y-2">
              {club.prices.map((price) => (
                <div key={price.id} className="flex justify-between items-center">
                  <span>{price.durationMinutes} минут</span>
                  <span className="font-semibold">{price.value} ₽</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {club.workSchedules.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">График работы</h2>
            <div className="space-y-2">
              {club.workSchedules.map((schedule) => (
                <div key={schedule.id} className="flex justify-between items-center">
                  <span>{getDayName(schedule.dayOfWeek)}</span>
                  {schedule.isWorkDay ? (
                    <span>{schedule.openTime.slice(0, 5)} - {schedule.closeTime.slice(0, 5)}</span>
                  ) : (
                    <span className="text-gray-500 italic">Выходной</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Контакты</h2>
          <div className="space-y-2">
            <p><strong>Телефон:</strong> {club.phone}</p>
            <p><strong>Email:</strong> {club.email}</p>
          </div>
        </div>

        {club.isOpen && isAuthenticated && (
          <Link
            to={`/clubs/${clubId}/book`}
            className="btn-primary inline-block"
          >
            Забронировать
          </Link>
        )}

        {club.isOpen && !isAuthenticated && (
          <Link
            to="/auth/login"
            className="btn-primary inline-block"
          >
            Войдите для бронирования
          </Link>
        )}
      </div>
    </div>
  )
}

export default ClubDetailsPage
