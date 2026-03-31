import { describe, it, expect } from 'vitest'
import {
  PHONE_REGEX,
  PASSWORD_REGEX,
  validatePhone,
  validatePassword,
  formatPhoneInput,
} from '@/utils/validators'

describe('PHONE_REGEX', () => {
  it('should match valid phone format +7-XXX-XXX-XX-XX', () => {
    expect(PHONE_REGEX.test('+7-999-123-45-67')).toBe(true)
    expect(PHONE_REGEX.test('+7-000-000-00-00')).toBe(true)
    expect(PHONE_REGEX.test('+7-123-456-78-90')).toBe(true)
  })

  it('should not match invalid phone formats', () => {
    expect(PHONE_REGEX.test('89991234567')).toBe(false)
    expect(PHONE_REGEX.test('+79991234567')).toBe(false)
    expect(PHONE_REGEX.test('+7-999-123-4567')).toBe(false)
    expect(PHONE_REGEX.test('7-999-123-45-67')).toBe(false)
    expect(PHONE_REGEX.test('+7-99-123-45-67')).toBe(false)
    expect(PHONE_REGEX.test('')).toBe(false)
  })
})

describe('PASSWORD_REGEX', () => {
  it('should match password with lowercase, uppercase, digit and special char (Latin)', () => {
    expect(PASSWORD_REGEX.test('Password1!')).toBe(true)
    expect(PASSWORD_REGEX.test('Aa1@bbbb')).toBe(true)
    expect(PASSWORD_REGEX.test('Test123$%')).toBe(true)
  })

  it('should match password with Russian letters', () => {
    // Employee frontend supports Russian letters in password
    expect(PASSWORD_REGEX.test('Пароль1!')).toBe(true)
    expect(PASSWORD_REGEX.test('Аа1@бббб')).toBe(true)
  })

  it('should not match password without lowercase', () => {
    expect(PASSWORD_REGEX.test('PASSWORD1!')).toBe(false)
    expect(PASSWORD_REGEX.test('ПАРОЛЬ1!')).toBe(false)
  })

  it('should not match password without uppercase', () => {
    expect(PASSWORD_REGEX.test('password1!')).toBe(false)
    expect(PASSWORD_REGEX.test('пароль1!')).toBe(false)
  })

  it('should not match password without digit', () => {
    expect(PASSWORD_REGEX.test('Password!')).toBe(false)
  })

  it('should not match password without special character', () => {
    expect(PASSWORD_REGEX.test('Password1')).toBe(false)
  })
})

describe('validatePhone', () => {
  it('should return true for valid phone', () => {
    expect(validatePhone('+7-999-123-45-67')).toBe(true)
  })

  it('should return false for invalid phone', () => {
    expect(validatePhone('89991234567')).toBe(false)
    expect(validatePhone('')).toBe(false)
    expect(validatePhone('+7999-123-45-67')).toBe(false)
  })
})

describe('validatePassword', () => {
  it('should return true for valid password (8+ chars with all requirements)', () => {
    expect(validatePassword('Password1!')).toBe(true)
    expect(validatePassword('Aa1@bbbb')).toBe(true)
    expect(validatePassword('VeryLongPassword123!')).toBe(true)
    expect(validatePassword('Пароль1!')).toBe(true) // Russian support
  })

  it('should return false for password shorter than 8 characters', () => {
    expect(validatePassword('Pass1!')).toBe(false)
    expect(validatePassword('Aa1@')).toBe(false)
  })

  it('should return false for password missing requirements', () => {
    // Missing uppercase
    expect(validatePassword('password1!')).toBe(false)
    // Missing lowercase
    expect(validatePassword('PASSWORD1!')).toBe(false)
    // Missing digit
    expect(validatePassword('Password!')).toBe(false)
    // Missing special char
    expect(validatePassword('Password1')).toBe(false)
  })

  it('should return false for empty password', () => {
    expect(validatePassword('')).toBe(false)
  })
})

describe('formatPhoneInput', () => {
  it('should return empty string for empty input', () => {
    expect(formatPhoneInput('')).toBe('')
  })

  it('should format single digit', () => {
    expect(formatPhoneInput('7')).toBe('+7')
  })

  it('should format partial phone number', () => {
    expect(formatPhoneInput('79')).toBe('+7-9')
    expect(formatPhoneInput('799')).toBe('+7-99')
    expect(formatPhoneInput('7999')).toBe('+7-999')
    expect(formatPhoneInput('79991')).toBe('+7-999-1')
    expect(formatPhoneInput('799912')).toBe('+7-999-12')
    expect(formatPhoneInput('7999123')).toBe('+7-999-123')
    expect(formatPhoneInput('79991234')).toBe('+7-999-123-4')
    expect(formatPhoneInput('799912345')).toBe('+7-999-123-45')
    expect(formatPhoneInput('7999123456')).toBe('+7-999-123-45-6')
  })

  it('should format complete phone number', () => {
    expect(formatPhoneInput('79991234567')).toBe('+7-999-123-45-67')
  })

  it('should strip non-digit characters from input', () => {
    expect(formatPhoneInput('+7-999-123-45-67')).toBe('+7-999-123-45-67')
    expect(formatPhoneInput('7 999 123 45 67')).toBe('+7-999-123-45-67')
    expect(formatPhoneInput('7(999)123-45-67')).toBe('+7-999-123-45-67')
  })

  it('should truncate extra digits', () => {
    expect(formatPhoneInput('799912345678999')).toBe('+7-999-123-45-67')
  })
})
