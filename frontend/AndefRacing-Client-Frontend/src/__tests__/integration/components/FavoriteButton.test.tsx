import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FavoriteButton from '@/components/FavoriteButton'

describe('FavoriteButton Integration', () => {
  it('отображает пустое сердце когда не в избранном', () => {
    render(<FavoriteButton isFavorite={false} onClick={() => {}} />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Добавить в избранное')
    expect(button).toHaveClass('bg-gray-100', 'text-gray-400')
  })

  it('отображает заполненное сердце когда в избранном', () => {
    render(<FavoriteButton isFavorite={true} onClick={() => {}} />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('title', 'Удалить из избранного')
    expect(button).toHaveClass('bg-red-100', 'text-red-600')
  })

  it('вызывает onClick при клике', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<FavoriteButton isFavorite={false} onClick={onClick} />)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('передает event в onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<FavoriteButton isFavorite={false} onClick={onClick} />)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalledWith(expect.any(Object))
  })

  it('disabled когда disabled=true', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<FavoriteButton isFavorite={false} onClick={onClick} disabled />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('применяет кастомный className', () => {
    render(
      <FavoriteButton
        isFavorite={false}
        onClick={() => {}}
        className="my-custom-class"
      />
    )

    const button = screen.getByRole('button')
    expect(button).toHaveClass('my-custom-class')
  })

  it('переключает состояние при клике', async () => {
    const user = userEvent.setup()
    let isFavorite = false
    const onClick = vi.fn(() => {
      isFavorite = !isFavorite
    })

    const { rerender } = render(
      <FavoriteButton isFavorite={isFavorite} onClick={onClick} />
    )

    // Изначально не в избранном
    expect(screen.getByRole('button')).toHaveAttribute('title', 'Добавить в избранное')

    await user.click(screen.getByRole('button'))

    // Перерендерим с новым состоянием
    rerender(<FavoriteButton isFavorite={isFavorite} onClick={onClick} />)

    expect(screen.getByRole('button')).toHaveAttribute('title', 'Удалить из избранного')
  })

  it('предотвращает всплытие события при необходимости', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn((e: React.MouseEvent) => {
      e.stopPropagation()
    })
    const parentClick = vi.fn()

    render(
      <div onClick={parentClick}>
        <FavoriteButton isFavorite={false} onClick={onClick} />
      </div>
    )

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalled()
    // Событие не должно всплыть к родителю
    expect(parentClick).not.toHaveBeenCalled()
  })
})
