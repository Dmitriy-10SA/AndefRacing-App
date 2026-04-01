import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatTimeByHoursAndMinutes,
  formatPhone,
  formatPrice,
  formatDayOfWeek,
  formatInputDate,
} from '@/utils/formatters'

describe('formatDate', () => {
  it('should format date string yyyy-MM-dd to dd.MM.yyyy by default', () => {
    expect(formatDate('2024-01-15')).toBe('15.01.2024')
    expect(formatDate('2024-12-31')).toBe('31.12.2024')
    expect(formatDate('2023-03-05')).toBe('05.03.2023')
  })

  it('should return empty string for empty input', () => {
    expect(formatDate('')).toBe('')
  })

  it('should handle Date object', () => {
    const date = new Date(2024, 0, 15) // January 15, 2024
    expect(formatDate(date)).toBe('15.01.2024')
  })

  it('should support custom format', () => {
    expect(formatDate('2024-01-15', 'yyyy-MM-dd')).toBe('2024-01-15')
    expect(formatDate('2024-01-15', 'dd MMMM yyyy')).toBe('15 января 2024')
  })
})

describe('formatDateTime', () => {
  it('should format ISO datetime string to dd.MM.yyyy HH:mm', () => {
    expect(formatDateTime('2024-01-15T14:30:00')).toBe('15.01.2024 14:30')
    expect(formatDateTime('2024-12-31T23:59:00')).toBe('31.12.2024 23:59')
    expect(formatDateTime('2024-01-01T00:00:00')).toBe('01.01.2024 00:00')
  })

  it('should return empty string for empty input', () => {
    expect(formatDateTime('')).toBe('')
  })
})

describe('formatTime', () => {
  it('should extract time from ISO datetime string', () => {
    expect(formatTime('2024-01-15T14:30:00')).toBe('14:30')
    expect(formatTime('2024-01-15T00:00:00')).toBe('00:00')
    expect(formatTime('2024-01-15T23:59:00')).toBe('23:59')
  })

  it('should return empty string for empty input', () => {
    expect(formatTime('')).toBe('')
  })
})

describe('formatTimeByHoursAndMinutes', () => {
  it('should format HH:mm:ss to HH:mm', () => {
    expect(formatTimeByHoursAndMinutes('14:30:00')).toBe('14:30')
    expect(formatTimeByHoursAndMinutes('00:00:00')).toBe('00:00')
    expect(formatTimeByHoursAndMinutes('23:59:59')).toBe('23:59')
  })

  it('should return empty string for null', () => {
    expect(formatTimeByHoursAndMinutes(null)).toBe('')
  })

  it('should return empty string for empty string', () => {
    expect(formatTimeByHoursAndMinutes('')).toBe('')
  })
})

describe('formatPhone', () => {
  it('should return phone as-is (already formatted)', () => {
    expect(formatPhone('+7-999-123-45-67')).toBe('+7-999-123-45-67')
    expect(formatPhone('')).toBe('')
  })
})

describe('formatPrice', () => {
  // Note: toLocaleString('ru-RU') uses non-breaking space (U+00A0) as thousands separator
  const nbsp = '\u00A0' // non-breaking space

  it('should format price with Russian locale and ruble sign', () => {
    expect(formatPrice(1000)).toBe(`1${nbsp}000 ₽`)
    expect(formatPrice(1500)).toBe(`1${nbsp}500 ₽`)
    expect(formatPrice(0)).toBe('0 ₽')
  })

  it('should format large numbers with spaces', () => {
    expect(formatPrice(1000000)).toBe(`1${nbsp}000${nbsp}000 ₽`)
    expect(formatPrice(999999)).toBe(`999${nbsp}999 ₽`)
  })

  it('should handle decimal numbers', () => {
    expect(formatPrice(1500.5)).toBe(`1${nbsp}500,5 ₽`)
    expect(formatPrice(1500.99)).toBe(`1${nbsp}500,99 ₽`)
  })
})

describe('formatDayOfWeek', () => {
  it('should translate English day names to Russian', () => {
    expect(formatDayOfWeek('MONDAY')).toBe('Понедельник')
    expect(formatDayOfWeek('TUESDAY')).toBe('Вторник')
    expect(formatDayOfWeek('WEDNESDAY')).toBe('Среда')
    expect(formatDayOfWeek('THURSDAY')).toBe('Четверг')
    expect(formatDayOfWeek('FRIDAY')).toBe('Пятница')
    expect(formatDayOfWeek('SATURDAY')).toBe('Суббота')
    expect(formatDayOfWeek('SUNDAY')).toBe('Воскресенье')
  })

  it('should return original value for unknown day', () => {
    expect(formatDayOfWeek('INVALID')).toBe('INVALID')
    expect(formatDayOfWeek('')).toBe('')
  })
})

describe('formatInputDate', () => {
  it('should return yyyy-MM-dd string as-is', () => {
    expect(formatInputDate('2024-01-15')).toBe('2024-01-15')
    expect(formatInputDate('2024-12-31')).toBe('2024-12-31')
  })

  it('should format Date object to yyyy-MM-dd', () => {
    const date = new Date(2024, 0, 15) // January 15, 2024
    expect(formatInputDate(date)).toBe('2024-01-15')
  })

  it('should return formatted current date when no argument', () => {
    const result = formatInputDate()
    // Should match yyyy-MM-dd format
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
