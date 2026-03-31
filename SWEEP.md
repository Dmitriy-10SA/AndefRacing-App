# AndefRacing App - Development Guide

## Docker Commands

### Быстрый перезапуск всех сервисов
```bash
docker compose down && docker compose up --build -d
```

### Перезапуск только фронтенда (после изменений в коде фронтенда)
```bash
docker compose up -d --build client-frontend employee-frontend
```

### Перезапуск только бэкенда (после изменений в коде бэкенда)
```bash
docker compose up -d --build backend
```

### Остановка всех сервисов
```bash
docker compose down
```

### Просмотр логов
```bash
# Все сервисы
docker compose logs -f

# Конкретный сервис
docker compose logs -f backend
docker compose logs -f employee-frontend
docker compose logs -f client-frontend

# Последние N строк
docker compose logs backend --tail=50
```

### Проверка статуса контейнеров
```bash
docker compose ps
```

## Frontend Testing

### Запуск тестов Client Frontend
```bash
cd frontend/AndefRacing-Client-Frontend && npm test -- --run
```

### Запуск тестов Employee Frontend
```bash
cd frontend/AndefRacing-Employee-Frontend && npm test -- --run
```

### Запуск тестов в watch режиме
```bash
cd frontend/AndefRacing-Client-Frontend && npm test
cd frontend/AndefRacing-Employee-Frontend && npm test
```

### Запуск тестов с coverage
```bash
cd frontend/AndefRacing-Client-Frontend && npm test -- --coverage
cd frontend/AndefRacing-Employee-Frontend && npm test -- --coverage
```

### Структура тестов
Тесты расположены в папке `src/__tests__/` с зеркальной структурой к исходному коду:
```
src/__tests__/
├── utils/
│   ├── formatters.test.ts
│   ├── validators.test.ts
│   └── imageUtils.test.ts (только Employee)
└── stores/
    ├── authStore.test.ts
    └── pageStateStore.test.ts
```

## Важные замечания

### Статические файлы (фотографии)
- Фотографии сохраняются в `/uploads/clubs/{clubId}/` на хосте
- В Docker они монтируются через volume: `./uploads:/uploads`
- URL фотографий: `/files/clubs/{clubId}/{filename}.jpg`
- Nginx проксирует `/files/` к бэкенду на порт 8080
- НЕ добавляйте `/api` к URL фотографий в коде фронтенда

### Порты
- Backend: 8080
- Client Frontend: 3000
- Employee Frontend: 3001
- PostgreSQL: 5432
- Redis: 6379

## Решенные проблемы

### Проблема: Фотографии не отображаются в Docker
**Причина:** Nginx конфигурация не проксировала `/files/` к бэкенду, и regex правило для кэширования перехватывало запросы к `.jpg` файлам.

**Решение:**
1. Добавлено проксирование `/files/` к бэкенду в nginx.conf
2. Изменено regex правило кэширования, чтобы исключить `/files/`: `^/(?!files/).*\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$`

### Проблема: Ошибка "Общий размер фотографий превышает 50 МБ"
**Причина:** Непонятное сообщение об ошибке при проверке размера файлов.

**Решение:** Добавлено детальное сообщение с указанием размеров уже добавленных и новых файлов.
