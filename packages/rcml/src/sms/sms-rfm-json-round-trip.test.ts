import { describe, it, expect } from 'vitest'
import { smsRfmToJson } from './sms-rfm-to-json.js'
import { jsonToSmsRfm } from './json-to-sms-rfm.js'
import type { SmsContentJson } from './content/json-validator/types.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Round-trip helper: parse SMS RFM → serialize back → parse again.
 * The two JSON documents must be deep-equal.
 */
function rt(input: string): { original: SmsContentJson; roundTripped: SmsContentJson } {
  const original = smsRfmToJson(input)
  const rfm = jsonToSmsRfm(original)
  const roundTripped = smsRfmToJson(rfm)

  return { original, roundTripped }
}

// ─── Plain text ───────────────────────────────────────────────────────────────

describe('jsonToSmsRfm — plain text', () => {
  it('round-trips a plain text message', () => {
    const { original, roundTripped } = rt('Hello world')

    expect(roundTripped).toEqual(original)
  })

  it('produces the original text verbatim', () => {
    expect(jsonToSmsRfm(smsRfmToJson('Hello world'))).toBe('Hello world')
  })

  it('round-trips multiple paragraphs (as single \\n boundary after flatten)', () => {
    // Paragraph boundaries collapse to \n in the flat model; rt() produces equivalent JSON.
    const { original, roundTripped } = rt('First\n\nSecond\n\nThird')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips an empty string', () => {
    const { original, roundTripped } = rt('')

    expect(roundTripped).toEqual(original)
  })
})

// ─── Placeholders ─────────────────────────────────────────────────────────────

describe('jsonToSmsRfm — placeholders', () => {
  it('round-trips a Subscriber placeholder', () => {
    const { original, roundTripped } = rt('[Subscriber:FirstName]')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips a CustomField placeholder', () => {
    const { original, roundTripped } = rt('[CustomField:Order.Total]')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips a User placeholder', () => {
    const { original, roundTripped } = rt('[User:CompanyName]')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips a RemoteContent placeholder', () => {
    const { original, roundTripped } = rt('[RemoteContent:https://api.example.com/banner]')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips a Date placeholder', () => {
    const { original, roundTripped } = rt('[Date:now::Y-m-d]')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips a Link placeholder', () => {
    const { original, roundTripped } = rt('[Link:Unsubscribe]')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips all placeholder types in one message', () => {
    const input = '[Subscriber:FirstName] [CustomField:Order.Total] [User:CompanyName] [Link:WebBrowser]'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })

  it('round-trips placeholder surrounded by text', () => {
    const input = 'Hi [Subscriber:FirstName], your total is [CustomField:Order.Total].'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })

  it('produces the original token verbatim', () => {
    expect(jsonToSmsRfm(smsRfmToJson('[Subscriber:FirstName]'))).toBe('[Subscriber:FirstName]')
  })
})

// ─── Line breaks ──────────────────────────────────────────────────────────────

describe('jsonToSmsRfm — line breaks', () => {
  it('round-trips a single newline in message text', () => {
    const { original, roundTripped } = rt('Line one\nLine two')

    expect(roundTripped).toEqual(original)
  })

  it('emits \\n for single newline', () => {
    expect(jsonToSmsRfm(smsRfmToJson('Line one\nLine two'))).toBe('Line one\nLine two')
  })

  it('round-trips a double newline (flattened to \\n in flat model)', () => {
    const { original, roundTripped } = rt('Para one\n\nPara two')

    expect(roundTripped).toEqual(original)
  })
})

// ─── Combined ─────────────────────────────────────────────────────────────────

describe('jsonToSmsRfm — combined constructs', () => {
  it('round-trips placeholder + newline + text', () => {
    const { original, roundTripped } = rt('Hi [Subscriber:FirstName]!\nYour order has shipped.')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips multi-paragraph with placeholders', () => {
    const input = 'Hello [Subscriber:FirstName],\n\nYour order [CustomField:Order.Id] is ready.\n\nClick [Link:WebBrowser] to view it.'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })
})

// ─── Direct JSON input ────────────────────────────────────────────────────────

describe('jsonToSmsRfm — direct JSON input', () => {
  it('returns a string for a valid SmsContentJson', () => {
    expect(typeof jsonToSmsRfm(smsRfmToJson('Hello'))).toBe('string')
  })
})

// ─── Link directive round-trips ───────────────────────────────────────────────

describe('sms-rfm-json round-trip — :link directive', () => {
  it('round-trips a basic :link directive with track+shorten', () => {
    const input = ':link[https://example.com]{track="true" shorten="true"}'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })

  it('round-trips :link with track="false" shorten="false"', () => {
    const input = ':link[https://example.com]{track="false" shorten="false"}'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })

  it('round-trips :link mixed with surrounding text', () => {
    const input = 'Your message here. :link[https://google.com]{track="true" shorten="true"} Test'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })

  it('round-trips :link in a multi-paragraph document', () => {
    const input = 'Hi [Subscriber:FirstName],\n\nClick :link[https://example.com]{track="true" shorten="true"} to view your order.'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })
})

// ─── ::placeholder directive round-trips ─────────────────────────────────────

describe('sms-rfm-json round-trip — ::placeholder directive', () => {
  it('round-trips ::placeholder with a resolved value', () => {
    const input = 'Hello ::placeholder{type="Subscriber" original="[Subscriber:FirstName]" name="FirstName" value="Jane" max-length=""}'
    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })

  it('serializes resolved placeholder as ::placeholder and parses back', () => {
    const initial = smsRfmToJson('::placeholder{type="CustomField" original="[CustomField:Address.Firstname]" name="Address.Firstname" value="77856" max-length=""}')
    const rfm = jsonToSmsRfm(initial)

    expect(rfm).toContain('::placeholder')
    expect(rfm).toContain('value="77856"')

    const reparsed = smsRfmToJson(rfm)

    expect(reparsed).toEqual(initial)
  })
})
