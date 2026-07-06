import { describe, it, expect } from 'vitest'
import { validateSmsJson, safeParseSmsJson, SmsContentParseError } from './validate-sms-json.js'
import { smsRfmToJson } from './sms-rfm-to-json.js'

describe('validateSmsJson()', () => {
  it('accepts a valid empty doc from smsRfmToJson', () => {
    expect(() => validateSmsJson(smsRfmToJson(''))).not.toThrow()
  })

  it('accepts a valid doc with text', () => {
    expect(() => validateSmsJson(smsRfmToJson('Hello [Subscriber:FirstName]'))).not.toThrow()
  })

  it('rejects a Link placeholder without is-unsubscribe (shorthand parse-only path)', () => {
    // [Link:Unsubscribe] shorthand produces a Link placeholder without is-unsubscribe: true.
    // The validator should reject it — Link type is only valid via ::unsubscribe.
    const doc = smsRfmToJson('[Link:Unsubscribe]')

    expect(() => validateSmsJson(doc)).toThrow(SmsContentParseError)
  })

  it('accepts a tracked+shortened link node', () => {
    const doc = {
      type: 'sms',
      content: [
        {
          type: 'link',
          text: 'https://example.com',
          attrs: { track: true, shorten: true },
        },
      ],
    }

    expect(() => validateSmsJson(doc)).not.toThrow()
  })

  it('accepts an untracked+unshortened link node', () => {
    const doc = {
      type: 'sms',
      content: [
        {
          type: 'link',
          text: 'https://example.com',
          attrs: { track: false, shorten: false },
        },
      ],
    }

    expect(() => validateSmsJson(doc)).not.toThrow()
  })

  it('rejects track:true with shorten:false', () => {
    const doc = {
      type: 'sms',
      content: [
        {
          type: 'link',
          text: 'https://example.com',
          attrs: { track: true, shorten: false },
        },
      ],
    }

    expect(() => validateSmsJson(doc)).toThrow(SmsContentParseError)
  })

  it('rejects a missing type field', () => {
    expect(() => validateSmsJson({ content: [] })).toThrow(SmsContentParseError)
  })

  it('rejects unknown node type', () => {
    const doc = {
      type: 'sms',
      content: [{ type: 'paragraph', content: [] }],
    }

    expect(() => validateSmsJson(doc)).toThrow(SmsContentParseError)
  })

  it('rejects extra properties on placeholder attrs', () => {
    const doc = {
      type: 'sms',
      content: [
        {
          type: 'placeholder',
          attrs: {
            type: 'Subscriber',
            name: 'FirstName',
            original: '[Subscriber:FirstName]',
            value: null,
            extra: 'oops',
          },
        },
      ],
    }

    expect(() => validateSmsJson(doc)).toThrow(SmsContentParseError)
  })

  it('rejects old doc/paragraph format', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'hello' }],
        },
      ],
    }

    expect(() => validateSmsJson(doc)).toThrow(SmsContentParseError)
  })
})

describe('safeParseSmsJson()', () => {
  it('returns success for valid input', () => {
    const result = safeParseSmsJson(smsRfmToJson('Hello'))

    expect(result.success).toBe(true)
  })

  it('returns failure with errors for invalid input', () => {
    const result = safeParseSmsJson({ type: 'wrong' })

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors.length).toBeGreaterThan(0)
    }
  })
})

describe('validateSmsJson() — is-unsubscribe', () => {
  it('accepts a placeholder with is-unsubscribe: true', () => {
    const doc = {
      type: 'sms',
      content: [
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

    expect(() => validateSmsJson(doc)).not.toThrow()
  })

  it('accepts a message node with is-unsubscribe: true', () => {
    const doc = {
      type: 'sms',
      content: [
        {
          type: 'message',
          text: '[Subscriber:unsubscribe_text]',
          attrs: { 'is-unsubscribe': true },
        },
      ],
    }

    expect(() => validateSmsJson(doc)).not.toThrow()
  })
})
