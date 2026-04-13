import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/authApi'
import { useAuthStore } from '../../stores/authStore'
import { ClientRegisterDto } from '../../types'
import ErrorMessage from '../../components/ErrorMessage'
import PhoneInput from '../../components/PhoneInput'
import PasswordInput from '../../components/PasswordInput'

interface RegisterFormData extends ClientRegisterDto {
  confirmPassword: string
  personalDataConsent: boolean
}

const RegisterPage = () => {
  const navigate = useNavigate()
  const setToken = useAuthStore((state) => state.setToken)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>()

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setToken(data.jwt)
      navigate('/search')
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Ошибка регистрации'
      setErrorMessage(message)
    },
  })

  const password = watch('password')

  const onSubmit = (data: RegisterFormData) => {
    setErrorMessage('')
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword, personalDataConsent, ...registerData } = data
    registerMutation.mutate(registerData)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AndefRacing</h1>
          <p className="mt-2 text-gray-600">Регистрация</p>
        </div>

        <div className="card">
          {errorMessage && (
            <div className="mb-4">
              <ErrorMessage message={errorMessage} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Имя</label>
              <input
                type="text"
                className="input"
                {...register('name', {
                  required: 'Имя обязательно',
                  maxLength: {
                    value: 100,
                    message: 'Имя не должно превышать 100 символов',
                  },
                })}
              />
              {errors.name && (
                <p className="error-text">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Номер телефона</label>
              <Controller
                name="phone"
                control={control}
                rules={{
                  required: 'Номер телефона обязателен',
                  pattern: {
                    value: /^\+7-\d{3}-\d{3}-\d{2}-\d{2}$/,
                    message: 'Формат: +7-XXX-XXX-XX-XX',
                  },
                }}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                )}
              />
              {errors.phone && (
                <p className="error-text">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="label">Пароль</label>
              <PasswordInput
                {...register('password', {
                  required: 'Пароль обязателен',
                  minLength: {
                    value: 8,
                    message: 'Пароль должен содержать не менее 8 символов',
                  },
                  pattern: {
                    value: /^(?=.*[a-zа-я])(?=.*[A-ZА-Я])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{}|;:',.<>/?]).+$/,
                    message: 'Пароль должен содержать заглавную букву, цифру и спецсимвол',
                  },
                })}
              />
              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Минимум 8 символов, включая заглавную букву, цифру и спецсимвол
              </p>
            </div>

            <div>
              <label className="label">Подтвердите пароль</label>
              <PasswordInput
                {...register('confirmPassword', {
                  required: 'Подтверждение пароля обязательно',
                  validate: (value) =>
                    value === password || 'Пароли не совпадают',
                })}
              />
              {errors.confirmPassword && (
                <p className="error-text">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="personalDataConsent"
                className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                {...register('personalDataConsent', {
                  required: 'Необходимо согласие на обработку персональных данных',
                })}
              />
              <label htmlFor="personalDataConsent" className="ml-2 text-sm text-gray-600">
                Я даю согласие на обработку моих персональных данных в соответствии с{' '}
                <a
                  href="https://www.consultant.ru/document/cons_doc_LAW_61801/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  Федеральным законом №152-ФЗ «О персональных данных»
                </a>
              </label>
            </div>
            {errors.personalDataConsent && (
              <p className="error-text">{errors.personalDataConsent.message}</p>
            )}

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="btn-primary w-full"
            >
              {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/auth/login"
              className="text-primary-600 hover:text-primary-700"
            >
              Уже есть аккаунт? Войти
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage
