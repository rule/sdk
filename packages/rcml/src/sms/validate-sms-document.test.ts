import { describe, it, expect } from 'vitest'
import {
  validateSmsDocument,
  safeValidateSmsDocument,
  SmsDocumentValidationError,
} from './validate-sms-document.js'
import { createSmsDocument } from './create-sms-document.js'
import { smsRfmToJson } from './sms-rfm-to-json.js'

describe('validateSmsDocument()', () => {
  it('accepts a valid document built with createSmsDocument', () => {
    const doc = createSmsDocument({ content: 'Hello' })

    expect(() => validateSmsDocument(doc)).not.toThrow()
  })

  it('returns the document on success', () => {
    const doc = createSmsDocument({ content: 'Hello [Subscriber:FirstName]' })
    const result = validateSmsDocument(doc)

    expect(result).toBe(doc)
  })

  it('rejects wrong tagName', () => {
    const doc = { tagName: 'rc-email' as 'rc-sms', content: smsRfmToJson('') }

    expect(() => validateSmsDocument(doc)).toThrow(SmsDocumentValidationError)
  })

  it('rejects a document without id', () => {
    const doc = { tagName: 'rc-sms' as const, content: smsRfmToJson('Hello') }

    expect(() => validateSmsDocument(doc)).toThrow(SmsDocumentValidationError)
  })

  it('rejects a document with a malformed id', () => {
    const doc = { id: 'not-a-uuid', tagName: 'rc-sms' as const, content: smsRfmToJson('Hello') }

    expect(() => validateSmsDocument(doc)).toThrow(SmsDocumentValidationError)
  })

  it('rejects invalid content JSON', () => {
    const doc = {
      tagName: 'rc-sms' as const,
      content: { type: 'wrong' } as never,
    }

    expect(() => validateSmsDocument(doc)).toThrow(SmsDocumentValidationError)
  })
})

describe('safeValidateSmsDocument()', () => {
  it('returns success for a valid document', () => {
    const doc = createSmsDocument({ content: 'Hello' })
    const result = safeValidateSmsDocument(doc)

    expect(result.success).toBe(true)
  })

  it('returns failure with STRUCTURE_INVALID for wrong tagName', () => {
    const doc = { tagName: 'rc-sms' as const, content: smsRfmToJson('') }
    const broken = { ...doc, tagName: 'nope' as 'rc-sms' }
    const result = safeValidateSmsDocument(broken)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors.some((e) => e.code === 'STRUCTURE_INVALID')).toBe(true)
    }
  })

  it('returns failure with ID_INVALID when id is missing', () => {
    const doc = { tagName: 'rc-sms' as const, content: smsRfmToJson('Hello') }
    const result = safeValidateSmsDocument(doc)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors.some((e) => e.code === 'ID_INVALID')).toBe(true)
    }
  })

  it('returns failure with ID_INVALID for a malformed id', () => {
    const doc = { id: 'not-a-uuid', tagName: 'rc-sms' as const, content: smsRfmToJson('Hello') }
    const result = safeValidateSmsDocument(doc)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors.some((e) => e.code === 'ID_INVALID')).toBe(true)
    }
  })

  it('returns success for a document with a valid UUID id', () => {
    const doc = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tagName: 'rc-sms' as const,
      content: smsRfmToJson('Hello'),
    }
    const result = safeValidateSmsDocument(doc)

    expect(result.success).toBe(true)
  })

  it('returns failure with CONTENT_INVALID for bad content', () => {
    const doc = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      tagName: 'rc-sms' as const,
      content: { type: 'bad' } as never,
    }
    const result = safeValidateSmsDocument(doc)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors.some((e) => e.code === 'CONTENT_INVALID')).toBe(true)
    }
  })
})
