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
      // Reset to initial state
      usePageStateStore.getState().resetBookingsPageState()
    })

    describe('initial state', () => {
      it('should have startDate set to today', () => {
        const { bookingsPage } = usePageStateStore.getState()
        // Check format is yyyy-MM-dd
        expect(bookingsPage.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })

      it('should have endDate set to today', () => {
        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })

      it('should have empty clientPhone', () => {
        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.clientPhone).toBe('')
      })

      it('should have pageNumber set to 0', () => {
        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.pageNumber).toBe(0)
      })

      it('should have searchParams matching filters', () => {
        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.searchParams.startDate).toBe(bookingsPage.startDate)
        expect(bookingsPage.searchParams.endDate).toBe(bookingsPage.endDate)
        expect(bookingsPage.searchParams.clientPhone).toBe('')
      })
    })

    describe('setBookingsPageState', () => {
      it('should update partial state', () => {
        const { setBookingsPageState } = usePageStateStore.getState()

        setBookingsPageState({ pageNumber: 5 })

        expect(usePageStateStore.getState().bookingsPage.pageNumber).toBe(5)
      })

      it('should update multiple fields', () => {
        const { setBookingsPageState } = usePageStateStore.getState()

        setBookingsPageState({
          startDate: '2024-01-01',
          endDate: '2024-01-31',
          clientPhone: '+7-999-123-45-67',
        })

        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.startDate).toBe('2024-01-01')
        expect(bookingsPage.endDate).toBe('2024-01-31')
        expect(bookingsPage.clientPhone).toBe('+7-999-123-45-67')
      })

      it('should preserve unchanged fields', () => {
        const { setBookingsPageState } = usePageStateStore.getState()
        const originalStartDate = usePageStateStore.getState().bookingsPage.startDate

        setBookingsPageState({ pageNumber: 3 })

        expect(usePageStateStore.getState().bookingsPage.startDate).toBe(originalStartDate)
      })
    })

    describe('setBookingsSearchParams', () => {
      it('should update search params', () => {
        const { setBookingsSearchParams } = usePageStateStore.getState()

        setBookingsSearchParams({
          startDate: '2024-02-01',
          endDate: '2024-02-28',
          clientPhone: '+7-999-000-00-00',
        })

        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.searchParams.startDate).toBe('2024-02-01')
        expect(bookingsPage.searchParams.endDate).toBe('2024-02-28')
        expect(bookingsPage.searchParams.clientPhone).toBe('+7-999-000-00-00')
      })
    })

    describe('resetBookingsPageState', () => {
      it('should reset to initial state', () => {
        const { setBookingsPageState, resetBookingsPageState } = usePageStateStore.getState()

        // Modify state
        setBookingsPageState({
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          pageNumber: 10,
        })

        // Reset
        resetBookingsPageState()

        const { bookingsPage } = usePageStateStore.getState()
        expect(bookingsPage.pageNumber).toBe(0)
        expect(bookingsPage.clientPhone).toBe('')
        // Dates should be reset to today
        expect(bookingsPage.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })
  })

  describe('reportsPage', () => {
    beforeEach(() => {
      usePageStateStore.getState().resetReportsPageState()
    })

    describe('initial state', () => {
      it('should have reportType set to booking', () => {
        const { reportsPage } = usePageStateStore.getState()
        expect(reportsPage.reportType).toBe('booking')
      })

      it('should have startDate set to first day of current month', () => {
        const { reportsPage } = usePageStateStore.getState()
        expect(reportsPage.startDate).toMatch(/^\d{4}-\d{2}-01$/)
      })

      it('should have endDate set to last day of current month', () => {
        const { reportsPage } = usePageStateStore.getState()
        expect(reportsPage.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      })
    })

    describe('setReportsPageState', () => {
      it('should update report type', () => {
        const { setReportsPageState } = usePageStateStore.getState()

        setReportsPageState({ reportType: 'financial' })

        expect(usePageStateStore.getState().reportsPage.reportType).toBe('financial')
      })

      it('should update date range', () => {
        const { setReportsPageState } = usePageStateStore.getState()

        setReportsPageState({
          startDate: '2024-01-01',
          endDate: '2024-03-31',
        })

        const { reportsPage } = usePageStateStore.getState()
        expect(reportsPage.startDate).toBe('2024-01-01')
        expect(reportsPage.endDate).toBe('2024-03-31')
      })
    })

    describe('resetReportsPageState', () => {
      it('should reset to initial state', () => {
        const { setReportsPageState, resetReportsPageState } = usePageStateStore.getState()

        setReportsPageState({
          reportType: 'financial',
          startDate: '2023-01-01',
          endDate: '2023-12-31',
        })

        resetReportsPageState()

        const { reportsPage } = usePageStateStore.getState()
        expect(reportsPage.reportType).toBe('booking')
      })
    })
  })

  describe('state isolation', () => {
    it('should maintain state across multiple getState calls', () => {
      const { setBookingsPageState } = usePageStateStore.getState()

      setBookingsPageState({ pageNumber: 5 })

      // Multiple getState calls should return same state
      expect(usePageStateStore.getState().bookingsPage.pageNumber).toBe(5)
      expect(usePageStateStore.getState().bookingsPage.pageNumber).toBe(5)
    })
  })
})
