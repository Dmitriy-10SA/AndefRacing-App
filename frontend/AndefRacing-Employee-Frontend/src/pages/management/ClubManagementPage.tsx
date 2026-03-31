import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { managementApi } from '@/api/managementApi'
import { searchApi } from '@/api/searchApi'
import { useAuthStore } from '@/stores/authStore'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import ConfirmModal from '@/components/ConfirmModal'
import { useToast } from '@/hooks/useToast'
import {
  formatDayOfWeek,
  formatDate,
  formatPrice,
  formatTimeByHoursAndMinutes,
} from '@/utils/formatters'
import { format } from 'date-fns'
import { getImageUrl } from '@/utils/imageUtils'
import { AddPriceDto, UpdateWorkScheduleDto, AddWorkScheduleExceptionDto } from '@/types'

const ClubManagementPage = () => {
  const queryClient = useQueryClient()
  const { currentClub } = useAuthStore()
  const { success, error: showError, ToastContainer } = useToast()
  const [activeTab, setActiveTab] = useState<'general' | 'prices' | 'games' | 'schedule' | 'exceptions' | 'photos'>('general')
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showDeletePriceModal, setShowDeletePriceModal] = useState(false)
  const [showDeleteGameModal, setShowDeleteGameModal] = useState(false)
  const [showUpdateEquipmentModal, setShowUpdateEquipmentModal] = useState(false)
  const [showClearPhotosModal, setShowClearPhotosModal] = useState(false)
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null)
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null)

  // General
  const [cntEquipment, setCntEquipment] = useState(1)

  // Photos
  const [photos, setPhotos] = useState<File[]>([])
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  // Prices
  const [showAddPriceModal, setShowAddPriceModal] = useState(false)
  const [newPriceDuration, setNewPriceDuration] = useState(30)
  const [newPriceValue, setNewPriceValue] = useState(500)

  // Work Schedule
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null)
  const [showAddExceptionModal, setShowAddExceptionModal] = useState(false)
  const [exceptionDate, setExceptionDate] = useState('')
  const [exceptionOpenTime, setExceptionOpenTime] = useState('10:00')
  const [exceptionCloseTime, setExceptionCloseTime] = useState('22:00')
  const [exceptionIsWorkDay, setExceptionIsWorkDay] = useState(true)
  const [exceptionDescription, setExceptionDescription] = useState('')
  const [showDeleteExceptionModal, setShowDeleteExceptionModal] = useState(false)
  const [selectedExceptionId, setSelectedExceptionId] = useState<number | null>(null)

  const { data: clubInfo, isLoading: clubLoading } = useQuery({
    queryKey: ['clubInfo', currentClub?.id],
    queryFn: () => searchApi.getClubFullInfo(currentClub!.id),
    enabled: !!currentClub,
  })

  const { data: allGames } = useQuery({
    queryKey: ['allGames'],
    queryFn: managementApi.getAllGames,
  })

  // Sync cntEquipment with clubInfo
  useEffect(() => {
    if (clubInfo?.cntEquipment) {
      setCntEquipment(clubInfo.cntEquipment)
    }
  }, [clubInfo?.cntEquipment])

  // Work Schedule Exceptions - date range
  const [exceptionsStartDate, setExceptionsStartDate] = useState(() => {
    const today = new Date()
    return format(today, 'yyyy-MM-dd')
  })
  const [exceptionsEndDate, setExceptionsEndDate] = useState(() => {
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(today.getDate() + 7)
    return format(endDate, 'yyyy-MM-dd')
  })

  const { data: workScheduleExceptions, refetch: refetchExceptions } = useQuery({
    queryKey: ['workScheduleExceptions', exceptionsStartDate, exceptionsEndDate],
    queryFn: () =>
      managementApi.getWorkScheduleExceptions(exceptionsStartDate, exceptionsEndDate),
    enabled: activeTab === 'exceptions',
  })

  const updateEquipmentMutation = useMutation({
    mutationFn: (cnt: number) => managementApi.updateCntEquipment(cnt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      setShowUpdateEquipmentModal(false)
      success('Количество игровых мест обновлено')
    },
    onError: (err: any) => {
      setShowUpdateEquipmentModal(false)
      showError(err.response?.data?.message || 'Ошибка обновления')
    },
  })

  const managePhotosMutation = useMutation({
    mutationFn: (photos: File[]) => managementApi.managePhotos(photos),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      success('Фотографии успешно обновлены')
      setPhotos([])
      setPhotoPreviews([])
    },
    onError: (err: any) => {
      const status = err.response?.status
      if (status === 413 || err.message?.includes('413')) {
        showError('Общий размер фотографий превышает 50 МБ. Пожалуйста, уменьшите количество или размер фотографий.')
      } else if (status === 415) {
        showError('Неподдерживаемый формат файла. Используйте только JPEG изображения.')
      } else {
        showError(err.response?.data?.message || 'Ошибка обновления фотографий')
      }
    },
  })

  const openClubMutation = useMutation({
    mutationFn: managementApi.openClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      setShowOpenModal(false)
      success('Клуб успешно открыт')
    },
    onError: (err: any) => {
      setShowOpenModal(false)
      showError(err.response?.data?.message || 'Ошибка открытия клуба')
    },
  })

  const closeClubMutation = useMutation({
    mutationFn: managementApi.closeClub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      setShowCloseModal(false)
      success('Клуб успешно закрыт')
    },
    onError: (err: any) => {
      setShowCloseModal(false)
      showError(err.response?.data?.message || 'Ошибка закрытия клуба')
    },
  })

  const addPriceMutation = useMutation({
    mutationFn: (data: AddPriceDto) => managementApi.addPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      setShowAddPriceModal(false)
      setNewPriceDuration(30)
      setNewPriceValue(500)
      success('Цена успешно добавлена')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Ошибка добавления цены')
    },
  })

  const deletePriceMutation = useMutation({
    mutationFn: (priceId: number) => managementApi.deletePrice(priceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      setShowDeletePriceModal(false)
      setSelectedPriceId(null)
      success('Цена успешно удалена')
    },
    onError: (err: any) => {
      setShowDeletePriceModal(false)
      setSelectedPriceId(null)
      showError(err.response?.data?.message || 'Ошибка удаления цены')
    },
  })

  const addGameMutation = useMutation({
    mutationFn: (gameId: number) => managementApi.addGameToClub(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      success('Игра успешно добавлена')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Ошибка добавления игры')
    },
  })

  const deleteGameMutation = useMutation({
    mutationFn: (gameId: number) => managementApi.deleteGameFromClub(gameId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      setShowDeleteGameModal(false)
      setSelectedGameId(null)
      success('Игра успешно удалена')
    },
    onError: (err: any) => {
      setShowDeleteGameModal(false)
      setSelectedGameId(null)
      showError(err.response?.data?.message || 'Ошибка удаления игры')
    },
  })

  const updateScheduleMutation = useMutation({
    mutationFn: (data: UpdateWorkScheduleDto) => managementApi.updateWorkSchedule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubInfo'] })
      setShowEditScheduleModal(false)
      setSelectedSchedule(null)
      success('Расписание успешно обновлено')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Ошибка обновления расписания')
    },
  })

  const addExceptionMutation = useMutation({
    mutationFn: (data: AddWorkScheduleExceptionDto) => managementApi.addWorkScheduleException(data),
    onSuccess: () => {
      refetchExceptions()
      setShowAddExceptionModal(false)
      setExceptionDate('')
      setExceptionOpenTime('10:00')
      setExceptionCloseTime('22:00')
      setExceptionIsWorkDay(true)
      setExceptionDescription('')
      success('День-исключение успешно добавлен')
    },
    onError: (err: any) => {
      showError(err.response?.data?.message || 'Ошибка добавления дня-исключения')
    },
  })

  const deleteExceptionMutation = useMutation({
    mutationFn: (id: number) => managementApi.deleteWorkScheduleException(id),
    onSuccess: () => {
      refetchExceptions()
      setShowDeleteExceptionModal(false)
      setSelectedExceptionId(null)
      success('День-исключение успешно удален')
    },
    onError: (err: any) => {
      setShowDeleteExceptionModal(false)
      setSelectedExceptionId(null)
      showError(err.response?.data?.message || 'Ошибка удаления дня-исключения')
    },
  })

  const handleAddPrice = () => {
    const data: AddPriceDto = {
      durationMinutes: newPriceDuration,
      value: newPriceValue,
    }
    addPriceMutation.mutate(data)
  }

  const handleUpdateSchedule = () => {
    if (!selectedSchedule) return
    const data: UpdateWorkScheduleDto = {
      dayOfWeek: selectedSchedule.dayOfWeek,
      openTime: selectedSchedule.isWorkDay ? selectedSchedule.openTime : null,
      closeTime: selectedSchedule.isWorkDay ? selectedSchedule.closeTime : null,
      isWorkDay: selectedSchedule.isWorkDay,
    }
    updateScheduleMutation.mutate(data)
  }

  const handleAddException = () => {
    const data: AddWorkScheduleExceptionDto = {
      date: exceptionDate,
      openTime: exceptionIsWorkDay ? exceptionOpenTime : null,
      closeTime: exceptionIsWorkDay ? exceptionCloseTime : null,
      isWorkDay: exceptionIsWorkDay,
      description: exceptionDescription || null,
    }
    addExceptionMutation.mutate(data)
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])

    // Validate files
    for (const file of files) {
      if (file.type !== 'image/jpeg') {
        showError('Только JPEG изображения разрешены')
        return
      }
      if (file.size > 10 * 1024 * 1024) {
        showError('Размер файла не должен превышать 10 МБ')
        return
      }
    }

    // Check total size of all photos (existing in form + new)
    const existingSize = photos.reduce((sum, file) => sum + file.size, 0)
    const newSize = files.reduce((sum, file) => sum + file.size, 0)
    const totalSize = existingSize + newSize

    // Debug logging
    console.log('Photo upload debug:', {
      existingPhotosCount: photos.length,
      newPhotosCount: files.length,
      existingSizeMB: (existingSize / (1024 * 1024)).toFixed(2),
      newSizeMB: (newSize / (1024 * 1024)).toFixed(2),
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      existingPhotos: photos.map(f => ({ name: f.name, size: f.size })),
      newPhotos: files.map(f => ({ name: f.name, size: f.size }))
    })

    if (totalSize > 50 * 1024 * 1024) {
      const existingSizeMB = (existingSize / (1024 * 1024)).toFixed(2)
      const newSizeMB = (newSize / (1024 * 1024)).toFixed(2)
      const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2)
      showError(
        `Общий размер превышает 50 МБ. ` +
        `Уже добавлено в форме: ${existingSizeMB} МБ (${photos.length} фото), ` +
        `Новые файлы: ${newSizeMB} МБ (${files.length} фото), ` +
        `Итого: ${totalSizeMB} МБ. ` +
        `Пожалуйста, сначала сохраните текущие фотографии или удалите некоторые из них.`
      )
      return
    }

    // Create previews
    const newPreviews: string[] = []
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === files.length) {
          setPhotoPreviews([...photoPreviews, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    setPhotos([...photos, ...files])
  }

  const handleRemovePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index))
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index))
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newPhotos = [...photos]
    const newPreviews = [...photoPreviews]

    const draggedPhoto = newPhotos[draggedIndex]
    const draggedPreview = newPreviews[draggedIndex]

    newPhotos.splice(draggedIndex, 1)
    newPreviews.splice(draggedIndex, 1)

    newPhotos.splice(index, 0, draggedPhoto)
    newPreviews.splice(index, 0, draggedPreview)

    setPhotos(newPhotos)
    setPhotoPreviews(newPreviews)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleSavePhotos = () => {
    if (clubInfo?.isOpen && photos.length === 0 && (!clubInfo?.photos || clubInfo.photos.length === 0)) {
      showError('Для открытого клуба необходима минимум 1 фотография')
      return
    }
    managePhotosMutation.mutate(photos)
  }

  const handleClearPhotos = () => {
    if (clubInfo?.isOpen) {
      showError('Нельзя удалить все фотографии у открытого клуба')
      return
    }
    setShowClearPhotosModal(true)
  }

  const confirmClearPhotos = () => {
    managePhotosMutation.mutate([])
    setShowClearPhotosModal(false)
  }

  if (!currentClub) {
    return <ErrorMessage message="Клуб не выбран" />
  }

  if (clubLoading) return <LoadingSpinner />

  const availableGames = allGames?.filter(
    (game) => game.isActive && !clubInfo?.games.some((g) => g.id === game.id)
  )

  return (
    <div className="max-w-6xl mx-auto">
      <ToastContainer />
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Управление клубом</h1>

      <div className="mb-6 border-b-2 border-gray-300">
        <div className="flex gap-1 sm:gap-4 overflow-x-auto pb-1 -mb-[2px] scrollbar-hide">
          <button
            onClick={() => setActiveTab('general')}
            className={`pb-3 px-2 sm:px-4 transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'general'
                ? 'border-b-3 border-primary-600 text-primary-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'general' ? { borderBottomWidth: '3px' } : {}}
          >
            Общее
          </button>
          <button
            onClick={() => setActiveTab('prices')}
            className={`pb-3 px-2 sm:px-4 transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'prices'
                ? 'border-b-3 border-primary-600 text-primary-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'prices' ? { borderBottomWidth: '3px' } : {}}
          >
            Цены
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`pb-3 px-2 sm:px-4 transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'games'
                ? 'border-b-3 border-primary-600 text-primary-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'games' ? { borderBottomWidth: '3px' } : {}}
          >
            Игры
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-2 sm:px-4 transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'schedule'
                ? 'border-b-3 border-primary-600 text-primary-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'schedule' ? { borderBottomWidth: '3px' } : {}}
          >
            Расписание
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`pb-3 px-2 sm:px-4 transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'exceptions'
                ? 'border-b-3 border-primary-600 text-primary-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'exceptions' ? { borderBottomWidth: '3px' } : {}}
          >
            Исключения
          </button>
          <button
            onClick={() => setActiveTab('photos')}
            className={`pb-3 px-2 sm:px-4 transition-colors whitespace-nowrap text-sm sm:text-base flex-shrink-0 ${
              activeTab === 'photos'
                ? 'border-b-3 border-primary-600 text-primary-600 font-semibold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            style={activeTab === 'photos' ? { borderBottomWidth: '3px' } : {}}
          >
            Фото
          </button>
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Игровые места</h2>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
              <input
                type="number"
                value={cntEquipment}
                onChange={(e) => setCntEquipment(Number(e.target.value))}
                className="input w-full sm:w-32"
                min="1"
              />
              <button
                onClick={() => setShowUpdateEquipmentModal(true)}
                className="btn-primary w-full sm:w-auto"
              >
                Обновить
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Статус клуба</h2>
            <p className="mb-4">
              Текущий статус:{' '}
              <span
                className={`font-semibold ${
                  clubInfo?.isOpen ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {clubInfo?.isOpen ? 'Открыт' : 'Закрыт'}
              </span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {!clubInfo?.isOpen && (
                <button onClick={() => setShowOpenModal(true)} className="btn-primary w-full sm:w-auto">
                  Открыть клуб
                </button>
              )}
              {clubInfo?.isOpen && (
                <button onClick={() => setShowCloseModal(true)} className="btn-danger w-full sm:w-auto">
                  Закрыть клуб
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'prices' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold">Цены</h2>
            <button onClick={() => setShowAddPriceModal(true)} className="btn-primary w-full sm:w-auto">
              Добавить цену
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clubInfo?.prices.map((price) => (
              <div key={price.id} className="card">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-lg font-semibold">{price.durationMinutes} минут</p>
                    <p className="text-2xl font-bold text-primary-600">
                      {formatPrice(price.value)}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPriceId(price.id)
                      setShowDeletePriceModal(true)
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'games' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Игры в клубе</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clubInfo?.games.map((game) => (
                <div key={game.id} className="card">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{game.name}</p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedGameId(game.id)
                        setShowDeleteGameModal(true)
                      }}
                      className="text-red-600 hover:text-red-800"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Доступные игры</h2>
            {availableGames && availableGames.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableGames.map((game) => (
                  <div key={game.id} className="card">
                    {game.photoUrl && (
                      <img
                        src={getImageUrl(game.photoUrl)}
                        alt={game.name}
                        className="w-full h-40 object-cover rounded-lg mb-3"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    )}
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{game.name}</p>
                      </div>
                      <button
                        onClick={() => addGameMutation.mutate(game.id)}
                        className="btn-primary text-sm"
                      >
                        Добавить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Все доступные игры уже добавлены в клуб</p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Основной график работы</h2>
          <div className="space-y-3">
            {clubInfo?.workSchedules.map((schedule) => (
              <div key={schedule.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 border rounded">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span className="font-medium">{formatDayOfWeek(schedule.dayOfWeek)}</span>
                  {schedule.isWorkDay ? (
                    <span className="text-gray-600">
                      {formatTimeByHoursAndMinutes(schedule.openTime)} - {formatTimeByHoursAndMinutes(schedule.closeTime)}
                    </span>
                  ) : (
                    <span className="text-red-600">Выходной</span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setSelectedSchedule(schedule)
                    setShowEditScheduleModal(true)
                  }}
                  className="text-primary-600 hover:text-primary-800 self-end sm:self-auto"
                >
                  Изменить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'photos' && (
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Текущие фотографии</h2>
            {clubInfo?.photos && clubInfo.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
                {clubInfo.photos.map((photo) => (
                  <div key={photo.id} className="relative aspect-square">
                    <img
                      src={getImageUrl(photo.url)}
                      alt="Club photo"
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.jpg'
                      }}
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {photo.sequenceNumber}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-4">Нет загруженных фотографий</p>
            )}
          </div>

          <div className="card">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Загрузить новые фотографии</h2>
            <p className="text-xs sm:text-sm text-gray-600 mb-4">
              Загрузите фотографии и измените их порядок перетаскиванием. Только JPEG, максимум 10 МБ каждая.
              {clubInfo?.isOpen && ' Для открытого клуба необходима минимум 1 фотография.'}
            </p>

            <input
              type="file"
              accept="image/jpeg"
              multiple
              onChange={handlePhotoUpload}
              disabled={managePhotosMutation.isPending}
              className="mb-4 w-full text-sm"
            />

            {photoPreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
                {photoPreviews.map((preview, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`relative aspect-square cursor-move ${
                      draggedIndex === index ? 'opacity-50' : ''
                    }`}
                  >
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-700"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSavePhotos}
                disabled={photos.length === 0 || managePhotosMutation.isPending}
                className="btn-primary w-full sm:w-auto"
              >
                {managePhotosMutation.isPending ? 'Сохранение...' : 'Сохранить фотографии'}
              </button>
              {!clubInfo?.isOpen && (
                <button
                  onClick={handleClearPhotos}
                  disabled={managePhotosMutation.isPending}
                  className="btn-danger w-full sm:w-auto"
                >
                  Удалить все фотографии
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'exceptions' && (
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Дни-исключения в расписании</h2>
            <button
              onClick={() => setShowAddExceptionModal(true)}
              className="btn-primary w-full sm:w-auto text-sm sm:text-base"
            >
              Добавить исключение
            </button>
          </div>

          <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Дата начала</label>
              <input
                type="date"
                value={exceptionsStartDate}
                onChange={(e) => setExceptionsStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Дата окончания</label>
              <input
                type="date"
                value={exceptionsEndDate}
                onChange={(e) => setExceptionsEndDate(e.target.value)}
                className="input"
                min={exceptionsStartDate}
              />
            </div>
          </div>

          {workScheduleExceptions && workScheduleExceptions.length > 0 ? (
            <div className="space-y-3">
              {workScheduleExceptions.map((exception) => (
                <div key={exception.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 p-3 border rounded">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                    <span className="font-medium">{formatDate(exception.date)}</span>
                    {exception.isWorkDay ? (
                      <span className="text-gray-600">
                        {formatTimeByHoursAndMinutes(exception.openTime)} - {formatTimeByHoursAndMinutes(exception.closeTime)}
                      </span>
                    ) : (
                      <span className="text-red-600">Выходной</span>
                    )}
                    {exception.description && (
                      <span className="text-gray-500 text-sm">
                        ({exception.description})
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedExceptionId(exception.id)
                      setShowDeleteExceptionModal(true)
                    }}
                    className="text-red-600 hover:text-red-800 self-end sm:self-auto"
                  >
                    Удалить
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm sm:text-base">Нет дней-исключений в расписании для выбранного диапазона дат</p>
          )}
        </div>
      )}

      {/* Add Price Modal */}
      {showAddPriceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Добавить цену</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Длительность (минут)</label>
                <input
                  type="number"
                  value={newPriceDuration}
                  onChange={(e) => setNewPriceDuration(Number(e.target.value))}
                  className="input"
                  min="15"
                />
              </div>
              <div>
                <label className="label">Стоимость (₽)</label>
                <input
                  type="number"
                  value={newPriceValue}
                  onChange={(e) => setNewPriceValue(Number(e.target.value))}
                  className="input"
                  min="1"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddPriceModal(false)}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button onClick={handleAddPrice} className="btn-primary flex-1">
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showOpenModal}
        title="Открытие клуба"
        message="Вы уверены, что хотите открыть клуб? Убедитесь, что добавлены фотографии, цены, расписание и игры."
        confirmText="Открыть"
        cancelText="Отмена"
        onConfirm={() => openClubMutation.mutate()}
        onCancel={() => setShowOpenModal(false)}
      />

      <ConfirmModal
        isOpen={showCloseModal}
        title="Закрытие клуба"
        message="Вы уверены, что хотите закрыть клуб? Это возможно только при отсутствии активных бронирований."
        confirmText="Закрыть"
        cancelText="Отмена"
        onConfirm={() => closeClubMutation.mutate()}
        onCancel={() => setShowCloseModal(false)}
      />

      <ConfirmModal
        isOpen={showDeletePriceModal}
        title="Удаление цены"
        message="Вы уверены, что хотите удалить эту цену?"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => selectedPriceId && deletePriceMutation.mutate(selectedPriceId)}
        onCancel={() => {
          setShowDeletePriceModal(false)
          setSelectedPriceId(null)
        }}
      />

      <ConfirmModal
        isOpen={showDeleteGameModal}
        title="Удаление игры"
        message="Вы уверены, что хотите удалить эту игру из клуба?"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => selectedGameId && deleteGameMutation.mutate(selectedGameId)}
        onCancel={() => {
          setShowDeleteGameModal(false)
          setSelectedGameId(null)
        }}
      />

      {/* Edit Schedule Modal */}
      {showEditScheduleModal && selectedSchedule && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">
              Изменить расписание - {formatDayOfWeek(selectedSchedule.dayOfWeek)}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isWorkDay"
                  checked={selectedSchedule.isWorkDay}
                  onChange={(e) =>
                    setSelectedSchedule({ ...selectedSchedule, isWorkDay: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label htmlFor="isWorkDay" className="label mb-0">
                  Рабочий день
                </label>
              </div>
              {selectedSchedule.isWorkDay && (
                <>
                  <div>
                    <label className="label">Время открытия</label>
                    <input
                      type="time"
                      value={selectedSchedule.openTime}
                      onChange={(e) =>
                        setSelectedSchedule({ ...selectedSchedule, openTime: e.target.value })
                      }
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Время закрытия</label>
                    <input
                      type="time"
                      value={selectedSchedule.closeTime}
                      onChange={(e) =>
                        setSelectedSchedule({ ...selectedSchedule, closeTime: e.target.value })
                      }
                      className="input"
                    />
                  </div>
                </>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowEditScheduleModal(false)
                    setSelectedSchedule(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button onClick={handleUpdateSchedule} className="btn-primary flex-1">
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Exception Modal */}
      {showAddExceptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Добавить день-исключение</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Дата</label>
                <input
                  type="date"
                  value={exceptionDate}
                  onChange={(e) => setExceptionDate(e.target.value)}
                  className="input"
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="exceptionIsWorkDay"
                  checked={exceptionIsWorkDay}
                  onChange={(e) => setExceptionIsWorkDay(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="exceptionIsWorkDay" className="label mb-0">
                  Рабочий день
                </label>
              </div>
              {exceptionIsWorkDay && (
                <>
                  <div>
                    <label className="label">Время открытия</label>
                    <input
                      type="time"
                      value={exceptionOpenTime}
                      onChange={(e) => setExceptionOpenTime(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Время закрытия</label>
                    <input
                      type="time"
                      value={exceptionCloseTime}
                      onChange={(e) => setExceptionCloseTime(e.target.value)}
                      className="input"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="label">Описание (опционально)</label>
                <input
                  type="text"
                  value={exceptionDescription}
                  onChange={(e) => setExceptionDescription(e.target.value)}
                  className="input"
                  placeholder="Например: Праздничный день"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowAddExceptionModal(false)
                    setExceptionDate('')
                    setExceptionOpenTime('10:00')
                    setExceptionCloseTime('22:00')
                    setExceptionIsWorkDay(true)
                    setExceptionDescription('')
                  }}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAddException}
                  className="btn-primary flex-1"
                  disabled={!exceptionDate}
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteExceptionModal}
        title="Удаление дня-исключения"
        message="Вы уверены, что хотите удалить этот день-исключение из расписания?"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => selectedExceptionId && deleteExceptionMutation.mutate(selectedExceptionId)}
        onCancel={() => {
          setShowDeleteExceptionModal(false)
          setSelectedExceptionId(null)
        }}
      />

      <ConfirmModal
        isOpen={showUpdateEquipmentModal}
        title="Изменение количества игровых мест"
        message={`Вы уверены, что хотите изменить количество игровых мест на ${cntEquipment}?`}
        confirmText="Изменить"
        cancelText="Отмена"
        onConfirm={() => updateEquipmentMutation.mutate(cntEquipment)}
        onCancel={() => setShowUpdateEquipmentModal(false)}
      />

      <ConfirmModal
        isOpen={showClearPhotosModal}
        title="Удаление всех фотографий"
        message="Вы уверены, что хотите удалить все фотографии клуба?"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={confirmClearPhotos}
        onCancel={() => setShowClearPhotosModal(false)}
      />
    </div>
  )
}

export default ClubManagementPage
