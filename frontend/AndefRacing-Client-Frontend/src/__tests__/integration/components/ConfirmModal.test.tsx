import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ConfirmModal from '@/components/ConfirmModal'

describe('ConfirmModal Integration', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Подтверждение действия',
    message: 'Вы уверены, что хотите выполнить это действие?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  it('не отображается когда isOpen=false', () => {
    render(<ConfirmModal {...defaultProps} isOpen={false} />)

    expect(screen.queryByText('Подтверждение действия')).not.toBeInTheDocument()
  })

  it('отображает заголовок и сообщение', () => {
    render(<ConfirmModal {...defaultProps} />)

    expect(screen.getByText('Подтверждение действия')).toBeInTheDocument()
    expect(screen.getByText('Вы уверены, что хотите выполнить это действие?')).toBeInTheDocument()
  })

  it('отображает кнопки с дефолтными текстами', () => {
    render(<ConfirmModal {...defaultProps} />)

    expect(screen.getByText('Подтвердить')).toBeInTheDocument()
    expect(screen.getByText('Отмена')).toBeInTheDocument()
  })

  it('отображает кастомные тексты кнопок', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        confirmText="Удалить"
        cancelText="Не удалять"
      />
    )

    expect(screen.getByText('Удалить')).toBeInTheDocument()
    expect(screen.getByText('Не удалять')).toBeInTheDocument()
  })

  it('вызывает onConfirm при клике на кнопку подтверждения', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()

    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />)

    await user.click(screen.getByText('Подтвердить'))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('вызывает onCancel при клике на кнопку отмены', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()

    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByText('Отмена'))

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('показывает "Загрузка..." когда isLoading=true', () => {
    render(<ConfirmModal {...defaultProps} isLoading />)

    expect(screen.getByText('Загрузка...')).toBeInTheDocument()
    expect(screen.queryByText('Подтвердить')).not.toBeInTheDocument()
  })

  it('кнопки disabled когда isLoading=true', () => {
    render(<ConfirmModal {...defaultProps} isLoading />)

    expect(screen.getByText('Загрузка...')).toBeDisabled()
    expect(screen.getByText('Отмена')).toBeDisabled()
  })

  it('модальное окно блокирует взаимодействие с фоном', () => {
    render(<ConfirmModal {...defaultProps} />)

    // Проверяем, что есть оверлей
    const overlay = document.querySelector('.fixed.inset-0')
    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveClass('bg-black', 'bg-opacity-50')
  })

  it('содержимое отображается в карточке по центру', () => {
    render(<ConfirmModal {...defaultProps} />)

    const card = document.querySelector('.bg-white.rounded-lg')
    expect(card).toBeInTheDocument()
  })

  it('работает с различными сценариями подтверждения', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    const onCancel = vi.fn()

    // Сценарий удаления бронирования
    render(
      <ConfirmModal
        isOpen={true}
        title="Отмена бронирования"
        message="Вы действительно хотите отменить бронирование? Это действие нельзя отменить."
        onConfirm={onConfirm}
        onCancel={onCancel}
        confirmText="Да, отменить"
        cancelText="Нет, оставить"
      />
    )

    expect(screen.getByText('Отмена бронирования')).toBeInTheDocument()
    expect(screen.getByText(/Вы действительно хотите отменить бронирование/)).toBeInTheDocument()

    await user.click(screen.getByText('Да, отменить'))
    expect(onConfirm).toHaveBeenCalled()
  })
})
