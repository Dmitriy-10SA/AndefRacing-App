import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { profileApi } from '../../api/profileApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import Pagination from '../../components/Pagination'
import FavoriteButton from '../../components/FavoriteButton'
import ConfirmModal from '../../components/ConfirmModal'
import { getImageUrl } from '../../utils/formatters'
import { usePageStateStore } from '../../stores/pageStateStore'

const FavoriteClubsPage = () => {
  const { favoritesPage, setFavoritesPageState } = usePageStateStore()
  const currentPage = favoritesPage.currentPage
  const [clubToRemove, setClubToRemove] = useState<number | null>(null)
  const pageSize = 9
  const queryClient = useQueryClient()

  const handlePageChange = (page: number) => {
    setFavoritesPageState({ currentPage: page })
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['favoriteClubs', currentPage],
    queryFn: () => profileApi.getFavoriteClubs(currentPage, pageSize),
  })

  const removeFavoriteMutation = useMutation({
    mutationFn: profileApi.deleteFavoriteClub,
    onSuccess: (_, clubId) => {
      queryClient.invalidateQueries({ queryKey: ['favoriteClubs'] })
      queryClient.invalidateQueries({ queryKey: ['isClubFavorite', String(clubId)] })
      setClubToRemove(null)
    },
  })

  const handleRemoveFavorite = (clubId: number, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setClubToRemove(clubId)
  }

  const confirmRemove = () => {
    if (clubToRemove) {
      removeFavoriteMutation.mutate(clubToRemove)
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Ошибка загрузки избранных клубов" />

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Избранные клубы</h1>

      {data && data.content.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.content.map((club) => (
              <div key={club.id} className="card hover:shadow-lg transition-shadow relative">
                <div className="absolute top-4 right-4 z-10">
                  <FavoriteButton
                    isFavorite={true}
                    onClick={(e: React.MouseEvent) => handleRemoveFavorite(club.id, e)}
                    disabled={removeFavoriteMutation.isPending}
                  />
                </div>

                {!club.isOpen && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-3 py-2 rounded-lg mb-3 text-sm">
                    ⚠️ Клуб закрыт
                  </div>
                )}

                <Link to={`/clubs/${club.id}`} className="block">
                  {club.mainPhoto && (
                    <img
                      src={getImageUrl(club.mainPhoto.url)}
                      alt={club.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-xl font-bold mb-2">{club.name}</h3>
                  <p className="text-gray-600 mb-2">{club.address}</p>
                </Link>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={data.pageInfo.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">У вас пока нет избранных клубов</p>
          <Link to="/search" className="btn-primary">
            Найти клубы
          </Link>
        </div>
      )}

      <ConfirmModal
        isOpen={clubToRemove !== null}
        title="Удалить из избранного"
        message="Вы уверены, что хотите удалить этот клуб из избранного?"
        onConfirm={confirmRemove}
        onCancel={() => setClubToRemove(null)}
        confirmText="Удалить"
        cancelText="Отмена"
        isLoading={removeFavoriteMutation.isPending}
      />
    </div>
  )
}

export default FavoriteClubsPage
