import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast from '@/components/Toast'

describe('Toast Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('отображает сообщение success', () => {
    render(<Toast message="Операция выполнена успешно" type="success" onClose={() => {}} />)

    expect(screen.getByText('Операция выполнена успешно')).toBeInTheDocument()
  })

  it('отображает сообщение error', () => {
    render(<Toast message="Произошла ошибка" type="error" onClose={() => {}} />)

    expect(screen.getByText('Произошла ошибка')).toBeInTheDocument()
  })

  it('отображает сообщение info', () => {
    render(<Toast message="Информационное сообщение" type="info" onClose={() => {}} />)

    expect(screen.getByText('Информационное сообщение')).toBeInTheDocument()
  })

  it('success toast имеет зеленую тему', () => {
    render(<Toast message="Success" type="success" onClose={() => {}} />)

    const toast = document.querySelector('.bg-green-50')
    expect(toast).toBeInTheDocument()
  })

  it('error toast имеет красную тему', () => {
    render(<Toast message="Error" type="error" onClose={() => {}} />)

    const toast = document.querySelector('.bg-red-50')
    expect(toast).toBeInTheDocument()
  })

  it('info toast имеет синюю тему', () => {
    render(<Toast message="Info" type="info" onClose={() => {}} />)

    const toast = document.querySelector('.bg-blue-50')
    expect(toast).toBeInTheDocument()
  })

  it('закрывается по клику на кнопку', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()
    const onClose = vi.fn()

    render(<Toast message="Сообщение" type="success" onClose={onClose} />)

    const closeButton = screen.getByRole('button')
    await user.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('автоматически закрывается через заданное время', () => {
    const onClose = vi.fn()

    render(<Toast message="Сообщение" type="success" onClose={onClose} duration={3000} />)

    expect(onClose).not.toHaveBeenCalled()

    // Ждем 3 секунды
    vi.advanceTimersByTime(3000)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('использует duration по умолчанию 5000ms', () => {
    const onClose = vi.fn()

    render(<Toast message="Сообщение" type="success" onClose={onClose} />)

    // После 4 секунд еще не должен закрыться
    vi.advanceTimersByTime(4000)
    expect(onClose).not.toHaveBeenCalled()

    // После 5 секунд должен закрыться
    vi.advanceTimersByTime(1000)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('не закрывается автоматически при duration=0', async () => {
    const onClose = vi.fn()

    render(<Toast message="Сообщение" type="success" onClose={onClose} duration={0} />)

    vi.advanceTimersByTime(10000)

    expect(onClose).not.toHaveBeenCalled()
  })

  it('содержит иконку для каждого типа', () => {
    const { rerender } = render(<Toast message="Test" type="success" onClose={() => {}} />)
    expect(document.querySelector('svg')).toBeInTheDocument()

    rerender(<Toast message="Test" type="error" onClose={() => {}} />)
    expect(document.querySelector('svg')).toBeInTheDocument()

    rerender(<Toast message="Test" type="info" onClose={() => {}} />)
    expect(document.querySelector('svg')).toBeInTheDocument()
  })

  it('позиционируется в правом верхнем углу', () => {
    render(<Toast message="Сообщение" type="success" onClose={() => {}} />)

    const toast = document.querySelector('.fixed.top-4.right-4')
    expect(toast).toBeInTheDocument()
  })
})
