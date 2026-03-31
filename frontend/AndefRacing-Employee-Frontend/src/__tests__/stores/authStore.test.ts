import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

// Mock localStorage
const localStorageMock = (() => {
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

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      token: null,
      isAuthenticated: false,
      currentClub: null,
    })
    localStorageMock.clear()
  })

  describe('initial state', () => {
    it('should have null token initially', () => {
      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
    })

    it('should not be authenticated initially', () => {
      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should have null currentClub initially', () => {
      const state = useAuthStore.getState()
      expect(state.currentClub).toBeNull()
    })
  })

  describe('setToken', () => {
    it('should set token and mark as authenticated', () => {
      const { setToken } = useAuthStore.getState()

      setToken('test-jwt-token')

      const state = useAuthStore.getState()
      expect(state.token).toBe('test-jwt-token')
      expect(state.isAuthenticated).toBe(true)
    })

    it('should update token when called multiple times', () => {
      const { setToken } = useAuthStore.getState()

      setToken('token-1')
      expect(useAuthStore.getState().token).toBe('token-1')

      setToken('token-2')
      expect(useAuthStore.getState().token).toBe('token-2')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
    })
  })

  describe('setCurrentClub', () => {
    it('should set current club', () => {
      const { setCurrentClub } = useAuthStore.getState()
      const mockClub = {
        id: 1,
        name: 'Test Racing Club',
        phone: '+7-999-123-45-67',
        email: 'test@club.com',
        address: 'Test Address',
        cntEquipment: 10,
        isOpen: true,
        city: {
          id: 1,
          name: 'Москва',
          region: { id: 1, name: 'Московская область' },
        },
      }

      setCurrentClub(mockClub)

      const state = useAuthStore.getState()
      expect(state.currentClub).toEqual(mockClub)
      expect(state.currentClub?.name).toBe('Test Racing Club')
    })
  })

  describe('logout', () => {
    it('should clear token and authentication status', () => {
      const { setToken, logout } = useAuthStore.getState()

      // First login
      setToken('test-token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)

      // Then logout
      logout()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should clear currentClub on logout', () => {
      const { setToken, setCurrentClub, logout } = useAuthStore.getState()
      const mockClub = {
        id: 1,
        name: 'Test Club',
        phone: '+7-999-123-45-67',
        email: 'test@club.com',
        address: 'Address',
        cntEquipment: 5,
        isOpen: true,
        city: {
          id: 1,
          name: 'Москва',
          region: { id: 1, name: 'Московская область' },
        },
      }

      setToken('test-token')
      setCurrentClub(mockClub)
      expect(useAuthStore.getState().currentClub).not.toBeNull()

      logout()

      expect(useAuthStore.getState().currentClub).toBeNull()
    })
  })

  describe('state isolation', () => {
    it('should maintain state across multiple getState calls', () => {
      const { setToken } = useAuthStore.getState()

      setToken('test-token')

      // Multiple getState calls should return same state
      expect(useAuthStore.getState().token).toBe('test-token')
      expect(useAuthStore.getState().token).toBe('test-token')
    })
  })
})
