import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { managementApi } from '@/api/managementApi'
import { profileApi } from '@/api/profileApi'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorMessage from '@/components/ErrorMessage'
import ConfirmModal from '@/components/ConfirmModal'
import PhoneInput from '@/components/PhoneInput'
import { EmployeeRole, AddNewEmployeeDto, AddExistingEmployeeDto } from '@/types'
import { formatPhone } from '@/utils/formatters'

const HRManagementPage = () => {
  const queryClient = useQueryClient()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddRoleModal, setShowAddRoleModal] = useState(false)
  const [showDeleteRoleModal, setShowDeleteRoleModal] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState<EmployeeRole | null>(null)
  const [isNewEmployee, setIsNewEmployee] = useState(false)
  const [phone, setPhone] = useState('')
  const [surname, setSurname] = useState('')
  const [name, setName] = useState('')
  const [patronymic, setPatronymic] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<EmployeeRole[]>([EmployeeRole.EMPLOYEE])
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: managementApi.getEmployeesAndRoles,
  })

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: profileApi.getPersonalInfo,
  })

  const checkEmployeeMutation = useMutation({
    mutationFn: managementApi.isEmployeeInSystem,
    onSuccess: (isInSystem) => {
      if (isInSystem) {
        // Сотрудник есть в системе - сразу добавляем
        const data: AddExistingEmployeeDto = {
          phone,
          roles: selectedRoles,
        }
        addExistingEmployeeMutation.mutate(data)
      } else {
        // Сотрудника нет - показываем поля ФИО
        setIsNewEmployee(true)
      }
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Ошибка проверки сотрудника')
      setTimeout(() => setErrorMessage(''), 5000)
    },
  })

  const addNewEmployeeMutation = useMutation({
    mutationFn: (data: AddNewEmployeeDto) => managementApi.addNewEmployeeToClub(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowAddModal(false)
      resetForm()
      setSuccessMessage('Сотрудник успешно добавлен')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Ошибка добавления сотрудника')
      setTimeout(() => setErrorMessage(''), 5000)
    },
  })

  const addExistingEmployeeMutation = useMutation({
    mutationFn: (data: AddExistingEmployeeDto) => managementApi.addExistingEmployeeToClub(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowAddModal(false)
      resetForm()
      setSuccessMessage('Сотрудник успешно добавлен')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error: any) => {
      setErrorMessage(error.response?.data?.message || 'Ошибка добавления сотрудника')
      setTimeout(() => setErrorMessage(''), 5000)
    },
  })

  const deleteEmployeeMutation = useMutation({
    mutationFn: (employeeId: number) => managementApi.deleteEmployeeFromClub(employeeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowDeleteModal(false)
      setSelectedEmployeeId(null)
      setSuccessMessage('Сотрудник удален из клуба')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error: any) => {
      setShowDeleteModal(false)
      setSelectedEmployeeId(null)
      setErrorMessage(error.response?.data?.message || 'Ошибка удаления сотрудника')
      setTimeout(() => setErrorMessage(''), 5000)
    },
  })

  const addRoleMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: number; role: EmployeeRole }) =>
      managementApi.addRoleToEmployee(employeeId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowAddRoleModal(false)
      setSelectedEmployeeId(null)
      setSelectedRole(null)
      setSuccessMessage('Роль успешно добавлена')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error: any) => {
      setShowAddRoleModal(false)
      setSelectedEmployeeId(null)
      setSelectedRole(null)
      setErrorMessage(error.response?.data?.message || 'Ошибка добавления роли')
      setTimeout(() => setErrorMessage(''), 5000)
    },
  })

  const deleteRoleMutation = useMutation({
    mutationFn: ({ employeeId, role }: { employeeId: number; role: EmployeeRole }) =>
      managementApi.deleteEmployeeRole(employeeId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setShowDeleteRoleModal(false)
      setSelectedEmployeeId(null)
      setSelectedRole(null)
      setSuccessMessage('Роль успешно удалена')
      setTimeout(() => setSuccessMessage(''), 3000)
    },
    onError: (error: any) => {
      setShowDeleteRoleModal(false)
      setSelectedEmployeeId(null)
      setSelectedRole(null)
      setErrorMessage(error.response?.data?.message || 'Ошибка удаления роли')
      setTimeout(() => setErrorMessage(''), 5000)
    },
  })

  const resetForm = () => {
    setPhone('')
    setSurname('')
    setName('')
    setPatronymic('')
    setSelectedRoles([EmployeeRole.EMPLOYEE])
    setIsNewEmployee(false)
  }

  const handleCheckPhone = () => {
    if (!phone.match(/^\+7-\d{3}-\d{3}-\d{2}-\d{2}$/)) {
      setErrorMessage('Неверный формат телефона')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    checkEmployeeMutation.mutate(phone)
  }

  const handleAddNewEmployee = () => {
    if (!surname || !name) {
      setErrorMessage('Заполните обязательные поля (Фамилия и Имя)')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }
    const data: AddNewEmployeeDto = {
      phone,
      roles: selectedRoles,
      surname,
      name,
      patronymic: patronymic || null,
    }
    addNewEmployeeMutation.mutate(data)
  }

  const handleDeleteEmployee = (employeeId: number) => {
    setSelectedEmployeeId(employeeId)
    setShowDeleteModal(true)
  }

  const handleAddRole = (employeeId: number, role: EmployeeRole) => {
    setSelectedEmployeeId(employeeId)
    setSelectedRole(role)
    setShowAddRoleModal(true)
  }

  const handleDeleteRole = (employeeId: number, role: EmployeeRole) => {
    setSelectedEmployeeId(employeeId)
    setSelectedRole(role)
    setShowDeleteRoleModal(true)
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

  const toggleRole = (role: EmployeeRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role))
    } else {
      setSelectedRoles([...selectedRoles, role])
    }
  }

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message="Ошибка загрузки сотрудников" />

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Управление персоналом</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary w-full sm:w-auto"
        >
          Добавить сотрудника
        </button>
      </div>

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4">
          <ErrorMessage message={errorMessage} />
        </div>
      )}

      <div className="space-y-4">
        {employees?.filter((emp) => emp.employeeDto.phone !== currentUser?.phone).map((emp) => (
          <div key={emp.employeeDto.id} className="card">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {emp.employeeDto.surname} {emp.employeeDto.name}{emp.employeeDto.patronymic ? ` ${emp.employeeDto.patronymic}` : ''}
                </h3>
                <p className="text-gray-600">{formatPhone(emp.employeeDto.phone)}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {emp.roles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm font-medium flex items-center gap-2"
                    >
                      {getRoleLabel(role)}
                      {role !== EmployeeRole.EMPLOYEE && (
                        <button
                          onClick={() => handleDeleteRole(emp.employeeDto.id, role)}
                          className="text-red-600 hover:text-red-800"
                          title="Удалить роль"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
                <select
                  onChange={(e) => {
                    const role = e.target.value as EmployeeRole
                    if (role && !emp.roles.includes(role)) {
                      handleAddRole(emp.employeeDto.id, role)
                    }
                    e.target.value = ''
                  }}
                  className="input text-sm w-full sm:w-auto"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Добавить роль
                  </option>
                  {Object.values(EmployeeRole)
                    .filter((role) => !emp.roles.includes(role))
                    .map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                </select>
                <button
                  onClick={() => handleDeleteEmployee(emp.employeeDto.id)}
                  className="btn-danger w-full sm:w-auto"
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Добавить сотрудника</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Телефон сотрудника</label>
                <PhoneInput value={phone} onChange={setPhone} />
                {!isNewEmployee && (
                  <button
                    onClick={handleCheckPhone}
                    className="btn-primary mt-2 w-full"
                    disabled={checkEmployeeMutation.isPending || addExistingEmployeeMutation.isPending}
                  >
                    {checkEmployeeMutation.isPending || addExistingEmployeeMutation.isPending
                      ? 'Добавление...'
                      : 'Добавить сотрудника'}
                  </button>
                )}
              </div>

              {isNewEmployee && (
                <>
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                    Сотрудник с таким номером не найден в системе. Заполните данные для создания нового сотрудника.
                  </div>

                  <div>
                    <label className="label">Фамилия</label>
                    <input
                      type="text"
                      value={surname}
                      onChange={(e) => setSurname(e.target.value)}
                      className="input"
                      placeholder="Иванов"
                    />
                  </div>
                  <div>
                    <label className="label">Имя</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input"
                      placeholder="Иван"
                    />
                  </div>
                  <div>
                    <label className="label">Отчество (необязательно)</label>
                    <input
                      type="text"
                      value={patronymic}
                      onChange={(e) => setPatronymic(e.target.value)}
                      className="input"
                      placeholder="Иванович"
                    />
                  </div>

                  <div>
                    <label className="label">Роли</label>
                    <div className="space-y-2">
                      {Object.values(EmployeeRole).map((role) => (
                        <label key={role} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedRoles.includes(role)}
                            onChange={() => toggleRole(role)}
                            disabled={role === EmployeeRole.EMPLOYEE}
                          />
                          <span>{getRoleLabel(role)}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowAddModal(false)
                        resetForm()
                      }}
                      className="btn-secondary flex-1"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleAddNewEmployee}
                      className="btn-primary flex-1"
                      disabled={addNewEmployeeMutation.isPending}
                    >
                      {addNewEmployeeMutation.isPending ? 'Добавление...' : 'Добавить'}
                    </button>
                  </div>
                </>
              )}

              {!isNewEmployee && (
                <button
                  onClick={() => {
                    setShowAddModal(false)
                    resetForm()
                  }}
                  className="btn-secondary w-full"
                >
                  Отмена
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Удаление сотрудника"
        message="Вы уверены, что хотите удалить этого сотрудника из клуба?"
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => selectedEmployeeId && deleteEmployeeMutation.mutate(selectedEmployeeId)}
        onCancel={() => {
          setShowDeleteModal(false)
          setSelectedEmployeeId(null)
        }}
      />

      <ConfirmModal
        isOpen={showAddRoleModal}
        title="Добавление роли"
        message={`Вы уверены, что хотите добавить роль "${selectedRole ? getRoleLabel(selectedRole) : ''}"?`}
        confirmText="Добавить"
        cancelText="Отмена"
        onConfirm={() => {
          if (selectedEmployeeId && selectedRole) {
            addRoleMutation.mutate({ employeeId: selectedEmployeeId, role: selectedRole })
          }
        }}
        onCancel={() => {
          setShowAddRoleModal(false)
          setSelectedEmployeeId(null)
          setSelectedRole(null)
        }}
      />

      <ConfirmModal
        isOpen={showDeleteRoleModal}
        title="Удаление роли"
        message={`Вы уверены, что хотите удалить роль "${selectedRole ? getRoleLabel(selectedRole) : ''}"?`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={() => {
          if (selectedEmployeeId && selectedRole) {
            deleteRoleMutation.mutate({ employeeId: selectedEmployeeId, role: selectedRole })
          }
        }}
        onCancel={() => {
          setShowDeleteRoleModal(false)
          setSelectedEmployeeId(null)
          setSelectedRole(null)
        }}
      />
    </div>
  )
}

export default HRManagementPage
