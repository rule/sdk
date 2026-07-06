import { describe, it, expect } from 'vitest'
import { serializeSmsToXml } from './serialize-helpers.js'
import { createSmsDocument } from '../create-sms-document.js'

describe('serializeSmsToXml()', () => {
  it('serializes a simple document with an id attribute', () => {
    const doc = createSmsDocument({ content: 'Hello world' })
    const xml = serializeSmsToXml(doc, {})

    expect(xml).toMatch(/^<rc-sms id="[0-9a-f-]{36}">Hello world<\/rc-sms>$/)
  })

  it('serializes a document with a placeholder', () => {
    const doc = createSmsDocument({ content: 'Hi [Subscriber:FirstName]!' })
    const xml = serializeSmsToXml(doc, {})

    expect(xml).toContain('[Subscriber:FirstName]')
    expect(xml).toMatch(/^<rc-sms id="/)
  })

  it('includes id in attributes when present', () => {
    const doc = { ...createSmsDocument({ content: 'Hello' }), id: '550e8400-e29b-41d4-a716-446655440000' }
    const xml = serializeSmsToXml(doc, {})

    expect(xml).toContain('id="550e8400-e29b-41d4-a716-446655440000"')
  })

  it('serializes an empty document', () => {
    const doc = createSmsDocument({ content: '' })
    const xml = serializeSmsToXml(doc, {})

    // Empty paragraph → empty SMS RFM → empty element
    expect(xml).toMatch(/^<rc-sms/)
  })

  it('respects pretty: false', () => {
    const doc = createSmsDocument({ content: 'Hello' })
    const xml = serializeSmsToXml(doc, { pretty: false })

    expect(xml).not.toContain('\n')
  })
})
