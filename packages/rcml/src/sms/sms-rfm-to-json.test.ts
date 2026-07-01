import { describe, it, expect } from 'vitest'
import { smsRfmToJson } from './sms-rfm-to-json.js'
import type { SmsContentJson } from './content/json-validator/types.js'

describe('smsRfmToJson()', () => {
  describe('document structure', () => {
    it('empty string produces an empty sms document', () => {
      expect(smsRfmToJson('')).toEqual<SmsContentJson>({
        type: 'sms',
        content: [],
      })
    })

    it('plain text produces a single message node', () => {
      expect(smsRfmToJson('Hello world')).toEqual<SmsContentJson>({
        type: 'sms',
        content: [{ type: 'message', text: 'Hello world' }],
      })
    })
  })

  describe('placeholders', () => {
    it('parses a single placeholder', () => {
      expect(smsRfmToJson('[Subscriber:FirstName]')).toEqual<SmsContentJson>({
        type: 'sms',
        content: [
          {
            type: 'placeholder',
            attrs: {
              type: 'Subscriber',
              name: 'FirstName',
              original: '[Subscriber:FirstName]',
              value: null,
            },
          },
        ],
      })
    })

    it('parses text + placeholder + text as separate nodes', () => {
      const doc = smsRfmToJson('Hi [Subscriber:FirstName]!')

      expect(doc.content).toHaveLength(3)
      expect(doc.content[0]).toEqual({ type: 'message', text: 'Hi ' })
      expect(doc.content[1]).toMatchObject({ type: 'placeholder', attrs: { name: 'FirstName' } })
      expect(doc.content[2]).toEqual({ type: 'message', text: '!' })
    })

    it('parses multiple placeholder types', () => {
      const doc = smsRfmToJson('[CustomField:OrderId][Link:Unsubscribe][Date:Today]')

      expect(doc.content).toHaveLength(3)
      expect(doc.content[0]).toMatchObject({ attrs: { type: 'CustomField', name: 'OrderId' } })
      expect(doc.content[1]).toMatchObject({ attrs: { type: 'Link', name: 'Unsubscribe' } })
      expect(doc.content[2]).toMatchObject({ attrs: { type: 'Date', name: 'Today' } })
    })
  })

  describe('line breaks and paragraphs', () => {
    it('single newline stays as \\n in message text', () => {
      const doc = smsRfmToJson('Line one\nLine two')

      expect(doc.content).toEqual<SmsContentJson['content']>([
        { type: 'message', text: 'Line one\nLine two' },
      ])
    })

    it('double newline becomes a single \\n boundary in message text', () => {
      const doc = smsRfmToJson('Para one\n\nPara two')

      expect(doc.content).toEqual<SmsContentJson['content']>([
        { type: 'message', text: 'Para one\nPara two' },
      ])
    })
  })

  describe('combined', () => {
    it('placeholder mid-line with newline', () => {
      const doc = smsRfmToJson('Hi [Subscriber:FirstName]!\nLine two')

      expect(doc.content).toEqual<SmsContentJson['content']>([
        { type: 'message', text: 'Hi ' },
        {
          type: 'placeholder',
          attrs: {
            type: 'Subscriber',
            name: 'FirstName',
            original: '[Subscriber:FirstName]',
            value: null,
          },
        },
        { type: 'message', text: '!\nLine two' },
      ])
    })
  })
})

describe('smsRfmToJson() — link directive', () => {
  it('parses a basic :link directive as a link node', () => {
    const doc = smsRfmToJson(':link[https://example.com]{href="https://example.com" track="true" shorten="false"}')

    expect(doc.content).toEqual<SmsContentJson['content']>([
      {
        type: 'link',
        text: 'https://example.com',
        attrs: { track: true, shorten: false },
      },
    ])
  })

  it('parses :link with shorten="true"', () => {
    const doc = smsRfmToJson(':link[https://google.com]{href="https://google.com" track="true" shorten="true"}')

    expect(doc.content).toHaveLength(1)
    expect(doc.content[0]).toMatchObject({
      type: 'link',
      text: 'https://google.com',
      attrs: { track: true, shorten: true },
    })
  })

  it('parses a :link mixed with surrounding text', () => {
    const doc = smsRfmToJson('Your message here. :link[https://google.com]{href="https://google.com" track="true" shorten="true"} Test')

    expect(doc.content).toHaveLength(3)
    expect(doc.content[0]).toEqual({ type: 'message', text: 'Your message here. ' })
    expect(doc.content[1]).toMatchObject({
      type: 'link',
      text: 'https://google.com',
      attrs: { track: true, shorten: true },
    })
    expect(doc.content[2]).toEqual({ type: 'message', text: ' Test' })
  })
})

describe('smsRfmToJson() — ::placeholder directive', () => {
  it('parses a ::placeholder directive with a resolved value', () => {
    const doc = smsRfmToJson('Your message here. ::placeholder{type="CustomField" original="[CustomField:Address.Firstname]" name="Address.Firstname" value="77856" max-length=""}')

    expect(doc.content).toHaveLength(2)
    expect(doc.content[1]).toEqual({
      type: 'placeholder',
      attrs: {
        type: 'CustomField',
        name: 'Address.Firstname',
        original: '[CustomField:Address.Firstname]',
        value: 77856,
      },
    })
  })

  it('parses a ::placeholder directive with null value', () => {
    const doc = smsRfmToJson('::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="FirstName" value="" max-length=""}')

    expect(doc.content).toHaveLength(1)
    expect(doc.content[0]).toMatchObject({
      type: 'placeholder',
      attrs: { type: 'Subscriber', name: 'FirstName', original: '[Subscriber:FirstName]', value: null },
    })
  })

  it('::placeholder and [Type:Name] shorthand produce equivalent JSON', () => {
    const fromShorthand = smsRfmToJson('[Subscriber:FirstName]')
    const fromDirective = smsRfmToJson('::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="FirstName" value="" max-length=""}')

    expect(fromDirective.content[0]).toMatchObject({
      type: 'placeholder',
      attrs: {
        type: 'Subscriber',
        name: 'FirstName',
        value: null,
      },
    })
    expect(fromDirective.content[0]).toMatchObject({
      attrs: {
        type: (fromShorthand.content[0] as { attrs: { type: string } }).attrs.type,
        name: (fromShorthand.content[0] as { attrs: { name: string } }).attrs.name,
      },
    })
  })
})
