import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PasswordInput from '@/components/PasswordInput'

describe('PasswordInput Integration', () => {
  it('по умолчанию скрывает пароль', () => {
    render(<PasswordInput />)

    const input = document.querySelector('input')!
    expect(input).toHaveAttribute('type', 'password')
  })

  it('показывает пароль при клике на иконку глаза', async () => {
    const user = userEvent.setup()

    render(<PasswordInput value="secret123" onChange={() => {}} />)

    const input = document.querySelector('input')!
    expect(input).toHaveAttribute('type', 'password')

    // Кликаем на кнопку показа пароля
    const toggleButton = screen.getByRole('button')
    await user.click(toggleButton)

    expect(input).toHaveAttribute('type', 'text')
  })

  it('скрывает пароль при повторном клике на иконку', async () => {
    const user = userEvent.setup()

    render(<PasswordInput value="secret123" onChange={() => {}} />)

    const input = document.querySelector('input')!
    const toggleButton = screen.getByRole('button')

    // Показываем пароль
    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'text')

    // Скрываем пароль
    await user.click(toggleButton)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('вызывает onChange при вводе', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<PasswordInput onChange={onChange} />)

    const input = document.querySelector('input')!
    await user.type(input, 'newpassword')

    expect(onChange).toHaveBeenCalled()
  })

  it('вызывает onBlur при потере фокуса', async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()

    render(<PasswordInput onBlur={onBlur} />)

    const input = document.querySelector('input')!
    await user.click(input)
    await user.tab()

    expect(onBlur).toHaveBeenCalled()
  })

  it('отображает переданное значение', () => {
    render(<PasswordInput value="myPassword123" onChange={() => {}} />)

    const input = document.querySelector('input')!
    expect(input).toHaveValue('myPassword123')
  })

  it('применяет кастомный className', () => {
    render(<PasswordInput className="custom-password-class" />)

    const input = document.querySelector('input')!
    expect(input).toHaveClass('custom-password-class')
  })

  it('кнопка переключения имеет tabIndex -1', () => {
    render(<PasswordInput />)

    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toHaveAttribute('tabIndex', '-1')
  })
})
