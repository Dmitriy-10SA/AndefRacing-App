import '@testing-library/jest-dom'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './integration/mocks/server'

// Запускаем MSW сервер перед всеми тестами
beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))

// Сбрасываем обработчики после каждого теста
afterEach(() => server.resetHandlers())

// Останавливаем сервер после всех тестов
afterAll(() => server.close())

// Mock для window.matchMedia (используется некоторыми компонентами)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock для ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock для window.alert
window.alert = () => {}

// Mock для window.location
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: () => {},
    replace: () => {},
    reload: () => {},
  },
  writable: true,
})
