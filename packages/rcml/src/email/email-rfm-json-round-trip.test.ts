import { describe, it, expect } from 'vitest'
import { emailRfmToJson, emailInlineRfmToJson } from './email-rfm-to-json.js'
import { jsonToEmailRfm, jsonToEmailInlineRfm } from './json-to-email-rfm.js'
import type { Json } from './validate-rcml-json.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Round-trip helper: parse RFM → convert back to markdown → parse again.
 * The two resulting JSON documents must be deep-equal.
 */
function rt(input: string): { original: Json; roundTripped: Json } {
  const original = emailRfmToJson(input)
  const md = jsonToEmailRfm(original)
  const roundTripped = emailRfmToJson(md)

  return { original, roundTripped }
}

// ─── jsonToEmailRfm — plain text ───────────────────────────────────────────────────

describe('jsonToEmailRfm — plain text', () => {
  it('round-trips a plain text paragraph', () => {
    const { original, roundTripped } = rt('Hello world')

    expect(roundTripped).toEqual(original)
  })

  it('produces the original text verbatim', () => {
    expect(jsonToEmailRfm(emailRfmToJson('Hello world'))).toBe('Hello world')
  })

  it('round-trips multiple paragraphs', () => {
    const { original, roundTripped } = rt('First\n\nSecond\n\nThird')

    expect(roundTripped).toEqual(original)
  })

  it('separates paragraphs with double newline', () => {
    expect(jsonToEmailRfm(emailRfmToJson('First\n\nSecond'))).toBe('First\n\nSecond')
  })
})

// ─── jsonToEmailRfm — :font ────────────────────────────────────────────────────────

