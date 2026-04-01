import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchableSelect from '@/components/SearchableSelect'

const mockOptions = [
  { id: 1, name: 'Москва' },
  { id: 2, name: 'Санкт-Петербург' },
  { id: 3, name: 'Новосибирск' },
  { id: 4, name: 'Екатеринбург' },
  { id: 5, name: 'Нижний Новгород' },
]

describe('SearchableSelect Integration', () => {
  it('отображает placeholder когда значение не выбрано', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    expect(screen.getByText('Выберите город')).toBeInTheDocument()
  })

  it('отображает выбранное значение', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value={1}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    expect(screen.getByText('Москва')).toBeInTheDocument()
  })

  it('открывает dropdown при клике', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    // Проверяем, что все опции отображаются
    expect(screen.getByText('Москва')).toBeInTheDocument()
    expect(screen.getByText('Санкт-Петербург')).toBeInTheDocument()
    expect(screen.getByText('Новосибирск')).toBeInTheDocument()
  })

  it('фильтрует опции при поиске', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    const searchInput = screen.getByPlaceholderText('Поиск...')
    await user.type(searchInput, 'Ново')

    // Должен остаться только Новосибирск
    expect(screen.getByText('Новосибирск')).toBeInTheDocument()
    expect(screen.queryByText('Москва')).not.toBeInTheDocument()
    expect(screen.queryByText('Санкт-Петербург')).not.toBeInTheDocument()
  })

  it('вызывает onChange при выборе опции', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={onChange}
        placeholder="Выберите город"
        label="Город"
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    const option = screen.getByText('Санкт-Петербург')
    await user.click(option)

    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('закрывает dropdown после выбора', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    // Dropdown открыт
    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument()

    const option = screen.getByText('Москва')
    await user.click(option)

    // Dropdown закрыт - поле поиска больше не видно
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument()
    })
  })

  it('закрывает dropdown при клике вне компонента', async () => {
    const user = userEvent.setup()

    render(
      <div>
        <SearchableSelect
          options={mockOptions}
          value={null}
          onChange={() => {}}
          placeholder="Выберите город"
          label="Город"
        />
        <button data-testid="outside">Внешняя кнопка</button>
      </div>
    )

    const selectButton = screen.getByText('Выберите город')
    await user.click(selectButton)

    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument()

    const outsideButton = screen.getByTestId('outside')
    await user.click(outsideButton)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument()
    })
  })

  it('отображает сообщение когда ничего не найдено', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    const searchInput = screen.getByPlaceholderText('Поиск...')
    await user.type(searchInput, 'Несуществующий город')

    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
  })

  it('не открывается когда disabled', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
        disabled
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    // Dropdown не должен открыться
    expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument()
  })

  it('выделяет выбранную опцию в списке', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={2}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    // Клик на trigger чтобы открыть dropdown
    const triggerButton = screen.getByText('Санкт-Петербург')
    await user.click(triggerButton)

    // Находим кнопку с выбранной опцией в dropdown (у нее класс w-full)
    const optionButtons = screen.getAllByRole('button').filter(btn =>
      btn.classList.contains('w-full') && btn.textContent === 'Санкт-Петербург'
    )

    expect(optionButtons.length).toBeGreaterThan(0)
    expect(optionButtons[0]).toHaveClass('bg-primary-100')
  })

  it('поиск регистронезависимый', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    const searchInput = screen.getByPlaceholderText('Поиск...')
    await user.type(searchInput, 'МОСКВА')

    expect(screen.getByText('Москва')).toBeInTheDocument()
  })
})
