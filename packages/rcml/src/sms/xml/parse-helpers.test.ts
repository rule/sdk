import { describe, it, expect } from 'vitest'
import { convertXmlToSms } from './parse-helpers.js'
import { serializeSmsToXml } from './serialize-helpers.js'
import { createSmsDocument } from '../create-sms-document.js'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

describe('convertXmlToSms()', () => {
  it('round-trips a simple document', () => {
    const doc = createSmsDocument({ content: 'Hello world' })
    const xml = serializeSmsToXml(doc, {})
    const result = convertXmlToSms(xml)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.tagName).toBe('rc-sms')
      expect('attributes' in result.data).toBe(false)
    }
  })

  it('round-trips a document with placeholder', () => {
    const doc = createSmsDocument({ content: 'Hi [Subscriber:FirstName]!' })
    const xml = serializeSmsToXml(doc, {})
    const result = convertXmlToSms(xml)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.content.content.some((n) => n.type === 'placeholder')).toBe(true)
    }
  })

  it('preserves a valid UUID id attribute from XML', () => {
    const validUuid = '550e8400-e29b-41d4-a716-446655440000'
    const doc = { ...createSmsDocument({ content: 'Hello' }), id: validUuid }
    const xml = serializeSmsToXml(doc, {})
    const result = convertXmlToSms(xml)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.id).toBe(validUuid)
    }
  })

  it('auto-generates a UUID when id attribute is absent', () => {
    const result = convertXmlToSms('<rc-sms>Hello</rc-sms>')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.id).toMatch(UUID_RE)
    }
  })

  it('auto-generates a UUID when id attribute is not a valid UUID', () => {
    const result = convertXmlToSms('<rc-sms id="not-a-uuid">Hello</rc-sms>')

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.id).toMatch(UUID_RE)
      expect(result.data.id).not.toBe('not-a-uuid')
    }
  })

  it('returns XML_PARSE_ERROR for malformed XML', () => {
    const result = convertXmlToSms('<unclosed')

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors[0]!.code).toBe('XML_PARSE_ERROR')
    }
  })

  it('returns ROOT_INVALID for wrong root tag', () => {
    const result = convertXmlToSms('<rc-email>Hello</rc-email>')

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors[0]!.code).toBe('ROOT_INVALID')
    }
  })

  it('returns ROOT_INVALID when rc-sms contains a child element', () => {
    const result = convertXmlToSms('<rc-sms><b>hi</b></rc-sms>')

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors[0]!.code).toBe('ROOT_INVALID')
      expect(result.errors[0]!.message).toContain('<b>')
    }
  })
})
