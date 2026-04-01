import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PasswordInput from '@/components/PasswordInput'

// Хелпер для получения input элемента
const getPasswordInput = (container: HTMLElement) => {
  return container.querySelector('input') as HTMLInputElement
}

describe('PasswordInput Component (Employee)', () => {
  it('отображает input с типом password по умолчанию', () => {
    render(<PasswordInput placeholder="Введите пароль" />)

    const input = screen.getByPlaceholderText('Введите пароль')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'password')
  })

  it('отображает иконку глаза для показа пароля', () => {
    render(<PasswordInput />)

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('type', 'button')
  })

  it('переключает видимость пароля при клике на иконку', async () => {
    const user = userEvent.setup()
    render(<PasswordInput placeholder="Пароль" />)

    const input = screen.getByPlaceholderText('Пароль')
    const toggleButton = screen.getByRole('button')

    // По умолчанию тип password
    expect(input).toHaveAttribute('type', 'password')

    // Кликаем - показываем пароль
    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')

    // Кликаем еще раз - скрываем пароль
    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('вызывает onChange при вводе текста', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    const { container } = render(<PasswordInput placeholder="Пароль" onChange={handleChange} />)

    const input = screen.getByPlaceholderText('Пароль')
    await user.type(input, 'test123')

    expect(handleChange).toHaveBeenCalled()
  })

  it('вызывает onBlur при потере фокуса', async () => {
    const user = userEvent.setup()
    const handleBlur = vi.fn()

    render(<PasswordInput placeholder="Пароль" onBlur={handleBlur} />)

    const input = screen.getByPlaceholderText('Пароль')
    await user.click(input)
    await user.tab()

    expect(handleBlur).toHaveBeenCalled()
  })

  it('отображает значение value', () => {
    const { container } = render(<PasswordInput value="mypassword" onChange={vi.fn()} />)

    const input = getPasswordInput(container)
    expect(input.value).toBe('mypassword')
  })

  it('применяет кастомный className', () => {
    const { container } = render(<PasswordInput className="custom-class" />)

    const input = getPasswordInput(container)
    expect(input).toHaveClass('custom-class')
  })

  it('применяет дефолтный класс input', () => {
    const { container } = render(<PasswordInput />)

    const input = getPasswordInput(container)
    expect(input).toHaveClass('input')
  })

  it('устанавливает атрибут name', () => {
    const { container } = render(<PasswordInput name="password" />)

    const input = getPasswordInput(container)
    expect(input).toHaveAttribute('name', 'password')
  })

  it('кнопка переключения не участвует в табуляции', () => {
    render(<PasswordInput />)

    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toHaveAttribute('tabIndex', '-1')
  })

  it('работает с ref', () => {
    const ref = { current: null as HTMLInputElement | null }

    const TestComponent = () => {
      return <PasswordInput ref={ref} />
    }

    render(<TestComponent />)

    expect(ref.current).toBeInstanceOf(HTMLInputElement)
  })
})
