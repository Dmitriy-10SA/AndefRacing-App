import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Pagination from '@/components/Pagination'

describe('Pagination Integration', () => {
  it('не отображается при одной странице', () => {
    const { container } = render(
      <Pagination currentPage={0} totalPages={1} onPageChange={() => {}} />
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('отображает все номера страниц', () => {
    render(
      <Pagination currentPage={0} totalPages={5} onPageChange={() => {}} />
    )

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('кнопка "Назад" disabled на первой странице', () => {
    render(
      <Pagination currentPage={0} totalPages={5} onPageChange={() => {}} />
    )

    const backButton = screen.getByText('Назад')
    expect(backButton).toBeDisabled()
  })

  it('кнопка "Вперед" disabled на последней странице', () => {
    render(
      <Pagination currentPage={4} totalPages={5} onPageChange={() => {}} />
    )

    const forwardButton = screen.getByText('Вперед')
    expect(forwardButton).toBeDisabled()
  })

  it('вызывает onPageChange при клике на номер страницы', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination currentPage={0} totalPages={5} onPageChange={onPageChange} />
    )

    await user.click(screen.getByText('3'))

    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('вызывает onPageChange при клике на "Вперед"', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />
    )

    await user.click(screen.getByText('Вперед'))

    expect(onPageChange).toHaveBeenCalledWith(3)
  })

  it('вызывает onPageChange при клике на "Назад"', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />
    )

    await user.click(screen.getByText('Назад'))

    expect(onPageChange).toHaveBeenCalledWith(1)
  })

  it('текущая страница визуально выделена', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />
    )

    const currentPageButton = screen.getByText('3')
    expect(currentPageButton).toHaveClass('bg-primary-600', 'text-white')
  })

  it('некущие страницы имеют стандартный стиль', () => {
    render(
      <Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />
    )

    const otherPageButton = screen.getByText('1')
    expect(otherPageButton).toHaveClass('bg-gray-200')
    expect(otherPageButton).not.toHaveClass('bg-primary-600')
  })

  it('навигация работает корректно от начала до конца', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()

    const { rerender } = render(
      <Pagination currentPage={0} totalPages={3} onPageChange={onPageChange} />
    )

    // Первая страница - Назад disabled
    expect(screen.getByText('Назад')).toBeDisabled()
    expect(screen.getByText('Вперед')).not.toBeDisabled()

    // Клик на Вперед
    await user.click(screen.getByText('Вперед'))
    expect(onPageChange).toHaveBeenCalledWith(1)

    // Перерендерим на 2 страницу
    rerender(
      <Pagination currentPage={1} totalPages={3} onPageChange={onPageChange} />
    )

    // Средняя страница - обе кнопки активны
    expect(screen.getByText('Назад')).not.toBeDisabled()
    expect(screen.getByText('Вперед')).not.toBeDisabled()

    // Перейдем на последнюю
    rerender(
      <Pagination currentPage={2} totalPages={3} onPageChange={onPageChange} />
    )

    // Последняя страница - Вперед disabled
    expect(screen.getByText('Назад')).not.toBeDisabled()
    expect(screen.getByText('Вперед')).toBeDisabled()
  })
})