describe('jsonToEmailRfm — :font', () => {
  it('round-trips font-weight', () => {
    const { original, roundTripped } = rt(':font[bold text]{font-weight="bold"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips multiple font attrs', () => {
    const { original, roundTripped } = rt(':font[text]{font-weight="bold" font-size="16px" color="#ff0000"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips font-style italic', () => {
    const { original, roundTripped } = rt(':font[text]{font-style="italic"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips text-decoration underline', () => {
    const { original, roundTripped } = rt(':font[text]{text-decoration="underline"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips mixed font+text in a paragraph', () => {
    const { original, roundTripped } = rt('Hello :font[world]{font-weight="bold"} again')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — :link ────────────────────────────────────────────────────────

describe('jsonToEmailRfm — :link', () => {
  it('round-trips a basic link', () => {
    const { original, roundTripped } = rt(':link[click here]{href="https://example.com"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips link with target="_blank"', () => {
    const { original, roundTripped } = rt(':link[text]{href="https://x.com" target="_blank"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips link with no-tracked="true"', () => {
    const { original, roundTripped } = rt(':link[text]{href="https://x.com" no-tracked="true"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips link with all options', () => {
    const { original, roundTripped } = rt(':link[go]{href="https://x.com" target="_blank" no-tracked="true"}')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — nested marks ─────────────────────────────────────────────────

describe('jsonToEmailRfm — nested marks', () => {
  it('round-trips font inside link', () => {
    const { original, roundTripped } = rt(':link[:font[bold]{font-weight="bold"}]{href="https://x.com"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips adjacent text with shared link mark', () => {
    // "Hello " (link only) + "World" (link + font) — both share link as outermost
    const { original, roundTripped } = rt(':link[Hello :font[World]{font-weight="bold"}]{href="https://x.com"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips font wrapping link', () => {
    const { original, roundTripped } = rt(':font[:link[text]{href="https://x.com"}]{font-weight="bold"}')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — bullet list ──────────────────────────────────────────────────

describe('jsonToEmailRfm — bullet list', () => {
  it('round-trips a simple bullet list', () => {
    const { original, roundTripped } = rt('- item one\n- item two\n- item three')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips nested bullet list', () => {
    const { original, roundTripped } = rt('- parent\n  - child')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips list item with :font inside', () => {
    const { original, roundTripped } = rt('- :font[bold item]{font-weight="bold"}')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — ordered list ─────────────────────────────────────────────────

describe('jsonToEmailRfm — ordered list', () => {
  it('round-trips a simple ordered list', () => {
    const { original, roundTripped } = rt('1. first\n2. second\n3. third')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — :::align ─────────────────────────────────────────────────────

describe('jsonToEmailRfm — :::align', () => {
  it('round-trips align center', () => {
    const { original, roundTripped } = rt(':::align{value="center"}\nHello\n:::')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips align right', () => {
    const { original, roundTripped } = rt(':::align{value="right"}\nHello\n:::')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips align with multiple inner blocks', () => {
    const { original, roundTripped } = rt(':::align{value="right"}\nPara one\n\nPara two\n:::')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — ::placeholder ────────────────────────────────────────────────

describe('jsonToEmailRfm — ::placeholder', () => {
  it('round-trips placeholder with all attrs', () => {
    const { original, roundTripped } = rt('::placeholder{type="CustomField" value="val" name="myField" original="orig"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips placeholder without value (null)', () => {
    const { original, roundTripped } = rt('::placeholder{type="Subscriber" name="n" original="o"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips placeholder with max-length', () => {
    const { original, roundTripped } = rt('::placeholder{type="CustomField" value="v" name="n" original="o" max-length="255"}')

    expect(roundTripped).toEqual(original)
  })

  it('round-trips all placeholder types', () => {
    const types = ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date'] as const

    for (const type of types) {
      const { original, roundTripped } = rt(`::placeholder{type="${type}" value="v" name="n" original="o"}`)

      expect(roundTripped).toEqual(original)
    }
  })
})

// ─── jsonToEmailRfm — ::loop-value ─────────────────────────────────────────────────

describe('jsonToEmailRfm — ::loop-value', () => {
  it('round-trips loop-value', () => {
    const { original, roundTripped } = rt('::loop-value{original="orig" value="val" index="0"}')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — hard break ───────────────────────────────────────────────────

describe('jsonToEmailRfm — hard break', () => {
  it('round-trips a paragraph with a hard break', () => {
    const { original, roundTripped } = rt('line one\\\nline two')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — complex documents ───────────────────────────────────────────

describe('jsonToEmailRfm — complex documents', () => {
  it('round-trips a document with align, font, link, and placeholder', () => {
    const input = [
      ':::align{value="center"}',
      'Hello :font[world]{font-weight="bold"}',
      ':::',
      '',
      ':link[click here]{href="https://example.com" target="_blank"}',
      '',
      '::placeholder{type="Subscriber" name="First name" original="[sub:fn]"}',
    ].join('\n')

    const { original, roundTripped } = rt(input)

    expect(roundTripped).toEqual(original)
  })

  it('round-trips a document with bullet and ordered lists', () => {
    const { original, roundTripped } = rt('- one\n- two\n\n1. first\n2. second')

    expect(roundTripped).toEqual(original)
  })
})

// ─── jsonToEmailRfm — direct JSON input ───────────────────────────────────────────

describe('jsonToEmailRfm — direct JSON input', () => {
  it('returns a string for a doc with a single paragraph', () => {
    expect(typeof jsonToEmailRfm(emailRfmToJson('Hello'))).toBe('string')
  })
})

// ─── jsonToEmailInlineRfm ──────────────────────────────────────────────────────────

describe('jsonToEmailInlineRfm', () => {
  it('round-trips plain text', () => {
    const json = emailInlineRfmToJson('Hello world')

    expect(emailInlineRfmToJson(jsonToEmailInlineRfm(json))).toEqual(json)
  })

  it('round-trips :font', () => {
    const json = emailInlineRfmToJson(':font[bold]{font-weight="bold"}')

    expect(emailInlineRfmToJson(jsonToEmailInlineRfm(json))).toEqual(json)
  })

  it('round-trips :link', () => {
    const json = emailInlineRfmToJson(':link[click]{href="https://example.com"}')

    expect(emailInlineRfmToJson(jsonToEmailInlineRfm(json))).toEqual(json)
  })

  it('round-trips ::placeholder', () => {
    const json = emailInlineRfmToJson('::placeholder{type="Subscriber" name="n" original="o"}')

    expect(emailInlineRfmToJson(jsonToEmailInlineRfm(json))).toEqual(json)
  })

  it('round-trips ::loop-value', () => {
    const json = emailInlineRfmToJson('::loop-value{original="orig" value="val" index="0"}')

    expect(emailInlineRfmToJson(jsonToEmailInlineRfm(json))).toEqual(json)
  })

  it('produces the same result as jsonToEmailRfm for Email Inline RFM content', () => {
    const json = emailInlineRfmToJson(':font[hello]{font-weight="bold"}')

    expect(jsonToEmailInlineRfm(json)).toBe(jsonToEmailRfm(json))
  })
})
