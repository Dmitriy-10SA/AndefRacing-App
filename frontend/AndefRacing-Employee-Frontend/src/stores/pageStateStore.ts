import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { format } from 'date-fns'

interface BookingsPageState {
  startDate: string
  endDate: string
  clientPhone: string
  pageNumber: number
  searchParams: {
    startDate: string
    endDate: string
    clientPhone: string
  }
}

interface ReportsPageState {
  reportType: 'booking' | 'financial'
  startDate: string
  endDate: string
}

interface PageStateStore {
  // Bookings page state
  bookingsPage: BookingsPageState
  setBookingsPageState: (state: Partial<BookingsPageState>) => void
  setBookingsSearchParams: (params: BookingsPageState['searchParams']) => void
  resetBookingsPageState: () => void

  // Reports page state
  reportsPage: ReportsPageState
  setReportsPageState: (state: Partial<ReportsPageState>) => void
  resetReportsPageState: () => void
}

const getInitialBookingsState = (): BookingsPageState => {
  const today = format(new Date(), 'yyyy-MM-dd')
  return {
    startDate: today,
    endDate: today,
    clientPhone: '',
    pageNumber: 0,
    searchParams: {
      startDate: today,
      endDate: today,
      clientPhone: '',
    },
  }
}

const getInitialReportsState = (): ReportsPageState => {
  const today = new Date()
  return {
    reportType: 'booking',
    startDate: format(new Date(today.getFullYear(), today.getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(today.getFullYear(), today.getMonth() + 1, 0), 'yyyy-MM-dd'),
  }
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
      setBookingsSearchParams: (params) =>
        set((prev) => ({
          bookingsPage: { ...prev.bookingsPage, searchParams: params },
        })),
      resetBookingsPageState: () =>
        set({ bookingsPage: getInitialBookingsState() }),

      // Reports page
      reportsPage: getInitialReportsState(),
      setReportsPageState: (state) =>
        set((prev) => ({
          reportsPage: { ...prev.reportsPage, ...state },
        })),
      resetReportsPageState: () =>
        set({ reportsPage: getInitialReportsState() }),
    }),
    {
      name: 'employee-page-state-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
