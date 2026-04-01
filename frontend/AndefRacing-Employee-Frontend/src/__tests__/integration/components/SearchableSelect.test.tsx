import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchableSelect from '@/components/SearchableSelect'

const mockOptions = [
  { id: 1, name: 'Москва' },
  { id: 2, name: 'Санкт-Петербург' },
  { id: 3, name: 'Новосибирск' },
  { id: 4, name: 'Екатеринбург' },
]

describe('SearchableSelect', () => {
  it('отображает label', () => {
    render(
      <SearchableSelect
        options={mockOptions}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    expect(screen.getByText('Город')).toBeInTheDocument()
  })

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

  it('открывает выпадающий список при клике', async () => {
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

    expect(screen.getByPlaceholderText('Поиск...')).toBeInTheDocument()
    mockOptions.forEach((option) => {
      expect(screen.getByText(option.name)).toBeInTheDocument()
    })
  })

  it('фильтрует опции по поисковому запросу', async () => {
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
    await user.type(searchInput, 'Москва')

    expect(screen.getByText('Москва')).toBeInTheDocument()
    expect(screen.queryByText('Санкт-Петербург')).not.toBeInTheDocument()
    expect(screen.queryByText('Новосибирск')).not.toBeInTheDocument()
  })

  it('фильтрует опции без учета регистра', async () => {
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
    await user.type(searchInput, 'москва')

    expect(screen.getByText('Москва')).toBeInTheDocument()
  })

  it('показывает сообщение когда ничего не найдено', async () => {
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

  it('закрывает выпадающий список после выбора', async () => {
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

    const option = screen.getByText('Москва')
    await user.click(option)

    await waitFor(() => {
      expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument()
    })
  })

  it('очищает поиск после выбора', async () => {
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
    await user.type(searchInput, 'Мос')

    const option = screen.getByText('Москва')
    await user.click(option)

    // Открываем снова и проверяем что поиск очищен
    await user.click(button)

    const newSearchInput = screen.getByPlaceholderText('Поиск...')
    expect(newSearchInput).toHaveValue('')
  })

  it('disabled состояние блокирует открытие', async () => {
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

    expect(screen.queryByPlaceholderText('Поиск...')).not.toBeInTheDocument()
  })

  it('disabled кнопка имеет соответствующие стили', () => {
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
    expect(button).toBeDisabled()
  })

  it('закрывается при клике вне компонента', async () => {
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
        <button data-testid="outside">Outside</button>
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

  it('выделяет выбранную опцию в списке', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={mockOptions}
        value={1}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    // Открываем dropdown
    const trigger = screen.getByText('Москва')
    await user.click(trigger)

    // Ищем кнопку опции в dropdown (у нее класс w-full)
    const optionButtons = screen.getAllByRole('button').filter(btn =>
      btn.classList.contains('w-full') && btn.textContent === 'Москва'
    )

    expect(optionButtons.length).toBeGreaterThan(0)
    expect(optionButtons[0]).toHaveClass('bg-primary-100')
  })

  it('поворачивает иконку при открытии', async () => {
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

    const svg = document.querySelector('svg')
    expect(svg).toHaveClass('rotate-180')
  })

  it('фокусирует поле поиска при открытии', async () => {
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
    expect(searchInput).toHaveFocus()
  })

  it('обрабатывает пустой массив опций', async () => {
    const user = userEvent.setup()

    render(
      <SearchableSelect
        options={[]}
        value={null}
        onChange={() => {}}
        placeholder="Выберите город"
        label="Город"
      />
    )

    const button = screen.getByRole('button')
    await user.click(button)

    expect(screen.getByText('Ничего не найдено')).toBeInTheDocument()
  })
})
