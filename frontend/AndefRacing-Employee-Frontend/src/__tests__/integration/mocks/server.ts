import { setupServer } from 'msw/node'
import { handlers } from './handlers'

// Создаем сервер с обработчиками
export const server = setupServer(...handlers)
