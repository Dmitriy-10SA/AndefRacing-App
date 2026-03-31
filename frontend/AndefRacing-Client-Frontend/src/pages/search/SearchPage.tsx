import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { searchApi } from '../../api/searchApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import Pagination from '../../components/Pagination'
import SearchableSelect from '../../components/SearchableSelect'
import { getImageUrl } from '../../utils/formatters'
import { usePageStateStore } from '../../stores/pageStateStore'

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { searchPage, setSearchPageState } = usePageStateStore()

  // Инициализируем состояние из URL при первой загрузке
  const urlRegion = searchParams.get('region') ? Number(searchParams.get('region')) : null
  const urlCity = searchParams.get('city') ? Number(searchParams.get('city')) : null

  // Приоритет: URL params > store state
  const selectedRegion = urlRegion ?? searchPage.selectedRegion
  const selectedCity = urlCity ?? searchPage.selectedCity
  const currentPage = searchPage.currentPage
  const pageSize = 9

  // Синхронизируем store с URL при первой загрузке
  useEffect(() => {
    if (urlRegion !== null || urlCity !== null) {
      setSearchPageState({
        selectedRegion: urlRegion,
        selectedCity: urlCity,
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Обновляем URL при изменении региона или города
  useEffect(() => {
    const params = new URLSearchParams()
    if (selectedRegion) params.set('region', selectedRegion.toString())
    if (selectedCity) params.set('city', selectedCity.toString())
    setSearchParams(params, { replace: true })
  }, [selectedRegion, selectedCity, setSearchParams])

  const { data: regions, isLoading: regionsLoading } = useQuery({
    queryKey: ['regions'],
    queryFn: searchApi.getRegions,
  })

  const { data: cities, isLoading: citiesLoading } = useQuery({
    queryKey: ['cities', selectedRegion],
    queryFn: () => searchApi.getCities(selectedRegion!),
    enabled: !!selectedRegion,
  })

  const { data: clubsData, isLoading: clubsLoading } = useQuery({
    queryKey: ['clubs', selectedCity, currentPage],
    queryFn: () => searchApi.getClubs(selectedCity!, currentPage, pageSize),
    enabled: !!selectedCity,
  })

  const handleRegionChange = (regionId: number) => {
    setSearchPageState({
      selectedRegion: regionId,
      selectedCity: null,
      currentPage: 0,
    })
  }

  const handleCityChange = (cityId: number) => {
    setSearchPageState({
      selectedCity: cityId,
      currentPage: 0,
    })
  }

  const handlePageChange = (page: number) => {
    setSearchPageState({ currentPage: page })
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Поиск клубов</h1>

      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {regionsLoading ? (
            <LoadingSpinner />
          ) : (
            <SearchableSelect
              options={regions || []}
              value={selectedRegion}
              onChange={handleRegionChange}
              placeholder="Регион"
              label=""
            />
          )}

          {citiesLoading ? (
            <LoadingSpinner />
          ) : (
            <SearchableSelect
              options={cities || []}
              value={selectedCity}
              onChange={handleCityChange}
              placeholder="Город"
              label=""
              disabled={!selectedRegion}
            />
          )}
        </div>
      </div>

      {clubsLoading && <LoadingSpinner />}

      {clubsData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubsData.content.map((club) => (
              <Link key={club.id} to={`/clubs/${club.id}`} className="card hover:shadow-lg transition-shadow block">
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
            ))}
          </div>

          {clubsData.content.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-600">Клубы не найдены</p>
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={clubsData.pageInfoDto.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}

      {!selectedCity && !clubsLoading && (
        <div className="text-center py-12">
          <p className="text-gray-600">Выберите регион и город для поиска клубов</p>
        </div>
      )}
    </div>
  )
}

export default SearchPage
