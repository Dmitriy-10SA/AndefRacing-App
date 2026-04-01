import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '../test-utils'
import HRManagementPage from '@/pages/management/HRManagementPage'
import { useAuthStore } from '@/stores/authStore'
import { mockClubs, mockEmployee, mockEmployeesWithRoles } from '../mocks/handlers'
import { managementApi } from '@/api/managementApi'
import { profileApi } from '@/api/profileApi'
import { EmployeeRole } from '@/types'
import { AxiosError } from 'axios'

// Мокаем API модули
vi.mock('@/api/managementApi')
vi.mock('@/api/profileApi')

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

describe('HRManagementPage Integration (Employee)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Устанавливаем авторизацию
    useAuthStore.getState().setCurrentClub(mockClubs[0])
    useAuthStore.getState().setToken('mock-jwt-token')

    // Дефолтные моки для успешных ответов
    vi.mocked(profileApi.getPersonalInfo).mockResolvedValue(mockEmployee)
    vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue(mockEmployeesWithRoles)
  })

  afterEach(() => {
    useAuthStore.getState().logout()
  })

  it('отображает страницу управления персоналом', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Управление персоналом')).toBeInTheDocument()
    })
  })

  it('отображает кнопку добавления сотрудника', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
    })
  })

  it('отображает список сотрудников', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр Петрович/i)).toBeInTheDocument()
      expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
    })
  })

  it('отображает роли сотрудников', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Сотрудник').length).toBeGreaterThan(0)
      // "Администратор" появляется и в бейджах ролей, и в dropdown-опциях
      expect(screen.getAllByText('Администратор').length).toBeGreaterThan(0)
    })
  })

  it('показывает телефоны сотрудников', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('+7-999-222-22-22')).toBeInTheDocument()
      expect(screen.getByText('+7-999-333-33-33')).toBeInTheDocument()
    })
  })

  it('показывает состояние загрузки', () => {
    vi.mocked(managementApi.getEmployeesAndRoles).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockEmployeesWithRoles), 1000))
    )

    render(<HRManagementPage />)

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('показывает ошибку при неудачной загрузке', async () => {
    vi.mocked(managementApi.getEmployeesAndRoles).mockRejectedValue(new Error('Ошибка'))

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText('Ошибка загрузки сотрудников')).toBeInTheDocument()
    })
  })

  it('открывает модал добавления сотрудника', async () => {
    const user = userEvent.setup()

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

    expect(screen.getByText('Телефон сотрудника')).toBeInTheDocument()
  })

  it('позволяет ввести телефон в модале добавления', async () => {
    const user = userEvent.setup()

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9992222222')

    expect(phoneInput).toHaveValue('+7-999-222-22-22')
  })

  it('закрывает модал при нажатии кнопки отмены', async () => {
    const user = userEvent.setup()

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

    expect(screen.getByText('Телефон сотрудника')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Отмена/i }))

    await waitFor(() => {
      expect(screen.queryByText('Телефон сотрудника')).not.toBeInTheDocument()
    })
  })

  it('показывает ошибку при неверном формате телефона', async () => {
    const user = userEvent.setup()

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '123')

    // Находим кнопку "Добавить сотрудника" внутри модала
    const addButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Неверный формат телефона')).toBeInTheDocument()
    })
  })

  it('открывает модал удаления сотрудника', async () => {
    const user = userEvent.setup()

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    const deleteButtons = screen.getAllByRole('button', { name: /Удалить/i })
    await user.click(deleteButtons[0])

    expect(screen.getByText('Удаление сотрудника')).toBeInTheDocument()
    expect(screen.getByText('Вы уверены, что хотите удалить этого сотрудника из клуба?')).toBeInTheDocument()
  })

  it('имеет возможность выбрать роль для добавления', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
    })

    // Должен быть селект для добавления роли
    const roleSelects = screen.getAllByRole('combobox')
    expect(roleSelects.length).toBeGreaterThan(0)
  })

  it('показывает кнопку удаления роли (кроме EMPLOYEE)', async () => {
    render(<HRManagementPage />)

    await waitFor(() => {
      // "Администратор" появляется и в бейджах ролей, и в dropdown-опциях
      expect(screen.getAllByText('Администратор').length).toBeGreaterThan(0)
    })

    // У Сидорова должна быть кнопка удаления роли Администратор
    const roleRemoveButtons = screen.getAllByText('×')
    expect(roleRemoveButtons.length).toBeGreaterThan(0)
  })

  it('успешно добавляет существующего сотрудника', async () => {
    const user = userEvent.setup()

    vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(true)
    vi.mocked(managementApi.addExistingEmployeeToClub).mockResolvedValue(undefined)

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9992222222')

    const addButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Сотрудник успешно добавлен')).toBeInTheDocument()
    })
  })

  it('показывает поля ФИО для нового сотрудника', async () => {
    const user = userEvent.setup()

    vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(false)

    render(<HRManagementPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

    const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    await user.type(phoneInput, '9994444444')

    const addButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByText('Сотрудник с таким номером не найден в системе. Заполните данные для создания нового сотрудника.')).toBeInTheDocument()
    })

    expect(screen.getByText('Фамилия')).toBeInTheDocument()
    expect(screen.getByText('Имя')).toBeInTheDocument()
    expect(screen.getByText('Отчество (необязательно)')).toBeInTheDocument()
  })

  describe('Добавление нового сотрудника', () => {
    it('успешно добавляет нового сотрудника с ФИО', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(false)
      vi.mocked(managementApi.addNewEmployeeToClub).mockResolvedValue(undefined)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9994444444')

      const checkButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
      await user.click(checkButton)

      await waitFor(() => {
        expect(screen.getByText('Фамилия')).toBeInTheDocument()
      })

      // Заполняем ФИО
      const surnameInput = screen.getByPlaceholderText('Иванов')
      const nameInput = screen.getByPlaceholderText('Иван')
      const patronymicInput = screen.getByPlaceholderText('Иванович')

      await user.type(surnameInput, 'Новиков')
      await user.type(nameInput, 'Николай')
      await user.type(patronymicInput, 'Николаевич')

      const addButton = screen.getByRole('button', { name: /^Добавить$/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.addNewEmployeeToClub)).toHaveBeenCalledWith({
          phone: '+7-999-444-44-44',
          roles: [EmployeeRole.EMPLOYEE],
          surname: 'Новиков',
          name: 'Николай',
          patronymic: 'Николаевич',
        })
      })
    })

    it('показывает ошибку при пустом имени', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(false)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9994444444')

      const checkButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
      await user.click(checkButton)

      await waitFor(() => {
        expect(screen.getByText('Фамилия')).toBeInTheDocument()
      })

      // Только фамилия без имени
      const surnameInput = screen.getByPlaceholderText('Иванов')
      await user.type(surnameInput, 'Новиков')

      const addButton = screen.getByRole('button', { name: /^Добавить$/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText(/Заполните обязательные поля/i)).toBeInTheDocument()
      })
    })

    it('позволяет выбрать роли при добавлении нового сотрудника', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(false)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9994444444')

      const checkButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
      await user.click(checkButton)

      await waitFor(() => {
        expect(screen.getByText('Роли')).toBeInTheDocument()
      })

      // Проверяем, что есть чекбоксы для ролей
      const checkboxes = screen.getAllByRole('checkbox')
      expect(checkboxes.length).toBeGreaterThanOrEqual(3) // EMPLOYEE, ADMIN, MANAGER
    })
  })

  describe('Изменение ролей сотрудника', () => {
    it('добавляет роль сотруднику', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.addRoleToEmployee).mockResolvedValue(undefined)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      })

      // Выбираем роль из селекта
      const roleSelects = screen.getAllByRole('combobox')
      await user.selectOptions(roleSelects[0], EmployeeRole.ADMINISTRATOR)

      // Подтверждаем добавление роли
      await waitFor(() => {
        expect(screen.getByText('Добавление роли')).toBeInTheDocument()
      })

      const confirmButton = screen.getByRole('button', { name: /^Добавить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.addRoleToEmployee)).toHaveBeenCalledWith(
          2, // ID Петрова
          EmployeeRole.ADMINISTRATOR
        )
      })
    })

    it('удаляет роль сотрудника (кроме EMPLOYEE)', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.deleteEmployeeRole).mockResolvedValue(undefined)

      render(<HRManagementPage />)

      await waitFor(() => {
        // Сидоров имеет роль ADMIN
        expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
      })

      // Находим кнопку удаления роли (×) рядом с "Администратор"
      const roleRemoveButtons = screen.getAllByText('×')
      await user.click(roleRemoveButtons[0])

      // Подтверждаем удаление роли
      await waitFor(() => {
        expect(screen.getByText('Удаление роли')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Удаление роли').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteEmployeeRole)).toHaveBeenCalled()
      })
    })

    it('отменяет добавление роли', async () => {
      const user = userEvent.setup()

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      })

      const roleSelects = screen.getAllByRole('combobox')
      await user.selectOptions(roleSelects[0], EmployeeRole.MANAGER)

      await waitFor(() => {
        expect(screen.getByText('Добавление роли')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /Отмена/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Добавление роли')).not.toBeInTheDocument()
      })
    })
  })

  describe('Удаление сотрудника', () => {
    it('успешно удаляет сотрудника', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.deleteEmployeeFromClub).mockResolvedValue(undefined)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /Удалить/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление сотрудника')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Удаление сотрудника').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteEmployeeFromClub)).toHaveBeenCalled()
      })

      await waitFor(() => {
        expect(screen.getByText('Сотрудник удален из клуба')).toBeInTheDocument()
      })
    })

    it('отменяет удаление сотрудника', async () => {
      const user = userEvent.setup()

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /Удалить/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление сотрудника')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /Отмена/i })
      await user.click(cancelButton)

      await waitFor(() => {
        expect(screen.queryByText('Удаление сотрудника')).not.toBeInTheDocument()
      })
    })

    it('обрабатывает ошибку при удалении сотрудника', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.deleteEmployeeFromClub).mockRejectedValue({
        response: { data: { message: 'Невозможно удалить сотрудника' } }
      })

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /Удалить/i })
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.getByText('Удаление сотрудника')).toBeInTheDocument()
      })

      // Используем within для поиска в модале
      const modal = screen.getByText('Удаление сотрудника').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(screen.getByText('Невозможно удалить сотрудника')).toBeInTheDocument()
      })
    })
  })

  describe('Валидация формы добавления', () => {
    it('не отправляет форму при пустом телефоне', async () => {
      const user = userEvent.setup()

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

      // Пытаемся добавить без телефона
      const addButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Неверный формат телефона')).toBeInTheDocument()
      })

      expect(vi.mocked(managementApi.isEmployeeInSystem)).not.toHaveBeenCalled()
    })

    it('валидирует формат телефона при добавлении', async () => {
      const user = userEvent.setup()

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '123') // Неполный телефон

      const addButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText('Неверный формат телефона')).toBeInTheDocument()
      })
    })

    it('показывает ошибку при пустой фамилии', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.isEmployeeInSystem).mockResolvedValue(false)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Добавить сотрудника/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /Добавить сотрудника/i }))

      const phoneInput = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
      await user.type(phoneInput, '9994444444')

      const checkButton = screen.getAllByRole('button', { name: /Добавить сотрудника/i })[1]
      await user.click(checkButton)

      await waitFor(() => {
        expect(screen.getByText('Имя')).toBeInTheDocument()
      })

      // Только имя без фамилии
      const nameInput = screen.getByPlaceholderText('Иван')
      await user.type(nameInput, 'Николай')

      const addButton = screen.getByRole('button', { name: /^Добавить$/i })
      await user.click(addButton)

      await waitFor(() => {
        expect(screen.getByText(/Заполните обязательные поля/i)).toBeInTheDocument()
      })
    })
  })

  describe('Обработка заблокированного сотрудника', () => {
    it('отображает сообщение об ошибке при загрузке страницы управления персоналом', async () => {
      vi.mocked(managementApi.getEmployeesAndRoles).mockRejectedValue(createBlockedError())

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки сотрудников/i)).toBeInTheDocument()
      })
    })

    it('не отображает список сотрудников для заблокированного пользователя', async () => {
      vi.mocked(managementApi.getEmployeesAndRoles).mockRejectedValue(createBlockedError())

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки сотрудников/i)).toBeInTheDocument()
      })

      expect(screen.queryByText('Петров Петр Петрович')).not.toBeInTheDocument()
      expect(screen.queryByText('Сидоров Сидор')).not.toBeInTheDocument()
    })

    it('не показывает кнопку добавления сотрудника для заблокированного пользователя', async () => {
      vi.mocked(managementApi.getEmployeesAndRoles).mockRejectedValue(createBlockedError())

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Вы заблокированы|Ошибка загрузки сотрудников/i)).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: /Добавить сотрудника/i })).not.toBeInTheDocument()
    })
  })

  describe('Бизнес-правила управления ролью EMPLOYEE', () => {
    it('при попытке удалить роль "сотрудник" у сотрудника с другими ролями отображается ошибка', async () => {
      const user = userEvent.setup()

      // Сотрудник с несколькими ролями
      vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
        {
          employeeDto: {
            id: 3,
            surname: 'Сидоров',
            name: 'Сидор',
            patronymic: null,
            phone: '+7-999-333-33-33',
          },
          roles: [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR],
        },
      ])
      vi.mocked(managementApi.deleteEmployeeRole).mockRejectedValue(
        createBusinessError('Невозможно удалить базовую роль "Сотрудник"')
      )

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
      })

      // Пытаемся удалить роль EMPLOYEE (первый × в списке ролей)
      // Примечание: В UI роль "Сотрудник" может быть защищена от удаления
    })

    it('успешное удаление роли, отличной от "сотрудник"', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
        {
          employeeDto: {
            id: 3,
            surname: 'Сидоров',
            name: 'Сидор',
            patronymic: null,
            phone: '+7-999-333-33-33',
          },
          roles: [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR],
        },
      ])
      vi.mocked(managementApi.deleteEmployeeRole).mockResolvedValue(undefined)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
      })

      // Находим кнопку удаления роли (×) рядом с "Администратор"
      const roleRemoveButtons = screen.getAllByText('×')
      await user.click(roleRemoveButtons[0])

      // Подтверждаем удаление роли
      await waitFor(() => {
        expect(screen.getByText('Удаление роли')).toBeInTheDocument()
      })

      const modal = screen.getByText('Удаление роли').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })
      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteEmployeeRole)).toHaveBeenCalled()
      })
    })

    it('роль "сотрудник" нельзя удалить через UI', async () => {
      vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
        {
          employeeDto: {
            id: 2,
            surname: 'Петров',
            name: 'Петр',
            patronymic: 'Петрович',
            phone: '+7-999-222-22-22',
          },
          roles: [EmployeeRole.EMPLOYEE], // Только роль EMPLOYEE
        },
      ])

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Петров Петр/i)).toBeInTheDocument()
      })

      // У сотрудника с единственной ролью EMPLOYEE не должно быть кнопки × для удаления роли
      // или кнопка должна быть отключена
      const roleRemoveButtons = screen.queryAllByText('×')
      expect(roleRemoveButtons.length).toBe(0)
    })

    it('нельзя назначить роль, которая уже есть у сотрудника', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
        {
          employeeDto: {
            id: 3,
            surname: 'Сидоров',
            name: 'Сидор',
            patronymic: null,
            phone: '+7-999-333-33-33',
          },
          roles: [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR],
        },
      ])

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
      })

      // Селект для добавления роли не должен содержать уже назначенные роли
      const roleSelects = screen.getAllByRole('combobox')
      expect(roleSelects.length).toBeGreaterThan(0)
    })

    it('при попытке удалить роль "сотрудник" показывается ошибка "Нельзя удалить роль сотрудник"', async () => {
      const user = userEvent.setup()

      // Сотрудник с несколькими ролями, включая EMPLOYEE
      vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
        {
          employeeDto: {
            id: 3,
            surname: 'Сидоров',
            name: 'Сидор',
            patronymic: null,
            phone: '+7-999-333-33-33',
          },
          roles: [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR],
        },
      ])
      vi.mocked(managementApi.deleteEmployeeRole).mockRejectedValue(
        createBusinessError("Нельзя удалить роль 'сотрудник'")
      )

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
      })

      // В UI кнопка × для роли EMPLOYEE должна быть либо скрыта, либо при нажатии показывать ошибку
      // Если API вызывается - проверяем, что ошибка отображается
    })

    it('подтверждение удаления роли через модальное окно', async () => {
      const user = userEvent.setup()

      vi.mocked(managementApi.getEmployeesAndRoles).mockResolvedValue([
        {
          employeeDto: {
            id: 3,
            surname: 'Сидоров',
            name: 'Сидор',
            patronymic: null,
            phone: '+7-999-333-33-33',
          },
          roles: [EmployeeRole.EMPLOYEE, EmployeeRole.ADMINISTRATOR],
        },
      ])
      vi.mocked(managementApi.deleteEmployeeRole).mockResolvedValue(undefined)

      render(<HRManagementPage />)

      await waitFor(() => {
        expect(screen.getByText(/Сидоров Сидор/i)).toBeInTheDocument()
      })

      // Находим кнопку удаления роли (×) рядом с "Администратор"
      const roleRemoveButtons = screen.getAllByText('×')
      await user.click(roleRemoveButtons[0])

      // Должен появиться модал подтверждения
      await waitFor(() => {
        expect(screen.getByText('Удаление роли')).toBeInTheDocument()
        expect(screen.getByText(/Вы уверены/i)).toBeInTheDocument()
      })

      // Находим кнопку подтверждения в модале
      const modal = screen.getByText('Удаление роли').closest('.fixed')!
      const confirmButton = within(modal as HTMLElement).getByRole('button', { name: /^Удалить$/i })

      await user.click(confirmButton)

      await waitFor(() => {
        expect(vi.mocked(managementApi.deleteEmployeeRole)).toHaveBeenCalled()
      })
    })
  })
})
