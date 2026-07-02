import { describe, expect, it } from 'vitest'
import type { SmsDocument } from './sms-types.js'
import { smsToXml } from './sms-to-xml.js'
import { xmlToSms } from './xml-to-sms.js'
import { smsRfmToJson } from './sms-rfm-to-json.js'
import { createUnsubscribeNodes } from './builders/nodes.js'

/**
 * Docs that exercise the full range of SMS document shapes.
 */
const ROUND_TRIP_DOCS: ReadonlyArray<{ name: string; doc: SmsDocument }> = [
  {
    name: 'minimal empty document',
    doc: {
      tagName: 'rc-sms',
      attributes: {},
      content: smsRfmToJson(''),
    },
  },
  {
    name: 'plain text content',
    doc: {
      tagName: 'rc-sms',
      attributes: {},
      content: smsRfmToJson('Your order has shipped!'),
    },
  },
  {
    name: 'subscriber placeholder',
    doc: {
      tagName: 'rc-sms',
      attributes: {},
      content: smsRfmToJson('Hi [Subscriber:FirstName], your order is ready.'),
    },
  },
  {
    name: 'multiple placeholder types',
    doc: {
      tagName: 'rc-sms',
      attributes: {},
      content: smsRfmToJson('Hello [Subscriber:FirstName], total: [CustomField:Order.Total]. [Link:Unsubscribe]'),
    },
  },
  {
    name: 'newline within message',
    doc: {
      tagName: 'rc-sms',
      attributes: {},
      content: smsRfmToJson('Line one\nLine two\nLine three'),
    },
  },
  {
    name: 'multi-paragraph document',
    doc: {
      tagName: 'rc-sms',
      attributes: {},
      content: smsRfmToJson('Para one\n\nPara two\n\nPara three'),
    },
  },
  {
    name: 'preserves id attribute',
    doc: {
      id: 'abc-123',
      tagName: 'rc-sms',
      attributes: {},
      content: smsRfmToJson('Hello [Subscriber:FirstName]'),
    },
  },
]

describe('smsToXml → xmlToSms round-trip', () => {
  for (const { name, doc } of ROUND_TRIP_DOCS) {
    it(name, () => {
      const xml = smsToXml(doc)
      const restored = xmlToSms(xml)

      expect(restored).toEqual(doc)
    })
  }
})

describe('xmlToSms → smsToXml (string → JSON → string) idempotence', () => {
  it('stable for a pretty-printed canonical XML', () => {
    const xml = '<rc-sms>Hello [Subscriber:FirstName]</rc-sms>'
    const json = xmlToSms(xml)
    const xml2 = smsToXml(json, { pretty: false })
    const json2 = xmlToSms(xml2)

    expect(json2).toEqual(json)
  })

  it('stable over multiple round-trips', () => {
    const original = smsRfmToJson('Hi [Subscriber:FirstName]!\nYour total: [CustomField:Order.Total].')
    const doc: SmsDocument = { tagName: 'rc-sms', attributes: {}, content: original }
    const xml1 = smsToXml(doc)
    const doc2 = xmlToSms(xml1)
    const xml2 = smsToXml(doc2)

    expect(xml2).toBe(xml1)
    expect(doc2).toEqual(doc)
  })
})

describe('XML round-trip — ::unsubscribe directive', () => {
  it('::unsubscribe in XML round-trips to the two-node JSON footer and back', () => {
    const xml = '<rc-sms>Your order has shipped.\n::unsubscribe</rc-sms>'
    const doc = xmlToSms(xml)

    expect(doc.content.content).toHaveLength(3)
    expect(doc.content.content[1]).toEqual({
      type: 'message',
      text: '[Subscriber:unsubscribe_text]',
      attrs: { 'is-unsubscribe': true },
    })
    expect(doc.content.content[2]).toEqual({
      type: 'placeholder',
      attrs: {
        type: 'Link',
        name: 'Unsubscribe',
        original: '[Link:Unsubscribe]',
        value: null,
        'is-unsubscribe': true,
      },
    })

    const xmlBack = smsToXml(doc, { pretty: false })

    expect(xmlBack).toBe('<rc-sms>Your order has shipped.\n::unsubscribe</rc-sms>')
  })

  it('document built with createUnsubscribeNodes round-trips through XML', () => {
    const doc: SmsDocument = {
      tagName: 'rc-sms',
      attributes: {},
      content: {
        type: 'sms',
        content: [
          { type: 'message', text: 'Your order has shipped.' },
          ...createUnsubscribeNodes(),
        ],
      },
    }
    const xml = smsToXml(doc)
    const restored = xmlToSms(xml)

    expect(restored).toEqual(doc)
  })
})

describe('XML round-trip — link nodes', () => {
  it('link nodes survive the XML round-trip via :link directive syntax', () => {
    const docWithLink: SmsDocument = {
      tagName: 'rc-sms',
      attributes: {},
      content: {
        type: 'sms',
        content: [
          { type: 'message', text: 'Hello ' },
          {
            type: 'link',
            text: 'https://example.com',
            attrs: { track: true, shorten: false },
          },
        ],
      },
    }

    const xml = smsToXml(docWithLink)
    const restored = xmlToSms(xml)

    // Link nodes are preserved via :link[...]{...} directive serialization.
    expect(restored.content).toEqual(docWithLink.content)
  })
})
