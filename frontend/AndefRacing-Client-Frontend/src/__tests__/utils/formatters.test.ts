import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatTime,
  formatPhone,
  formatPrice,
  getImageUrl,
} from '@/utils/formatters'

describe('formatDate', () => {
  it('should format ISO date string to dd.MM.yyyy by default', () => {
    expect(formatDate('2024-01-15')).toBe('15.01.2024')
    expect(formatDate('2024-12-31')).toBe('31.12.2024')
    expect(formatDate('2023-03-05')).toBe('05.03.2023')
  })

  it('should format date with custom format yyyy-MM-dd', () => {
    expect(formatDate('2024-01-15', 'yyyy-MM-dd')).toBe('2024-01-15')
  })

  it('should return original string if format does not match', () => {
    expect(formatDate('invalid-date')).toBe('invalid-date')
    expect(formatDate('15.01.2024')).toBe('15.01.2024')
  })

  it('should handle ISO datetime strings (extract date part)', () => {
    expect(formatDate('2024-01-15T14:30:00')).toBe('15.01.2024')
    expect(formatDate('2024-01-15T00:00:00.000Z')).toBe('15.01.2024')
  })

  it('should handle edge cases with different months', () => {
    expect(formatDate('2024-02-29')).toBe('29.02.2024') // Leap year
    expect(formatDate('2023-12-01')).toBe('01.12.2023')
  })
})

describe('formatDateTime', () => {
  it('should format ISO datetime string to dd.MM.yyyy HH:mm', () => {
    expect(formatDateTime('2024-01-15T14:30:00')).toBe('15.01.2024 14:30')
    expect(formatDateTime('2024-12-31T23:59:00')).toBe('31.12.2024 23:59')
    expect(formatDateTime('2024-01-01T00:00:00')).toBe('01.01.2024 00:00')
  })

  it('should handle datetime with milliseconds', () => {
    expect(formatDateTime('2024-01-15T14:30:00.000')).toBe('15.01.2024 14:30')
  })

  it('should return original string if format does not match', () => {
    expect(formatDateTime('invalid')).toBe('invalid')
    expect(formatDateTime('2024-01-15')).toBe('2024-01-15')
  })

  it('should handle midnight and noon correctly', () => {
    expect(formatDateTime('2024-06-15T00:00:00')).toBe('15.06.2024 00:00')
    expect(formatDateTime('2024-06-15T12:00:00')).toBe('15.06.2024 12:00')
  })
})

describe('formatTime', () => {
  it('should extract time from ISO datetime string', () => {
    expect(formatTime('2024-01-15T14:30:00')).toBe('14:30')
    expect(formatTime('2024-01-15T00:00:00')).toBe('00:00')
    expect(formatTime('2024-01-15T23:59:00')).toBe('23:59')
  })

  it('should return original string if no time part found', () => {
    expect(formatTime('2024-01-15')).toBe('2024-01-15')
    expect(formatTime('invalid')).toBe('invalid')
  })

  it('should handle various time formats', () => {
    expect(formatTime('2024-01-15T09:05:00')).toBe('09:05')
    expect(formatTime('2024-01-15T12:30:45.123')).toBe('12:30')
  })
})

describe('formatPhone', () => {
  it('should return phone as-is (already formatted)', () => {
    expect(formatPhone('+7-999-123-45-67')).toBe('+7-999-123-45-67')
    expect(formatPhone('')).toBe('')
  })

  it('should preserve any phone format', () => {
    expect(formatPhone('+7-000-000-00-00')).toBe('+7-000-000-00-00')
    expect(formatPhone('+7-111-222-33-44')).toBe('+7-111-222-33-44')
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

  it('should handle small numbers', () => {
    expect(formatPrice(1)).toBe('1 ₽')
    expect(formatPrice(99)).toBe('99 ₽')
    expect(formatPrice(500)).toBe('500 ₽')
  })
})

describe('getImageUrl', () => {
  it('should return placeholder for null or undefined', () => {
    expect(getImageUrl(null)).toBe('/placeholder-image.jpg')
  })

  it('should return placeholder for empty string', () => {
    expect(getImageUrl('')).toBe('/placeholder-image.jpg')
  })

  it('should return full URL as-is for http URLs', () => {
    expect(getImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg')
    expect(getImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
  })

  it('should return /files/ URLs as-is (no /api prefix)', () => {
    expect(getImageUrl('/files/clubs/1/photo.jpg')).toBe('/files/clubs/1/photo.jpg')
    expect(getImageUrl('/files/uploads/image.png')).toBe('/files/uploads/image.png')
  })

  it('should add /api prefix for other relative URLs', () => {
    expect(getImageUrl('/images/logo.png')).toBe('/api/images/logo.png')
    expect(getImageUrl('/uploads/photo.jpg')).toBe('/api/uploads/photo.jpg')
  })

  it('should handle URLs with query parameters', () => {
    expect(getImageUrl('/files/clubs/1/photo.jpg?v=123')).toBe('/files/clubs/1/photo.jpg?v=123')
    expect(getImageUrl('/images/logo.png?size=large')).toBe('/api/images/logo.png?size=large')
  })
})
