import { describe, it, expect, vi, beforeEach } from 'vitest'
import { managementApi } from '@/api/managementApi'
import axiosInstance from '@/lib/axios'
import type {
  EmployeeAndRolesDto,
  AddNewEmployeeDto,
  AddExistingEmployeeDto,
  WorkScheduleExceptionDto,
  AddWorkScheduleExceptionDto,
  UpdateWorkScheduleDto,
  AddPriceDto,
  GameDto,
} from '@/types'

vi.mock('@/lib/axios')

describe('managementApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // HR Management Tests
  describe('HR Management', () => {
    describe('isEmployeeInSystem', () => {
      it('проверяет, что сотрудник есть в системе', async () => {
        const employeePhone = '+79991234567'
        const mockResponse = { data: true }

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

        const result = await managementApi.isEmployeeInSystem(employeePhone)

        expect(axiosInstance.get).toHaveBeenCalledWith(
          '/club-management/hr/is-employee-in-system',
          { params: { employeePhone } }
        )
        expect(result).toBe(true)
      })

      it('проверяет, что сотрудника нет в системе', async () => {
        const mockResponse = { data: false }

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

        const result = await managementApi.isEmployeeInSystem('+79997654321')

        expect(result).toBe(false)
      })
    })

    describe('addNewEmployeeToClub', () => {
      it('добавляет нового сотрудника в клуб', async () => {
        const newEmployee: AddNewEmployeeDto = {
          firstName: 'Иван',
          middleName: 'Иванович',
          lastName: 'Иванов',
          phone: '+79991234567',
          password: 'password123',
          role: 'OPERATOR',
        }

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.addNewEmployeeToClub(newEmployee)

        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/club-management/hr/add-new-employee-to-club',
          newEmployee
        )
      })

      it('обрабатывает ошибку при добавлении сотрудника', async () => {
        const newEmployee: AddNewEmployeeDto = {
          firstName: 'Иван',
          middleName: null,
          lastName: 'Иванов',
          phone: '+79991234567',
          password: 'password123',
          role: 'OPERATOR',
        }
        const error = new Error('Phone already exists')

        vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

        await expect(managementApi.addNewEmployeeToClub(newEmployee)).rejects.toThrow(
          'Phone already exists'
        )
      })
    })

    describe('addExistingEmployeeToClub', () => {
      it('добавляет существующего сотрудника в клуб', async () => {
        const existingEmployee: AddExistingEmployeeDto = {
          phone: '+79991234567',
          role: 'ADMINISTRATOR',
        }

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.addExistingEmployeeToClub(existingEmployee)

        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/club-management/hr/add-existing-employee-to-club',
          existingEmployee
        )
      })
    })

    describe('getEmployeesAndRoles', () => {
      it('получает список сотрудников с ролями', async () => {
        const mockEmployees: EmployeeAndRolesDto[] = [
          {
            id: 1,
            firstName: 'Иван',
            middleName: 'Иванович',
            lastName: 'Иванов',
            phone: '+79991234567',
            roles: ['ADMINISTRATOR'],
          },
          {
            id: 2,
            firstName: 'Мария',
            middleName: null,
            lastName: 'Петрова',
            phone: '+79997654321',
            roles: ['OPERATOR'],
          },
        ]
        const mockResponse = { data: mockEmployees }

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

        const result = await managementApi.getEmployeesAndRoles()

        expect(axiosInstance.get).toHaveBeenCalledWith('/club-management/hr')
        expect(result).toEqual(mockEmployees)
        expect(result).toHaveLength(2)
      })

      it('возвращает пустой список, если нет сотрудников', async () => {
        const mockResponse = { data: [] }

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

        const result = await managementApi.getEmployeesAndRoles()

        expect(result).toEqual([])
      })
    })

    describe('deleteEmployeeFromClub', () => {
      it('удаляет сотрудника из клуба', async () => {
        const employeeId = 1

        vi.mocked(axiosInstance.delete).mockResolvedValueOnce({})

        await managementApi.deleteEmployeeFromClub(employeeId)

        expect(axiosInstance.delete).toHaveBeenCalledWith(
          `/club-management/hr/delete-employee-from-club/${employeeId}`
        )
      })
    })

    describe('addRoleToEmployee', () => {
      it('добавляет роль сотруднику', async () => {
        const employeeId = 1
        const role = 'ADMINISTRATOR'

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.addRoleToEmployee(employeeId, role)

        expect(axiosInstance.post).toHaveBeenCalledWith(
          `/club-management/hr/add-role-to-employee-in-club/${employeeId}`,
          null,
          { params: { role } }
        )
      })
    })

    describe('updateEmployeeRole', () => {
      it('обновляет роль сотрудника', async () => {
        const employeeId = 1
        const oldRole = 'OPERATOR'
        const newRole = 'ADMINISTRATOR'

        vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

        await managementApi.updateEmployeeRole(employeeId, oldRole, newRole)

        expect(axiosInstance.patch).toHaveBeenCalledWith(
          `/club-management/hr/update-employee-role-in-club/${employeeId}`,
          null,
          { params: { oldRole, newRole } }
        )
      })
    })

    describe('deleteEmployeeRole', () => {
      it('удаляет роль у сотрудника', async () => {
        const employeeId = 1
        const role = 'OPERATOR'

        vi.mocked(axiosInstance.delete).mockResolvedValueOnce({})

        await managementApi.deleteEmployeeRole(employeeId, role)

        expect(axiosInstance.delete).toHaveBeenCalledWith(
          `/club-management/hr/delete-employee-role-in-club/${employeeId}`,
          { params: { role } }
        )
      })
    })
  })

  // Work Schedule Management Tests
  describe('Work Schedule Management', () => {
    describe('addWorkScheduleException', () => {
      it('добавляет исключение в расписание', async () => {
        const exception: AddWorkScheduleExceptionDto = {
          date: '2024-01-01',
          startTime: null,
          endTime: null,
          isClosed: true,
        }

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.addWorkScheduleException(exception)

        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/club-management/work-schedule/exceptions',
          exception
        )
      })

      it('добавляет исключение с измененными часами', async () => {
        const exception: AddWorkScheduleExceptionDto = {
          date: '2024-12-31',
          startTime: '12:00',
          endTime: '18:00',
          isClosed: false,
        }

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.addWorkScheduleException(exception)

        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/club-management/work-schedule/exceptions',
          exception
        )
      })
    })

    describe('getWorkScheduleExceptions', () => {
      it('получает список исключений за период', async () => {
        const mockExceptions: WorkScheduleExceptionDto[] = [
          {
            id: 1,
            date: '2024-01-01',
            startTime: null,
            endTime: null,
            isClosed: true,
          },
          {
            id: 2,
            date: '2024-12-31',
            startTime: '12:00',
            endTime: '18:00',
            isClosed: false,
          },
        ]
        const mockResponse = { data: mockExceptions }

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

        const result = await managementApi.getWorkScheduleExceptions('2024-01-01', '2024-12-31')

        expect(axiosInstance.get).toHaveBeenCalledWith(
          '/club-management/work-schedule/exceptions',
          { params: { startDate: '2024-01-01', endDate: '2024-12-31' } }
        )
        expect(result).toEqual(mockExceptions)
      })
    })

    describe('deleteWorkScheduleException', () => {
      it('удаляет исключение из расписания', async () => {
        const exceptionId = 1

        vi.mocked(axiosInstance.delete).mockResolvedValueOnce({})

        await managementApi.deleteWorkScheduleException(exceptionId)

        expect(axiosInstance.delete).toHaveBeenCalledWith(
          `/club-management/work-schedule/exceptions/${exceptionId}`
        )
      })
    })

    describe('updateWorkSchedule', () => {
      it('обновляет расписание работы', async () => {
        const schedule: UpdateWorkScheduleDto = {
          mondayStart: '09:00',
          mondayEnd: '21:00',
          tuesdayStart: '09:00',
          tuesdayEnd: '21:00',
          wednesdayStart: '09:00',
          wednesdayEnd: '21:00',
          thursdayStart: '09:00',
          thursdayEnd: '21:00',
          fridayStart: '10:00',
          fridayEnd: '22:00',
          saturdayStart: '10:00',
          saturdayEnd: '22:00',
          sundayStart: null,
          sundayEnd: null,
        }

        vi.mocked(axiosInstance.put).mockResolvedValueOnce({})

        await managementApi.updateWorkSchedule(schedule)

        expect(axiosInstance.put).toHaveBeenCalledWith(
          '/club-management/work-schedule',
          schedule
        )
      })
    })
  })

  // Club Management Tests
  describe('Club Management', () => {
    describe('updateCntEquipment', () => {
      it('обновляет количество оборудования', async () => {
        const cntEquipment = 15

        vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

        await managementApi.updateCntEquipment(cntEquipment)

        expect(axiosInstance.patch).toHaveBeenCalledWith('/club-management', null, {
          params: { cntEquipment },
        })
      })
    })

    describe('openClub', () => {
      it('открывает клуб', async () => {
        vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

        await managementApi.openClub()

        expect(axiosInstance.patch).toHaveBeenCalledWith('/club-management/open')
      })
    })

    describe('closeClub', () => {
      it('закрывает клуб', async () => {
        vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

        await managementApi.closeClub()

        expect(axiosInstance.patch).toHaveBeenCalledWith('/club-management/close')
      })
    })
  })

  // Price Management Tests
  describe('Price Management', () => {
    describe('addPrice', () => {
      it('добавляет новую цену', async () => {
        const priceData: AddPriceDto = {
          durationMinutes: 90,
          value: 1200,
        }

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.addPrice(priceData)

        expect(axiosInstance.post).toHaveBeenCalledWith('/club-management/prices', priceData)
      })
    })

    describe('updatePrice', () => {
      it('обновляет цену', async () => {
        const priceId = 1
        const value = 1500

        vi.mocked(axiosInstance.patch).mockResolvedValueOnce({})

        await managementApi.updatePrice(priceId, value)

        expect(axiosInstance.patch).toHaveBeenCalledWith(
          `/club-management/prices/${priceId}`,
          null,
          { params: { value } }
        )
      })
    })

    describe('deletePrice', () => {
      it('удаляет цену', async () => {
        const priceId = 1

        vi.mocked(axiosInstance.delete).mockResolvedValueOnce({})

        await managementApi.deletePrice(priceId)

        expect(axiosInstance.delete).toHaveBeenCalledWith(`/club-management/prices/${priceId}`)
      })
    })
  })

  // Games Management Tests
  describe('Games Management', () => {
    describe('getAllGames', () => {
      it('получает список всех игр', async () => {
        const mockGames: GameDto[] = [
          { id: 1, name: 'Beat Saber' },
          { id: 2, name: 'Half-Life: Alyx' },
          { id: 3, name: 'Superhot VR' },
        ]
        const mockResponse = { data: mockGames }

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

        const result = await managementApi.getAllGames()

        expect(axiosInstance.get).toHaveBeenCalledWith('/club-management/games')
        expect(result).toEqual(mockGames)
        expect(result).toHaveLength(3)
      })

      it('возвращает пустой список, если нет игр', async () => {
        const mockResponse = { data: [] }

        vi.mocked(axiosInstance.get).mockResolvedValueOnce(mockResponse)

        const result = await managementApi.getAllGames()

        expect(result).toEqual([])
      })
    })

    describe('addGameToClub', () => {
      it('добавляет игру в клуб', async () => {
        const gameId = 1

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.addGameToClub(gameId)

        expect(axiosInstance.post).toHaveBeenCalledWith(`/club-management/games/${gameId}`)
      })
    })

    describe('deleteGameFromClub', () => {
      it('удаляет игру из клуба', async () => {
        const gameId = 1

        vi.mocked(axiosInstance.delete).mockResolvedValueOnce({})

        await managementApi.deleteGameFromClub(gameId)

        expect(axiosInstance.delete).toHaveBeenCalledWith(`/club-management/games/${gameId}`)
      })
    })
  })

  // Photos Management Tests
  describe('Photos Management', () => {
    describe('managePhotos', () => {
      it('загружает фотографии', async () => {
        const photos = [
          new File(['content1'], 'photo1.jpg', { type: 'image/jpeg' }),
          new File(['content2'], 'photo2.jpg', { type: 'image/jpeg' }),
        ]

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.managePhotos(photos)

        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/club-management/photos/manage',
          expect.any(FormData),
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
      })

      it('отправляет пустой файл для удаления всех фотографий', async () => {
        const photos: File[] = []

        vi.mocked(axiosInstance.post).mockResolvedValueOnce({})

        await managementApi.managePhotos(photos)

        expect(axiosInstance.post).toHaveBeenCalledWith(
          '/club-management/photos/manage',
          expect.any(FormData),
          { headers: { 'Content-Type': 'multipart/form-data' } }
        )
      })

      it('обрабатывает ошибку при загрузке фотографий', async () => {
        const photos = [new File(['content'], 'photo.jpg', { type: 'image/jpeg' })]
        const error = new Error('File too large')

        vi.mocked(axiosInstance.post).mockRejectedValueOnce(error)

        await expect(managementApi.managePhotos(photos)).rejects.toThrow('File too large')
      })
    })
  })
})
