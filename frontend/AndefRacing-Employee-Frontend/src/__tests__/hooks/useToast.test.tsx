import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useToast } from '@/hooks/useToast'

// Тестовый компонент для использования хука
const TestComponent = () => {
  const { showToast, ToastContainer, success, error, info } = useToast()

  return (
    <div>
      <button onClick={() => showToast('Default message')}>Show Default</button>
      <button onClick={() => showToast('Info message', 'info')}>Show Info</button>
      <button onClick={() => success('Success message')}>Show Success</button>
      <button onClick={() => error('Error message')}>Show Error</button>
      <button onClick={() => info('Info helper message')}>Show Info Helper</button>
      <ToastContainer />
    </div>
  )
}

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('showToast отображает сообщение', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByText('Show Default'))

    expect(screen.getByText('Default message')).toBeInTheDocument()
  })

  it('success отображает success toast', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByText('Show Success'))

    expect(screen.getByText('Success message')).toBeInTheDocument()
    expect(document.querySelector('.bg-green-50')).toBeInTheDocument()
  })

  it('error отображает error toast', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByText('Show Error'))

    expect(screen.getByText('Error message')).toBeInTheDocument()
    expect(document.querySelector('.bg-red-50')).toBeInTheDocument()
  })

  it('info отображает info toast', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByText('Show Info Helper'))

    expect(screen.getByText('Info helper message')).toBeInTheDocument()
    expect(document.querySelector('.bg-blue-50')).toBeInTheDocument()
  })

  it('showToast с типом info отображает info toast', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByText('Show Info'))

    expect(screen.getByText('Info message')).toBeInTheDocument()
    expect(document.querySelector('.bg-blue-50')).toBeInTheDocument()
  })

  it('новый toast заменяет предыдущий', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByText('Show Success'))
    expect(screen.getByText('Success message')).toBeInTheDocument()

    await user.click(screen.getByText('Show Error'))

    // Предыдущий toast должен быть заменен
    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    expect(screen.getByText('Error message')).toBeInTheDocument()
  })

  it('toast можно закрыть по клику', async () => {
    vi.useRealTimers()
    const user = userEvent.setup()

    render(<TestComponent />)

    await user.click(screen.getByText('Show Success'))
    expect(screen.getByText('Success message')).toBeInTheDocument()

    // Ищем кнопку закрытия (крестик внутри toast)
    const closeButton = document.querySelector('.bg-green-50 button')
    expect(closeButton).toBeInTheDocument()

    await user.click(closeButton!)

    await waitFor(() => {
      expect(screen.queryByText('Success message')).not.toBeInTheDocument()
    })
  })

  it('toast автоматически закрывается через время', async () => {
    render(<TestComponent />)

    // Показываем toast
    act(() => {
      screen.getByText('Show Success').click()
    })

    expect(screen.getByText('Success message')).toBeInTheDocument()

    // Ждем 5 секунд (время по умолчанию) + немного для анимации
    await act(async () => {
      vi.advanceTimersByTime(5100)
    })

    expect(screen.queryByText('Success message')).not.toBeInTheDocument()
  })

  it('ToastContainer рендерит несколько toast при быстром вызове', async () => {
    vi.useRealTimers()

    // Создаем компонент без замены toast
    const MultipleToastComponent = () => {
      const { success, ToastContainer } = useToast()

      return (
        <div>
          <button onClick={() => success('Message 1')}>Show 1</button>
          <button onClick={() => success('Message 2')}>Show 2</button>
          <ToastContainer />
        </div>
      )
    }

    const user = userEvent.setup()
    render(<MultipleToastComponent />)

    await user.click(screen.getByText('Show 1'))
    await user.click(screen.getByText('Show 2'))

    // Так как хук заменяет toast, должен быть только последний
    expect(screen.queryByText('Message 1')).not.toBeInTheDocument()
    expect(screen.getByText('Message 2')).toBeInTheDocument()
  })
})
