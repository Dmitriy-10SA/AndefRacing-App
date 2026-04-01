import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import PhoneInput from '@/components/PhoneInput'

// Обертка для тестирования controlled компонента
const ControlledPhoneInput = ({ initialValue = '', ...props }: { initialValue?: string; onBlur?: () => void; className?: string }) => {
  const [value, setValue] = useState(initialValue)
  return <PhoneInput value={value} onChange={setValue} {...props} />
}

describe('PhoneInput Integration', () => {
  it('форматирует ввод телефона корректно', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')

    await user.type(input, '9991234567')

    expect(input).toHaveValue('+7-999-123-45-67')
  })

  it('заменяет 8 на +7 в начале номера', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')

    await user.type(input, '89991234567')

    expect(input).toHaveValue('+7-999-123-45-67')
  })

  it('обрабатывает вставку номера с разными форматами', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(<PhoneInput value="" onChange={onChange} />)

    const input = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')

    // Имитируем вставку номера
    await user.click(input)
    await user.paste('+7 (999) 123-45-67')

    expect(onChange).toHaveBeenLastCalledWith('+7-999-123-45-67')
  })

  it('ограничивает длину номера до 10 цифр после +7', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')

    await user.type(input, '99912345678901234')

    // Номер должен быть обрезан до 10 цифр после +7
    expect(input).toHaveValue('+7-999-123-45-67')
  })

  it('отображает переданное значение', () => {
    const onChange = vi.fn()

    render(<PhoneInput value="+7-999-123-45-67" onChange={onChange} />)

    const input = screen.getByDisplayValue('+7-999-123-45-67')
    expect(input).toBeInTheDocument()
  })

  it('вызывает onBlur при потере фокуса', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    const onBlur = vi.fn()

    render(<PhoneInput value="" onChange={onChange} onBlur={onBlur} />)

    const input = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')

    await user.click(input)
    await user.tab()

    expect(onBlur).toHaveBeenCalled()
  })

  it('применяет кастомный className', () => {
    const onChange = vi.fn()

    render(
      <PhoneInput value="" onChange={onChange} className="custom-class" />
    )

    const input = screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')
    expect(input).toHaveClass('custom-class')
  })
})
