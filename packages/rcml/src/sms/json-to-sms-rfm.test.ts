import { describe, it, expect } from 'vitest'
import { smsRfmToJson } from './sms-rfm-to-json.js'
import { jsonToSmsRfm } from './json-to-sms-rfm.js'
import type { SmsContentJson } from './content/json-validator/types.js'

describe('jsonToSmsRfm()', () => {
  it('round-trips plain text', () => {
    expect(jsonToSmsRfm(smsRfmToJson('Hello world'))).toBe('Hello world')
  })

  it('round-trips a placeholder', () => {
    expect(jsonToSmsRfm(smsRfmToJson('[Subscriber:FirstName]'))).toBe('[Subscriber:FirstName]')
  })

  it('round-trips text + placeholder + text', () => {
    const input = 'Hi [Subscriber:FirstName]!'

    expect(jsonToSmsRfm(smsRfmToJson(input))).toBe(input)
  })

  it('round-trips single newline in message text', () => {
    expect(jsonToSmsRfm(smsRfmToJson('Line one\nLine two'))).toBe('Line one\nLine two')
  })

  it('round-trips double newline (paragraph boundary becomes single \\n)', () => {
    // Paragraph boundaries are flattened to \n in the new model
    expect(jsonToSmsRfm(smsRfmToJson('Para one\n\nPara two'))).toBe('Para one\nPara two')
  })

  it('renders a link node as :link directive', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [
        {
          type: 'link',
          text: 'https://example.com',
          attrs: { track: true, shorten: false },
        },
      ],
    }

    expect(jsonToSmsRfm(json)).toBe(':link[https://example.com]{track="true" shorten="false"}')
  })

  it('empty content round-trips to empty string', () => {
    expect(jsonToSmsRfm(smsRfmToJson(''))).toBe('')
  })
})

describe('jsonToSmsRfm() — link node serialization', () => {
  it('emits :link with track="false" and shorten="false"', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [{
        type: 'link',
        text: 'https://example.com',
        attrs: { track: false, shorten: false },
      }],
    }

    expect(jsonToSmsRfm(json)).toBe(':link[https://example.com]{track="false" shorten="false"}')
  })

  it('emits message text verbatim including embedded newlines', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [{ type: 'message', text: 'Hello\nWorld' }],
    }

    expect(jsonToSmsRfm(json)).toBe('Hello\nWorld')
  })

  it('emits ::placeholder when value is non-null', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [{
        type: 'placeholder',
        attrs: {
          type: 'CustomField',
          original: '[CustomField:Address.Firstname]',
          name: 'Address.Firstname',
          value: '77856',
        },
      }],
    }

    expect(jsonToSmsRfm(json)).toBe('::placeholder{type="CustomField" original="[CustomField:Address.Firstname]" name="Address.Firstname" value="77856"}')
  })

  it('emits [Type:Name] shorthand when value is null and max-length is absent', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [{
        type: 'placeholder',
        attrs: {
          type: 'Subscriber',
          original: '[Subscriber:FirstName]',
          name: 'FirstName',
          value: null,
        },
      }],
    }

    expect(jsonToSmsRfm(json)).toBe('[Subscriber:FirstName]')
  })

  it('emits ::placeholder when max-length is non-null', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [{
        type: 'placeholder',
        attrs: {
          type: 'Subscriber',
          original: '[Subscriber:FirstName]',
          name: 'FirstName',
          value: null,
          'max-length': '20',
        },
      }],
    }

    expect(jsonToSmsRfm(json)).toBe('::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="FirstName" max-length="20"}')
  })
})

describe('jsonToSmsRfm() — ::unsubscribe serialization', () => {
  it('collapses the two-node unsubscribe footer to ::unsubscribe', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [
        {
          type: 'message',
          text: '[Subscriber:unsubscribe_text]',
          attrs: { 'is-unsubscribe': true },
        },
        {
          type: 'placeholder',
          attrs: {
            type: 'Link',
            name: 'Unsubscribe',
            original: '[Link:Unsubscribe]',
            value: null,
            'is-unsubscribe': true,
          },
        },
      ],
    }

    expect(jsonToSmsRfm(json)).toBe('::unsubscribe')
  })

  it('message node with is-unsubscribe NOT followed by unsubscribe placeholder is emitted verbatim', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [
        {
          type: 'message',
          text: '[Subscriber:unsubscribe_text]',
          attrs: { 'is-unsubscribe': true },
        },
      ],
    }

    expect(jsonToSmsRfm(json)).toBe('[Subscriber:unsubscribe_text]')
  })

  it('full template with body and unsubscribe footer round-trips', () => {
    const json: SmsContentJson = {
      type: 'sms',
      content: [
        { type: 'message', text: 'Your order has shipped.\n' },
        {
          type: 'message',
          text: '[Subscriber:unsubscribe_text]',
          attrs: { 'is-unsubscribe': true },
        },
        {
          type: 'placeholder',
          attrs: {
            type: 'Link',
            name: 'Unsubscribe',
            original: '[Link:Unsubscribe]',
            value: null,
            'is-unsubscribe': true,
          },
        },
      ],
    }

    expect(jsonToSmsRfm(json)).toBe('Your order has shipped.\n::unsubscribe')
  })
})
