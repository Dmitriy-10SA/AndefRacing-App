import { describe, it, expect } from 'vitest'
import { getImageUrl } from '@/utils/imageUtils'

describe('getImageUrl', () => {
  it('should return placeholder for null', () => {
    expect(getImageUrl(null)).toBe('/placeholder-image.jpg')
  })

  it('should return placeholder for empty string', () => {
    // Technically empty string is falsy in JS
    expect(getImageUrl('')).toBe('/placeholder-image.jpg')
  })

  it('should return full http URL as-is', () => {
    expect(getImageUrl('http://example.com/image.jpg')).toBe('http://example.com/image.jpg')
    expect(getImageUrl('http://localhost:8080/files/clubs/1/photo.jpg')).toBe('http://localhost:8080/files/clubs/1/photo.jpg')
  })

  it('should return full https URL as-is', () => {
    expect(getImageUrl('https://example.com/image.jpg')).toBe('https://example.com/image.jpg')
    expect(getImageUrl('https://cdn.example.com/images/photo.png')).toBe('https://cdn.example.com/images/photo.png')
  })

  it('should return /files/ URLs as-is (no /api prefix)', () => {
    expect(getImageUrl('/files/clubs/1/photo.jpg')).toBe('/files/clubs/1/photo.jpg')
    expect(getImageUrl('/files/uploads/image.png')).toBe('/files/uploads/image.png')
    expect(getImageUrl('/files/games/racing.jpg')).toBe('/files/games/racing.jpg')
  })

  it('should add /api prefix for other relative URLs', () => {
    expect(getImageUrl('/images/logo.png')).toBe('/api/images/logo.png')
    expect(getImageUrl('/uploads/photo.jpg')).toBe('/api/uploads/photo.jpg')
    expect(getImageUrl('/static/image.gif')).toBe('/api/static/image.gif')
  })

  it('should handle URLs with query parameters', () => {
    expect(getImageUrl('/files/clubs/1/photo.jpg?v=123')).toBe('/files/clubs/1/photo.jpg?v=123')
    expect(getImageUrl('/images/logo.png?size=large')).toBe('/api/images/logo.png?size=large')
  })
})
