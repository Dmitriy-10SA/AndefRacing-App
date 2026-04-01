import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LoadingSpinner from '@/components/LoadingSpinner'

describe('LoadingSpinner', () => {
  it('рендерится без ошибок', () => {
    const { container } = render(<LoadingSpinner />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('содержит анимированный элемент', () => {
    render(<LoadingSpinner />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('имеет круглую форму', () => {
    render(<LoadingSpinner />)

    const spinner = document.querySelector('.rounded-full')
    expect(spinner).toBeInTheDocument()
  })

  it('использует primary цвет', () => {
    render(<LoadingSpinner />)

    const spinner = document.querySelector('.border-primary-600')
    expect(spinner).toBeInTheDocument()
  })

  it('центрируется на странице', () => {
    render(<LoadingSpinner />)

    const container = document.querySelector('.flex.justify-center.items-center')
    expect(container).toBeInTheDocument()
  })

  it('имеет правильные размеры', () => {
    render(<LoadingSpinner />)

    const spinner = document.querySelector('.h-12.w-12')
    expect(spinner).toBeInTheDocument()
  })

  it('имеет отступы для вертикального позиционирования', () => {
    render(<LoadingSpinner />)

    const container = document.querySelector('.py-12')
    expect(container).toBeInTheDocument()
  })

  it('имеет border-b-2 для эффекта вращения', () => {
    render(<LoadingSpinner />)

    const spinner = document.querySelector('.border-b-2')
    expect(spinner).toBeInTheDocument()
  })
})
