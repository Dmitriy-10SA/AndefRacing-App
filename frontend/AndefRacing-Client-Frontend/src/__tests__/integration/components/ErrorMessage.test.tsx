import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorMessage from '@/components/ErrorMessage'

describe('ErrorMessage', () => {
  it('отображает переданное сообщение', () => {
    render(<ErrorMessage message="Произошла ошибка" />)

    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument()
  })

  it('отображает длинное сообщение об ошибке', () => {
    const longMessage = 'Это очень длинное сообщение об ошибке, которое может возникнуть при различных ситуациях в приложении'
    render(<ErrorMessage message={longMessage} />)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  it('имеет красную тему оформления', () => {
    render(<ErrorMessage message="Ошибка" />)

    const container = document.querySelector('.bg-red-50')
    expect(container).toBeInTheDocument()
    expect(container).toHaveClass('border-red-200', 'text-red-800')
  })

  it('отображает сообщение в теге p', () => {
    render(<ErrorMessage message="Тестовая ошибка" />)

    const paragraph = screen.getByText('Тестовая ошибка')
    expect(paragraph.tagName).toBe('P')
  })

  it('имеет правильную структуру стилей', () => {
    render(<ErrorMessage message="Ошибка" />)

    const container = document.querySelector('.bg-red-50')
    expect(container).toHaveClass('px-4', 'py-3', 'rounded-lg', 'border')
  })

  it('корректно обрабатывает специальные символы', () => {
    render(<ErrorMessage message="Ошибка: <script>alert('xss')</script>" />)

    expect(screen.getByText("Ошибка: <script>alert('xss')</script>")).toBeInTheDocument()
  })

  it('корректно отображает пустое сообщение', () => {
    render(<ErrorMessage message="" />)

    const paragraph = document.querySelector('p')
    expect(paragraph).toBeInTheDocument()
    expect(paragraph).toHaveTextContent('')
  })
})
