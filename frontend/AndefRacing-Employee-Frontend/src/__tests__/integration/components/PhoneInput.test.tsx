import { describe, it, expect, vi, useState } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState as useReactState } from 'react'
import PhoneInput from '@/components/PhoneInput'

// Обертка для тестирования controlled компонента
const ControlledPhoneInput = ({ initialValue = '', ...props }: { initialValue?: string; onBlur?: () => void; className?: string; name?: string; placeholder?: string }) => {
  const [value, setValue] = useReactState(initialValue)
  return <PhoneInput value={value} onChange={setValue} {...props} />
}

describe('PhoneInput', () => {
  it('рендерится с placeholder по умолчанию', () => {
    render(<PhoneInput onChange={() => {}} />)

    expect(screen.getByPlaceholderText('+7-XXX-XXX-XX-XX')).toBeInTheDocument()
  })

  it('рендерится с кастомным placeholder', () => {
    render(<PhoneInput onChange={() => {}} placeholder="Введите номер" />)

    expect(screen.getByPlaceholderText('Введите номер')).toBeInTheDocument()
  })

  it('отображает переданное значение', () => {
    render(<PhoneInput value="+7-999-123-45-67" onChange={() => {}} />)

    expect(screen.getByDisplayValue('+7-999-123-45-67')).toBeInTheDocument()
  })

  it('форматирует ввод цифр в формат +7-XXX-XXX-XX-XX', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, '9991234567')

    expect(input).toHaveValue('+7-999-123-45-67')
  })

  it('заменяет 8 на +7 в начале номера', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, '89991234567')

    // 8 заменяется на +7, поэтому первая 9 становится частью номера
    expect(input).toHaveValue('+7-999-123-45-67')
  })

  it('автоматически добавляет +7 к номеру', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, '999')

    expect(input).toHaveValue('+7-999')
  })

  it('ограничивает длину номера до 10 цифр после +7', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, '99912345678901234567')

    // Должен быть только 10 цифр после +7
    expect(input).toHaveValue('+7-999-123-45-67')
  })

  it('удаляет нецифровые символы кроме +', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'abc999def123')

    expect(input).toHaveValue('+7-999-123')
  })

  it('вызывает onBlur при потере фокуса', async () => {
    const user = userEvent.setup()
    const onBlur = vi.fn()

    render(<ControlledPhoneInput onBlur={onBlur} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.tab()

    expect(onBlur).toHaveBeenCalled()
  })

  it('применяет переданный className', () => {
    render(<PhoneInput onChange={() => {}} className="custom-class" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-class')
  })

  it('применяет класс input по умолчанию', () => {
    render(<PhoneInput onChange={() => {}} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('input')
  })

  it('имеет правильный атрибут name', () => {
    render(<PhoneInput onChange={() => {}} name="phone" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('name', 'phone')
  })

  it('имеет type="text"', () => {
    render(<PhoneInput onChange={() => {}} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('возвращает пустую строку при вводе только +7', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, '+7')

    // После ввода только +7 без цифр должна вернуться пустая строка
    expect(input).toHaveValue('')
  })

  it('корректно обрабатывает номер начинающийся с 7', async () => {
    const user = userEvent.setup()

    render(<ControlledPhoneInput />)

    const input = screen.getByRole('textbox')
    await user.type(input, '7999123')

    expect(input).toHaveValue('+7-999-123')
  })
})
