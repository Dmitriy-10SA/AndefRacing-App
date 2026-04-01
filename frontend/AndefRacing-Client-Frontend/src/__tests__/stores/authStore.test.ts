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

    it('should handle JWT-like tokens', () => {
      const { setToken } = useAuthStore.getState()
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U'

      setToken(jwtToken)

      expect(useAuthStore.getState().token).toBe(jwtToken)
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
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

    it('should work even when already logged out', () => {
      const { logout } = useAuthStore.getState()

      // Logout when already not authenticated
      logout()

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should be callable multiple times', () => {
      const { setToken, logout } = useAuthStore.getState()

      setToken('test-token')
      logout()
      logout() // Second logout

      const state = useAuthStore.getState()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
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

  describe('authentication flow', () => {
    it('should handle login -> logout -> login cycle', () => {
      const { setToken, logout } = useAuthStore.getState()

      // Initial state
      expect(useAuthStore.getState().isAuthenticated).toBe(false)

      // Login
      setToken('first-token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().token).toBe('first-token')

      // Logout
      logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().token).toBeNull()

      // Login again
      setToken('second-token')
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().token).toBe('second-token')
    })
  })
})
