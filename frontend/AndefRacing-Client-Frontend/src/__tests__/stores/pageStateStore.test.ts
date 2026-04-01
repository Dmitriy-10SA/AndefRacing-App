import { describe, it, expect, beforeEach, vi } from 'vitest'
import { usePageStateStore } from '@/stores/pageStateStore'

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock })

describe('pageStateStore', () => {
  beforeEach(() => {
    sessionStorageMock.clear()
  })

  describe('bookingsPage', () => {
    beforeEach(() => {
      usePageStateStore.getState().resetBookingsPageState()
    })

    describe('initial state', () => {
      it('should have startDate set to today', () => {
        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })

      it('should have endDate set to 7 days from today', () => {
        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)

        // Verify endDate is after startDate
        const start = new Date(bookingsPage.startDate)
        const end = new Date(bookingsPage.endDate)
        expect(end.getTime()).toBeGreaterThan(start.getTime())
      })

      it('should have currentPage set to 0', () => {
        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.currentPage).toBe(0)
      })
    })

    describe('setBookingsPageState', () => {
      it('should update partial state', () => {
        const { setBookingsPageState } = usePageStateStore.getState()

        setBookingsPageState({ currentPage: 5 })

        expect(usePageStateStore.getState().bookingsPage.currentPage).toBe(5)
      })

      it('should update multiple fields', () => {
        const { setBookingsPageState } = usePageStateStore.getState()

        setBookingsPageState({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          currentPage: 2,
        })

        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.startDate).toBe('2024-01-01')
        expect(bookingsPage.endDate).toBe('2024-01-31')
        expect(bookingsPage.currentPage).toBe(2)
      })

      it('should preserve unchanged fields', () => {
        const { setBookingsPageState } = usePageStateStore.getState()
        const originalStartDate = usePageStateStore.getState().bookingsPage.startDate

        setBookingsPageState({ currentPage: 3 })

        expect(usePageStateStore.getState().bookingsPage.startDate).toBe(originalStartDate)
      })
    })

    describe('resetBookingsPageState', () => {
      it('should reset to initial state', () => {
        const { setBookingsPageState, resetBookingsPageState } = usePageStateStore.getState()

        // Modify state
        setBookingsPageState({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          currentPage: 10,
        })

        // Reset
        resetBookingsPageState()

        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.currentPage).toBe(0)
        expect(bookingsPage.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  })

  describe('searchPage', () => {
    beforeEach(() => {
      usePageStateStore.getState().resetSearchPageState()
    })

    describe('initial state', () => {
      it('should have selectedRegion as null', () => {
        const { searchPage } = usePageStateStore.getState()
        expect(searchPage.selectedRegion).toBeNull()
      })

      it('should have selectedCity as null', () => {
        const { searchPage } = usePageStateStore.getState()
        expect(searchPage.selectedCity).toBeNull()
      })

      it('should have currentPage set to 0', () => {
        const { searchPage } = usePageStateStore.getState()
        expect(searchPage.currentPage).toBe(0)
      })
    })

    describe('setSearchPageState', () => {
      it('should update selected region', () => {
        const { setSearchPageState } = usePageStateStore.getState()

        setSearchPageState({ selectedRegion: 1 })

        expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)
      })

      it('should update selected city', () => {
        const { setSearchPageState } = usePageStateStore.getState()

        setSearchPageState({ selectedCity: 5 })

        expect(usePageStateStore.getState().searchPage.selectedCity).toBe(5)
      })

      it('should update multiple fields', () => {
        const { setSearchPageState } = usePageStateStore.getState()

        setSearchPageState({
          selectedRegion: 1,
          selectedCity: 10,
          currentPage: 2,
        })

        const { searchPage } = usePageStateStore.getState()
        expect(searchPage.selectedRegion).toBe(1)
        expect(searchPage.selectedCity).toBe(10)
        expect(searchPage.currentPage).toBe(2)
      })

      it('should preserve unchanged fields', () => {
        const { setSearchPageState } = usePageStateStore.getState()

        setSearchPageState({ selectedRegion: 1 })
        setSearchPageState({ currentPage: 5 })

        const { searchPage } = usePageStateStore.getState()
        expect(searchPage.selectedRegion).toBe(1)
        expect(searchPage.currentPage).toBe(5)
      })
    })

    describe('resetSearchPageState', () => {
      it('should reset to initial state', () => {
        const { setSearchPageState, resetSearchPageState } = usePageStateStore.getState()

        // Modify state
        setSearchPageState({
          selectedRegion: 1,
          selectedCity: 10,
          currentPage: 5,
        })

        // Reset
        resetSearchPageState()

        const { searchPage } = usePageStateStore.getState()
        expect(searchPage.selectedRegion).toBeNull()
        expect(searchPage.selectedCity).toBeNull()
        expect(searchPage.currentPage).toBe(0)
      })
    })
  })

  describe('favoritesPage', () => {
    beforeEach(() => {
      usePageStateStore.getState().resetFavoritesPageState()
    })

    describe('initial state', () => {
      it('should have currentPage set to 0', () => {
        const { favoritesPage } = usePageStateStore.getState()
        expect(favoritesPage.currentPage).toBe(0)
      })
    })

    describe('setFavoritesPageState', () => {
      it('should update current page', () => {
        const { setFavoritesPageState } = usePageStateStore.getState()

        setFavoritesPageState({ currentPage: 3 })

        expect(usePageStateStore.getState().favoritesPage.currentPage).toBe(3)
      })
    })

    describe('resetFavoritesPageState', () => {
      it('should reset to initial state', () => {
        const { setFavoritesPageState, resetFavoritesPageState } = usePageStateStore.getState()

        // Modify state
        setFavoritesPageState({ currentPage: 10 })

        // Reset
        resetFavoritesPageState()

        expect(usePageStateStore.getState().favoritesPage.currentPage).toBe(0)
      })
    })
  })

  describe('state isolation', () => {
    it('should maintain state across multiple getState calls', () => {
      const { setSearchPageState } = usePageStateStore.getState()

      setSearchPageState({ selectedRegion: 1 })

      // Multiple getState calls should return same state
      expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)
      expect(usePageStateStore.getState().searchPage.selectedRegion).toBe(1)
    })
  })

  describe('cross-page state independence', () => {
    it('should not affect other pages when resetting one page', () => {
      const {
        setBookingsPageState,
        setSearchPageState,
        setFavoritesPageState,
        resetBookingsPageState,
      } = usePageStateStore.getState()

      // Set state for all pages
      setBookingsPageState({ currentPage: 1 })
      setSearchPageState({ currentPage: 2, selectedRegion: 1 })
      setFavoritesPageState({ currentPage: 3 })

      // Reset only bookings page
      resetBookingsPageState()

      // Check other pages are not affected
      const state = usePageStateStore.getState()
      expect(state.bookingsPage.currentPage).toBe(0)
      expect(state.searchPage.currentPage).toBe(2)
      expect(state.searchPage.selectedRegion).toBe(1)
      expect(state.favoritesPage.currentPage).toBe(3)
    })
  })
})
