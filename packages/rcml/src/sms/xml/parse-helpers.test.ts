import { describe, it, expect } from 'vitest'
import { convertXmlToSms } from './parse-helpers.js'
import { serializeSmsToXml } from './serialize-helpers.js'
import { createSmsDocument } from '../create-sms-document.js'

describe('convertXmlToSms()', () => {
  it('round-trips a simple document', () => {
    const doc = createSmsDocument({ content: 'Hello world' })
    const xml = serializeSmsToXml(doc, {})
    const result = convertXmlToSms(xml)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.tagName).toBe('rc-sms')
      expect(result.data.attributes).toEqual({})
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

  it('round-trips id attribute', () => {
    const doc = { ...createSmsDocument({ content: 'Hello' }), id: 'test-id' }
    const xml = serializeSmsToXml(doc, {})
    const result = convertXmlToSms(xml)

    expect(result.success).toBe(true)

    if (result.success) {
      expect(result.data.id).toBe('test-id')
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
