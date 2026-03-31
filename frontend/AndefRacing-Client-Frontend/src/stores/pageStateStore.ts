import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Получить текущую дату в формате YYYY-MM-DD
const getCurrentDate = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Добавить дни к дате
const addDaysToDate = (dateStr: string, days: number): string => {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  date.setDate(date.getDate() + days)

  const newYear = date.getFullYear()
  const newMonth = String(date.getMonth() + 1).padStart(2, '0')
  const newDay = String(date.getDate()).padStart(2, '0')
  return `${newYear}-${newMonth}-${newDay}`
}

interface BookingsPageState {
  startDate: string
  endDate: string
  currentPage: number
}

interface SearchPageState {
  selectedRegion: number | null
  selectedCity: number | null
  currentPage: number
}

interface FavoritesPageState {
  currentPage: number
}

interface PageStateStore {
  // Bookings page state
  bookingsPage: BookingsPageState
  setBookingsPageState: (state: Partial<BookingsPageState>) => void
  resetBookingsPageState: () => void

  // Search page state
  searchPage: SearchPageState
  setSearchPageState: (state: Partial<SearchPageState>) => void
  resetSearchPageState: () => void

  // Favorites page state
  favoritesPage: FavoritesPageState
  setFavoritesPageState: (state: Partial<FavoritesPageState>) => void
  resetFavoritesPageState: () => void
}

const getInitialBookingsState = (): BookingsPageState => {
  const currentDate = getCurrentDate()
  return {
    startDate: currentDate,
    endDate: addDaysToDate(currentDate, 7),
    currentPage: 0,
  }
}

const initialSearchState: SearchPageState = {
  selectedRegion: null,
  selectedCity: null,
  currentPage: 0,
}

const initialFavoritesState: FavoritesPageState = {
  currentPage: 0,
}

export const usePageStateStore = create<PageStateStore>()(
  persist(
    (set) => ({
      // Bookings page
      bookingsPage: getInitialBookingsState(),
      setBookingsPageState: (state) =>
        set((prev) => ({
          bookingsPage: { ...prev.bookingsPage, ...state },
        })),
      resetBookingsPageState: () =>
        set({ bookingsPage: getInitialBookingsState() }),

      // Search page
      searchPage: initialSearchState,
      setSearchPageState: (state) =>
        set((prev) => ({
          searchPage: { ...prev.searchPage, ...state },
        })),
      resetSearchPageState: () =>
        set({ searchPage: { ...initialSearchState } }),

      // Favorites page
      favoritesPage: initialFavoritesState,
      setFavoritesPageState: (state) =>
        set((prev) => ({
          favoritesPage: { ...prev.favoritesPage, ...state },
        })),
      resetFavoritesPageState: () =>
        set({ favoritesPage: { ...initialFavoritesState } }),
    }),
    {
      name: 'page-state-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
