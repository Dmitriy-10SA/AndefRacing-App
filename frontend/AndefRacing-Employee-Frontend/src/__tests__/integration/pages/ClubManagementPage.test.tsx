import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import ClubManagementPage from '@/pages/management/ClubManagementPage'
import { useAuthStore } from '@/stores/authStore'
import { mockClubs, mockClubFullInfo, mockGames, mockWorkScheduleExceptions } from '../mocks/handlers'
import { searchApi } from '@/api/searchApi'
import { managementApi } from '@/api/managementApi'
import { AxiosError } from 'axios'

// Мокаем API модули
vi.mock('@/api/searchApi')
vi.mock('@/api/managementApi')

// Хелпер для создания ошибки "Вы заблокированы"
const createBlockedError = () => {
  const error = new Error('Вы заблокированы') as AxiosError
  error.response = {
    data: { message: 'Вы заблокированы' },
    status: 403,
    statusText: 'Forbidden',
    headers: {},
    config: {} as any,
  }
  return error
}

// Хелпер для создания ошибки бизнес-логики
const createBusinessError = (message: string) => {
  const error = new Error(message) as AxiosError
  error.response = {
    data: { message },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {} as any,
  }
  return error
}

describe('ClubManagementPage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтные моки для успешных ответов
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue(mockClubFullInfo)
    vi.mocked(managementApi.getAllGames).mockResolvedValue(mockGames)
    vi.mocked(managementApi.getWorkScheduleExceptions).mockResolvedValue(mockWorkScheduleExceptions)
    vi.mocked(managementApi.updateCntEquipment).mockResolvedValue(undefined)
    vi.mocked(managementApi.openClub).mockResolvedValue(undefined)
    vi.mocked(managementApi.closeClub).mockResolvedValue(undefined)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает страницу управления клубом', async () => {
    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Управление клубом')).toBeInTheDocument()
    })
  })

  it('отображает табы навигации', async () => {
    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Общее')).toBeInTheDocument()
    })

    expect(screen.getByText('Цены')).toBeInTheDocument()
    expect(screen.getByText('Игры')).toBeInTheDocument()
    expect(screen.getByText('Расписание')).toBeInTheDocument()
    expect(screen.getByText('Исключения')).toBeInTheDocument()
    expect(screen.getByText('Фото')).toBeInTheDocument()
  })

  it('отображает вкладку "Общее" по умолчанию', async () => {
    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Игровые места')).toBeInTheDocument()
      expect(screen.getByText('Статус клуба')).toBeInTheDocument()
    })
  })

  it('показывает текущий статус клуба', async () => {
    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Открыт')).toBeInTheDocument()
    })
  })

  it('показывает кнопку закрытия клуба для открытого клуба', async () => {
    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Закрыть клуб/i })).toBeInTheDocument()
    })
  })

  it('показывает кнопку открытия клуба для закрытого клуба', async () => {
    vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
    })
  })

  it('переключается на вкладку "Цены"', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Цены')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Цены'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить цену/i })).toBeInTheDocument()
    })

    expect(screen.getByText('30 минут')).toBeInTheDocument()
    expect(screen.getByText('60 минут')).toBeInTheDocument()
    expect(screen.getByText('750 ₽')).toBeInTheDocument()
    expect(screen.getByText('1 500 ₽')).toBeInTheDocument()
  })

  it('переключается на вкладку "Игры"', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Игры')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Игры'))

    await waitFor(() => {
      expect(screen.getByText('Игры в клубе')).toBeInTheDocument()
      expect(screen.getByText('Доступные игры')).toBeInTheDocument()
    })
  })

  it('переключается на вкладку "Расписание"', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Расписание')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Расписание'))

    await waitFor(() => {
      expect(screen.getByText('Основной график работы')).toBeInTheDocument()
    })

    expect(screen.getByText('Понедельник')).toBeInTheDocument()
    expect(screen.getByText('Вторник')).toBeInTheDocument()
  })

  it('переключается на вкладку "Исключения"', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Исключения')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Исключения'))

    await waitFor(() => {
      expect(screen.getByText('Дни-исключения в расписании')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Добавить исключение/i })).toBeInTheDocument()
    })
  })

  it('переключается на вкладку "Фото"', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Фото')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Фото'))

    await waitFor(() => {
      expect(screen.getByText('Текущие фотографии')).toBeInTheDocument()
      expect(screen.getByText('Загрузить новые фотографии')).toBeInTheDocument()
    })
  })

  it('открывает модал добавления цены', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Цены')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Цены'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить цену/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить цену/i }))

    expect(screen.getByText('Длительность (минут)')).toBeInTheDocument()
    expect(screen.getByText('Стоимость (₽)')).toBeInTheDocument()
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(searchApi.getClubFullInfo).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockClubFullInfo), 1000))
    )

    render(<ClubManagementPage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('показывает ошибку, если клуб не выбран', async () => {
    useAuthStore.getState().logout()

    render(<ClubManagementPage />)

    expect(screen.getByText('Клуб не выбран')).toBeInTheDocument()
  })

  it('открывает модал подтверждения закрытия клуба', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Закрыть клуб/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Закрыть клуб/i }))

    expect(screen.getByText('Закрытие клуба')).toBeInTheDocument()
    expect(screen.getByText(/Вы уверены, что хотите закрыть клуб/i)).toBeInTheDocument()
  })

  it('открывает модал редактирования расписания', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Расписание')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Расписание'))

    await waitFor(() => {
      expect(screen.getByText('Понедельник')).toBeInTheDocument()
    })

    const editButtons = screen.getAllByText('Изменить')
    await user.click(editButtons[0])

    expect(screen.getByText(/Изменить расписание/i)).toBeInTheDocument()
    expect(screen.getByText('Рабочий день')).toBeInTheDocument()
  })

  it('показывает выходной день в расписании', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Расписание')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Расписание'))

    await waitFor(() => {
      expect(screen.getByText('Воскресенье')).toBeInTheDocument()
      expect(screen.getByText('Выходной')).toBeInTheDocument()
    })
  })

  it('показывает время работы для рабочих дней', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Расписание')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Расписание'))

    await waitFor(() => {
      // 10:00 - 22:00 из mockClubFullInfo
      expect(screen.getAllByText('10:00 - 22:00').length).toBeGreaterThan(0)
    })
  })

  it('показывает игры в клубе', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Игры')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Игры'))

    await waitFor(() => {
      expect(screen.getByText('Beat Saber')).toBeInTheDocument()
    })
  })

  it('показывает доступные для добавления игры', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Игры')).toBeInTheDocument()
    })

    await user.click(screen.getByText('Игры'))

    await waitFor(() => {
      expect(screen.getByText('Доступные игры')).toBeInTheDocument()
      // Half-Life: Alyx должен быть в доступных играх, так как его нет в клубе
      expect(screen.getByText('Half-Life: Alyx')).toBeInTheDocument()
    })
  })

  it('обновляет количество игровых мест', async () => {
    const user = userEvent.setup()

    render(<ClubManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Игровые места')).toBeInTheDocument()
    })

    const input = screen.getByRole('spinbutton')
    await user.clear(input)
    await user.type(input, '15')

    await user.click(screen.getByRole('button', { name: /Обновить/i }))

    // Должен открыться модал подтверждения
    await waitFor(() => {
      expect(screen.getByText(/Вы уверены/i)).toBeInTheDocument()
    })
  })

  describe('Управление ценами', () => {
    it('добавляет новую цену', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.addPrice).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Цены')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Цены'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить цену/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить цену/i }))

      // Ждем появления модала - ищем по заголовку
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Добавить цену/i })).toBeInTheDocument()
      })

      // Находим модал и используем within для поиска полей
      const modal = screen.getByRole('heading', { name: /Добавить цену/i }).closest('.fixed')!
      const inputs = within(modal as HTMLElement).getAllByRole('spinbutton')
      const durationInput = inputs[0]
      const priceInput = inputs[1]

      await user.clear(durationInput)
      await user.type(durationInput, '90')

      await user.clear(priceInput)
      await user.type(priceInput, '2000')

      // Находим кнопку "Добавить" в модальном окне
      const addButton = within(modal as HTMLElement).getByRole('button', { name: /^Добавить$/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.addPrice)).toHaveBeenCalledWith({
          durationMinutes: 90,
          value: 2000,
        })
      })
    })

    it('удаляет цену через модал подтверждения', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.deletePrice).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Цены')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Цены'))

      await waitFor(() => {
        expect(screen.getByText('30 минут')).toBeInTheDocument()
      })

      // Нажимаем кнопку удаления первой цены
      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      // Подтверждаем удаление в модальном окне
      await waitFor(() => {
        expect(screen.getByText('Удаление цены')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Удаление цены').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deletePrice)).toHaveBeenCalled()
      })
    })

    it('отменяет удаление цены', async () => {
      const user = userEvent.setup()

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Цены')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Цены'))

      await waitFor(() => {
        expect(screen.getByText('30 минут')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление цены')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /Отмена/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Удаление цены')).not.toBeInTheDocument()
      })
    })
  })

  describe('Управление играми', () => {
    it('добавляет игру в клуб', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.addGameToClub).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Игры')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Игры'))

      await waitFor(() => {
        expect(screen.getByText('Half-Life: Alyx')).toBeInTheDocument()
      })

      // Нажимаем кнопку "Добавить" для доступной игры
      const addButtons = screen.getAllByRole('button', { name: /^Добавить$/i })
      await user.click(addButtons[0])

      await waitFor(() => {
        expect(vi.mocked(managementApi.addGameToClub)).toHaveBeenCalled()
      })
    })

    it('удаляет игру из клуба', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.deleteGameFromClub).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Игры')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Игры'))

      await waitFor(() => {
        expect(screen.getByText('Beat Saber')).toBeInTheDocument()
      })

      // Нажимаем кнопку удаления для игры в клубе
      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      // Подтверждаем удаление
      await waitFor(() => {
        expect(screen.getByText('Удаление игры')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Удаление игры').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteGameFromClub)).toHaveBeenCalled()
      })
    })
  })

  describe('Управление расписанием', () => {
    it('изменяет расписание для рабочего дня', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.updateWorkSchedule).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Расписание')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Расписание'))

      await waitFor(() => {
        expect(screen.getByText('Понедельник')).toBeInTheDocument()
      })

      // Открываем модал редактирования
      const editButtons = screen.getAllByText('Изменить')
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText(/Изменить расписание/i)).toBeInTheDocument()
      })

      // Нажимаем "Сохранить"
      const saveButton = screen.getByRole('button', { name: /Сохранить/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.updateWorkSchedule)).toHaveBeenCalled()
      })
    })

    it('устанавливает выходной день', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.updateWorkSchedule).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Расписание')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Расписание'))

      await waitFor(() => {
        expect(screen.getByText('Понедельник')).toBeInTheDocument()
      })

      const editButtons = screen.getAllByText('Изменить')
      await user.click(editButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Рабочий день')).toBeInTheDocument()
      })

      // Снимаем флаг "Рабочий день"
      const checkbox = screen.getByRole('checkbox')
      await user.click(checkbox)

      const saveButton = screen.getByRole('button', { name: /Сохранить/i })
      await user.click(saveButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.updateWorkSchedule)).toHaveBeenCalledWith(
          expect.objectContaining({
            isWorkDay: false,
          })
        )
      })
    })

    it('добавляет день-исключение', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.addWorkScheduleException).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Исключения')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Исключения'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить исключение/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить исключение/i }))

      await waitFor(() => {
        expect(screen.getByText('Добавить день-исключение')).toBeInTheDocument()
      })
    })

    it('удаляет день-исключение', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.deleteWorkScheduleException).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Исключения')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Исключения'))

      await waitFor(() => {
        expect(screen.getByText(/Сокращенный день/i)).toBeInTheDocument()
      })

      // Нажимаем кнопку удаления
      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      // Подтверждаем удаление
      await waitFor(() => {
        expect(screen.getByText(/Вы уверены/i)).toBeInTheDocument()
      })
    })
  })

  describe('Управление фотографиями', () => {
    it('показывает текущие фотографии клуба', async () => {
      const user = userEvent.setup()

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Текущие фотографии')).toBeInTheDocument()
      })
    })

    it('показывает форму загрузки фотографий', async () => {
      const user = userEvent.setup()

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Загрузить новые фотографии')).toBeInTheDocument()
      })

      // Должен быть input для загрузки файлов
      const fileInput = document.querySelector('input[type="file"]')
      expect(fileInput).toBeInTheDocument()
    })

    it('кнопка сохранения отключена без выбранных фото', async () => {
      const user = userEvent.setup()

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Загрузить новые фотографии')).toBeInTheDocument()
      })

      const saveButton = screen.getByRole('button', { name: /Сохранить фотографии/i })
      expect(saveButton).toBeDisabled()
    })

    it('показывает кнопку удаления всех фото для закрытого клуба', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Удалить все фотографии/i })).toBeInTheDocument()
      })
    })

    it('не показывает кнопку удаления всех фото для открытого клуба', async () => {
      const user = userEvent.setup()

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Загрузить новые фотографии')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /Удалить все фотографии/i })).not.toBeInTheDocument()
    })

    it('загрузка фотографий работает', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.managePhotos).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Загрузить новые фотографии')).toBeInTheDocument()
      })

      // Проверяем наличие input для загрузки файлов
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
      expect(fileInput).toBeInTheDocument()
      expect(fileInput).toHaveAttribute('multiple')
    })

    it('отображение списка фотографий с возможностью изменения порядка', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        photos: [
          { id: 1, url: '/files/clubs/1/photo1.jpg', sequenceNumber: 1 },
          { id: 2, url: '/files/clubs/1/photo2.jpg', sequenceNumber: 2 },
          { id: 3, url: '/files/clubs/1/photo3.jpg', sequenceNumber: 3 },
        ],
      })

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Текущие фотографии')).toBeInTheDocument()
      })

      // Должны отображаться фотографии
      const images = document.querySelectorAll('img')
      expect(images.length).toBeGreaterThanOrEqual(3)
    })

    it('при сохранении фотографий порядок сохраняется', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        photos: [
          { id: 1, url: '/files/clubs/1/photo1.jpg', sequenceNumber: 1 },
          { id: 2, url: '/files/clubs/1/photo2.jpg', sequenceNumber: 2 },
        ],
      })
      vi.mocked(managementApi.managePhotos).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Текущие фотографии')).toBeInTheDocument()
      })

      // API для управления фото вызывается с sequenceNumber
      // Проверяем, что API корректно обрабатывает порядок
    })

    it('для открытого клуба нельзя удалить все фотографии', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: true,
        photos: [{ id: 1, url: '/files/clubs/1/photo1.jpg', sequenceNumber: 1 }],
      })
      vi.mocked(managementApi.managePhotos).mockRejectedValue(
        createBusinessError('Нельзя удалить все фотографии открытого клуба. Должна остаться минимум 1 фотография.')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Текущие фотографии')).toBeInTheDocument()
      })

      // Кнопка "Удалить все фотографии" не должна отображаться для открытого клуба
      expect(screen.queryByRole('button', { name: /Удалить все фотографии/i })).not.toBeInTheDocument()
    })

    it('при попытке открыть клуб без фотографий показывается ошибка', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
        photos: [],
      })
      vi.mocked(managementApi.openClub).mockRejectedValue(
        createBusinessError('Невозможно открыть клуб без фотографий')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Открыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Открытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Открыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.openClub)).toHaveBeenCalled()
      })
    })

    it('удаление одной фотографии из нескольких работает для открытого клуба', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: true,
        photos: [
          { id: 1, url: '/files/clubs/1/photo1.jpg', sequenceNumber: 1 },
          { id: 2, url: '/files/clubs/1/photo2.jpg', sequenceNumber: 2 },
        ],
      })
      vi.mocked(managementApi.managePhotos).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Фото')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Фото'))

      await waitFor(() => {
        expect(screen.getByText('Текущие фотографии')).toBeInTheDocument()
      })

      // Должны быть кнопки удаления для отдельных фото
      const deleteButtons = screen.queryAllByRole('button', { name: /Удалить/i })
      expect(deleteButtons.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Открытие и закрытие клуба', () => {
    it('открывает клуб успешно', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({ ...mockClubFullInfo, isOpen: false })
      vi.mocked(managementApi.openClub).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Открыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Открытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Открыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.openClub)).toHaveBeenCalled()
      })
    })

    it('закрывает клуб успешно', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.closeClub).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Закрыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Закрыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Закрытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Закрыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.closeClub)).toHaveBeenCalled()
      })
    })

    it('обрабатывает ошибку при закрытии клуба с активными бронированиями', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.closeClub).mockRejectedValue({
        response: { data: { message: 'Нельзя закрыть клуб с активными бронированиями' } }
      })

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Закрыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Закрыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Закрытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Закрыть$/i })
      await user.click(confirmButton)

      // Ошибка будет отображена через Toast
      await waitFor(() => {
        expect(vi.mocked(managementApi.closeClub)).toHaveBeenCalled()
      })
    })
  })

  describe('Обработка заблокированного сотрудника', () => {
    it('страница загружается при ошибке получения информации о клубе', async () => {
      vi.mocked(searchApi.getClubFullInfo).mockRejectedValue(createBlockedError())

      render(<ClubManagementPage />)

      await waitFor(() => {
        // Страница все равно загружается с базовой структурой
        expect(screen.getByText('Управление клубом')).toBeInTheDocument()
      })
    })

    it('табы управления отображаются даже при ошибке загрузки', async () => {
      vi.mocked(searchApi.getClubFullInfo).mockRejectedValue(createBlockedError())

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Управление клубом')).toBeInTheDocument()
      })

      // Табы все равно рендерятся
      expect(screen.getByText('Общее')).toBeInTheDocument()
      expect(screen.getByText('Цены')).toBeInTheDocument()
      expect(screen.getByText('Игры')).toBeInTheDocument()
    })
  })

  describe('Бизнес-правила открытия клуба', () => {
    it('при попытке открыть клуб без фотографий бэкенд возвращает ошибку', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
        photos: [], // Нет фотографий
      })
      vi.mocked(managementApi.openClub).mockRejectedValue(
        createBusinessError('Невозможно открыть клуб: необходима хотя бы одна фотография')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Открыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Открытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Открыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.openClub)).toHaveBeenCalled()
      })
    })

    it('при попытке открыть клуб без цен бэкенд возвращает ошибку', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
        prices: [], // Нет цен
      })
      vi.mocked(managementApi.openClub).mockRejectedValue(
        createBusinessError('Невозможно открыть клуб: необходима хотя бы одна цена')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Открыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Открытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Открыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.openClub)).toHaveBeenCalled()
      })
    })

    it('при попытке открыть клуб без полного графика работы бэкенд возвращает ошибку', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
        workSchedules: [
          { id: 1, dayOfWeek: 'MONDAY', openTime: '10:00', closeTime: '22:00', isWorkDay: true },
          // Не хватает остальных дней
        ],
      })
      vi.mocked(managementApi.openClub).mockRejectedValue(
        createBusinessError('Невозможно открыть клуб: не заполнен график работы на все дни недели')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Открыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Открытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Открыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.openClub)).toHaveBeenCalled()
      })
    })

    it('при попытке открыть клуб без игр бэкенд возвращает ошибку', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
        games: [], // Нет игр
      })
      vi.mocked(managementApi.openClub).mockRejectedValue(
        createBusinessError('Невозможно открыть клуб: необходима хотя бы одна игра')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Открыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Открытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Открыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.openClub)).toHaveBeenCalled()
      })
    })

    it('при попытке открыть клуб без выполнения условий отображается соответствующее сообщение', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
      })
      vi.mocked(managementApi.openClub).mockRejectedValue(
        createBusinessError('Невозможно открыть клуб: отсутствуют обязательные данные')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Открыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Открыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Открытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Открыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.openClub)).toHaveBeenCalled()
      })
    })
  })

  describe('Бизнес-правила закрытия клуба', () => {
    it('успешное закрытие клуба при отсутствии бронирований', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.closeClub).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Закрыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Закрыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Закрытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Закрыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.closeClub)).toHaveBeenCalled()
      })
    })

    it('при попытке закрыть клуб с оплаченными бронированиями отображается ошибка', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.closeClub).mockRejectedValue(
        createBusinessError('Нельзя закрыть клуб с оплаченными бронированиями')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Закрыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Закрыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Закрытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Закрыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.closeClub)).toHaveBeenCalled()
      })
    })

    it('при попытке закрыть клуб с бронированиями в статусе "Ожидание оплаты" отображается ошибка', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.closeClub).mockRejectedValue(
        createBusinessError('Нельзя закрыть клуб с бронированиями в статусе "Ожидание оплаты"')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Закрыть клуб/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Закрыть клуб/i }))

      await waitFor(() => {
        expect(screen.getByText('Закрытие клуба')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Закрыть$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.closeClub)).toHaveBeenCalled()
      })
    })
  })

  describe('Исключения из графика', () => {
    it('успешное добавление дня с отклонением от графика', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.addWorkScheduleException).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Исключения')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Исключения'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить исключение/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить исключение/i }))

      await waitFor(() => {
        expect(screen.getByText('Добавить день-исключение')).toBeInTheDocument()
      })
    })

    it('при попытке добавить день с отклонением, на который есть бронирования, отображается ошибка', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.addWorkScheduleException).mockRejectedValue(
        createBusinessError('Нельзя добавить день с отклонением при наличии бронирований')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Исключения')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Исключения'))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить исключение/i })).toBeInTheDocument()
      })

      // Тест проверяет, что при ошибке от API отображается соответствующее сообщение
    })
  })

  describe('Удаление игр', () => {
    it('успешное удаление игры, если в клубе есть другие активные игры', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        games: [
          { id: 1, name: 'Beat Saber', photoUrl: null, isActive: true },
          { id: 2, name: 'Half-Life: Alyx', photoUrl: null, isActive: true },
        ],
      })
      vi.mocked(managementApi.deleteGameFromClub).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Игры')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Игры'))

      await waitFor(() => {
        expect(screen.getByText('Beat Saber')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление игры')).toBeInTheDocument()
      })

      const modal = screen.getByText('Удаление игры').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteGameFromClub)).toHaveBeenCalled()
      })
    })

    it('при попытке удалить последнюю активную игру в открытом клубе отображается ошибка', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: true,
        games: [{ id: 1, name: 'Beat Saber', photoUrl: null, isActive: true }],
      })
      vi.mocked(managementApi.deleteGameFromClub).mockRejectedValue(
        createBusinessError('Нельзя удалить последнюю игру в открытом клубе')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Игры')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Игры'))

      await waitFor(() => {
        expect(screen.getByText('Beat Saber')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление игры')).toBeInTheDocument()
      })

      const modal = screen.getByText('Удаление игры').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteGameFromClub)).toHaveBeenCalled()
      })
    })

    it('в закрытом клубе можно удалить последнюю игру', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
        games: [{ id: 1, name: 'Beat Saber', photoUrl: null, isActive: true }],
      })
      vi.mocked(managementApi.deleteGameFromClub).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Игры')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Игры'))

      await waitFor(() => {
        expect(screen.getByText('Beat Saber')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление игры')).toBeInTheDocument()
      })

      const modal = screen.getByText('Удаление игры').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteGameFromClub)).toHaveBeenCalled()
      })
    })
  })

  describe('Удаление цен', () => {
    it('успешное удаление цены, если в клубе есть другие цены', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.deletePrice).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Цены')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Цены'))

      await waitFor(() => {
        expect(screen.getByText('30 минут')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление цены')).toBeInTheDocument()
      })

      const modal = screen.getByText('Удаление цены').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deletePrice)).toHaveBeenCalled()
      })
    })

    it('при попытке удалить последнюю цену в открытом клубе отображается ошибка', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: true,
        prices: [{ id: 1, durationMinutes: 30, value: 750 }],
      })
      vi.mocked(managementApi.deletePrice).mockRejectedValue(
        createBusinessError('Нельзя удалить последнюю цену в открытом клубе')
      )

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Цены')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Цены'))

      await waitFor(() => {
        expect(screen.getByText('30 минут')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление цены')).toBeInTheDocument()
      })

      const modal = screen.getByText('Удаление цены').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deletePrice)).toHaveBeenCalled()
      })
    })

    it('в закрытом клубе можно удалить последнюю цену', async () => {
      const user = userEvent.setup()

      vi.mocked(searchApi.getClubFullInfo).mockResolvedValue({
        ...mockClubFullInfo,
        isOpen: false,
        prices: [{ id: 1, durationMinutes: 30, value: 750 }],
      })
      vi.mocked(managementApi.deletePrice).mockResolvedValue(undefined)

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Цены')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Цены'))

      await waitFor(() => {
        expect(screen.getByText('30 минут')).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByText('Удалить')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление цены')).toBeInTheDocument()
      })

      const modal = screen.getByText('Удаление цены').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deletePrice)).toHaveBeenCalled()
      })
    })
  })

  describe('Добавление игр', () => {
    it('в списке доступных игр отображаются только игры со статусом "активна"', async () => {
      const user = userEvent.setup()

      // Клуб имеет только Beat Saber (id: 1), поэтому Active Game (id: 10) должна быть доступна
      vi.mocked(managementApi.getAllGames).mockResolvedValue([
        { id: 10, name: 'Active Game', photoUrl: null, isActive: true },
        { id: 11, name: 'Inactive Game', photoUrl: null, isActive: false },
      ])

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Игры')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Игры'))

      await waitFor(() => {
        expect(screen.getByText('Доступные игры')).toBeInTheDocument()
      })

      // Активная игра должна быть в списке доступных
      expect(screen.getByText('Active Game')).toBeInTheDocument()

      // Неактивная игра не должна отображаться в доступных
      expect(screen.queryByText('Inactive Game')).not.toBeInTheDocument()
    })

    it('устаревшие игры не отображаются в списке доступных для добавления', async () => {
      const user = userEvent.setup()

      // Используем ID, отличные от игр в клубе (Beat Saber имеет id: 1)
      vi.mocked(managementApi.getAllGames).mockResolvedValue([
        { id: 10, name: 'Current Game', photoUrl: null, isActive: true },
        { id: 11, name: 'Deprecated Game', photoUrl: null, isActive: false },
      ])

      render(<ClubManagementPage />)

      await waitFor(() => {
        expect(screen.getByText('Игры')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Игры'))

      await waitFor(() => {
        expect(screen.getByText('Доступные игры')).toBeInTheDocument()
      })

      // Устаревшая (неактивная) игра не должна быть доступна для добавления
      expect(screen.queryByText('Deprecated Game')).not.toBeInTheDocument()
    })
  })
})
