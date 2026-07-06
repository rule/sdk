import { describe, it, expect } from 'vitest'
import { validateJson, safeParseJson, JsonParseError } from '../../validate-rcml-json.js'
import { emailRfmToJson, emailInlineRfmToJson } from '../../email-rfm-to-json.js'
import { emailRfmConfig } from '../flavors/email-rfm.js'
import { emailInlineRfmConfig } from '../flavors/email-inline-rfm.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validDoc(...blocks: unknown[]) {
  return { type: 'doc', content: blocks }
}

function paragraph(...inlines: unknown[]) {
  return inlines.length > 0
    ? { type: 'paragraph', content: inlines }
    : { type: 'paragraph' }
}

function text(value: string, marks?: unknown[]) {
  return marks ? { type: 'text', text: value, marks } : { type: 'text', text: value }
}

function fontMark(attrs: Record<string, unknown> = {}) {
  return {
    type: 'font',
    attrs: {
      'font-family': null,
      'font-size': null,
      'line-height': null,
      'letter-spacing': null,
      'font-style': null,
      'font-weight': null,
      'text-decoration': null,
      color: null,
      ...attrs,
    },
  }
}

function linkMark(href: string, extras: Record<string, unknown> = {}) {
  return {
    type: 'link',
    attrs: { href, target: null, 'no-tracked': 'false', ...extras },
  }
}

function placeholder(type: string, extras: Record<string, unknown> = {}) {
  return {
    type: 'placeholder',
    attrs: {
      type,
      value: null,
      name: 'Field',
      original: '[orig]',
      'max-length': null,
      ...extras,
    },
  }
}

function loopValue() {
  return {
    type: 'loop-value',
    attrs: { original: 'orig', value: 'val', index: '0' },
  }
}

function hardbreak() {
  return { type: 'hardbreak', attrs: { isInline: false } }
}

// ─── Valid inputs ─────────────────────────────────────────────────────────────

describe('validateJson — valid inputs', () => {
  it('accepts a doc with a single empty paragraph', () => {
    const doc = validDoc(paragraph())

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a doc with a paragraph containing plain text', () => {
    const doc = validDoc(paragraph(text('Hello world')))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a text node with a font mark (bold)', () => {
    const doc = validDoc(paragraph(text('Bold', [fontMark({ 'font-weight': 'bold' })])))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a text node with a font mark (italic)', () => {
    const doc = validDoc(paragraph(text('Italic', [fontMark({ 'font-style': 'italic' })])))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a text node with a font mark (color)', () => {
    const doc = validDoc(paragraph(text('Red', [fontMark({ color: '#ff0000' })])))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a text node with a link mark', () => {
    const doc = validDoc(paragraph(text('Click', [linkMark('https://example.com')])))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a link mark with target="_blank"', () => {
    const doc = validDoc(
      paragraph(text('Link', [linkMark('https://x.com', { target: '_blank' })])),
    )

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a link mark with no-tracked="true"', () => {
    const doc = validDoc(
      paragraph(text('Link', [linkMark('https://x.com', { 'no-tracked': 'true' })])),
    )

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a text node with both font and link marks', () => {
    const doc = validDoc(
      paragraph(text('Both', [fontMark({ 'font-weight': 'bold' }), linkMark('https://x.com')])),
    )

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a hardbreak node', () => {
    const doc = validDoc(paragraph(text('before'), hardbreak(), text('after')))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a bullet-list with one item', () => {
    const doc = validDoc({
      type: 'bullet-list',
      attrs: { spread: false },
      content: [
        {
          type: 'list-item',
          attrs: { label: '•', 'list-type': 'bullet', spread: 'true' },
          content: [paragraph(text('item'))],
        },
      ],
    })

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts an ordered-list', () => {
    const doc = validDoc({
      type: 'ordered-list',
      attrs: { order: 1, spread: false },
      content: [
        {
          type: 'list-item',
          attrs: { label: '1.', 'list-type': 'ordered', spread: 'false' },
          content: [paragraph(text('first'))],
        },
      ],
    })

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts an align node', () => {
    const doc = validDoc({
      type: 'align',
      attrs: { value: 'center' },
      content: [paragraph(text('centered'))],
    })

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts align with value="left"', () => {
    const doc = validDoc({ type: 'align', attrs: { value: 'left' }, content: [paragraph()] })

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts align with value="right"', () => {
    const doc = validDoc({ type: 'align', attrs: { value: 'right' }, content: [paragraph()] })

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a placeholder node (CustomField)', () => {
    const doc = validDoc(paragraph(placeholder('CustomField')))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a placeholder node (Subscriber)', () => {
    const doc = validDoc(paragraph(placeholder('Subscriber', { value: 'first_name', name: 'First name' })))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a placeholder node (User)', () => {
    const doc = validDoc(paragraph(placeholder('User')))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a placeholder node (RemoteContent)', () => {
    const doc = validDoc(paragraph(placeholder('RemoteContent')))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a placeholder node (Date)', () => {
    const doc = validDoc(paragraph(placeholder('Date')))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a placeholder with a numeric value', () => {
    const doc = validDoc(paragraph(placeholder('CustomField', { value: 42 })))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a placeholder with max-length set', () => {
    const doc = validDoc(
      paragraph(
        placeholder('CustomField', { 'max-length': '255' }),
      ),
    )

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts a loop-value node', () => {
    const doc = validDoc(paragraph(loopValue()))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('accepts multiple paragraphs', () => {
    const doc = validDoc(paragraph(text('one')), paragraph(text('two')), paragraph(text('three')))

    expect(() => validateJson(doc)).not.toThrow()
  })

  it('returns the input cast to Json on success', () => {
    const doc = validDoc(paragraph(text('Hello')))
    const result = validateJson(doc)

    expect(result).toBe(doc)
  })
})

// ─── safeParseJson — valid ────────────────────────────────────────────────────

describe('safeParseJson — valid inputs', () => {
  it('returns success: true for a valid doc', () => {
    const doc = validDoc(paragraph(text('Hello')))
    const result = safeParseJson(doc)

    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(doc)
  })

  it('returns the original object as data', () => {
    const doc = validDoc(paragraph(text('test')))
    const result = safeParseJson(doc)

    expect(result.success && result.data === doc).toBe(true)
  })
})

// ─── Invalid inputs ───────────────────────────────────────────────────────────

describe('validateJson — unknown node type', () => {
  it('rejects a doc with an unknown block type', () => {
    const doc = validDoc({ type: 'section', content: [] })

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a paragraph with an unknown inline type', () => {
    const doc = validDoc(paragraph({ type: 'image', src: 'x.png' }))

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects an unknown mark type', () => {
    const doc = validDoc(paragraph(text('x', [{ type: 'bold' }])))

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })
})

describe('validateJson — unknown properties', () => {
  it('rejects a doc with an extra property at the root', () => {
    const doc = { type: 'doc', content: [paragraph(text('x'))], extra: true }

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a paragraph with an unknown extra property', () => {
    const doc = validDoc({ type: 'paragraph', content: [text('x')], id: '123' })

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a text node with an unknown property', () => {
    const doc = validDoc(paragraph({ type: 'text', text: 'x', bold: true }))

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a font mark with an unknown attr', () => {
    const doc = validDoc(
      paragraph(
        text('x', [
          {
            type: 'font',
            attrs: {
              'font-family': null,
              'font-size': null,
              'line-height': null,
              'letter-spacing': null,
              'font-style': null,
              'font-weight': 'bold',
              'text-decoration': null,
              color: null,
              unknown: 'extra',
            },
          },
        ]),
      ),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })
})

describe('validateJson — missing required fields', () => {
  it('rejects a text node without "text" field', () => {
    const doc = validDoc(paragraph({ type: 'text' }))

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a link mark without "href"', () => {
    const doc = validDoc(
      paragraph(
        text('x', [{ type: 'link', attrs: { target: null, 'no-tracked': 'false' } }]),
      ),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a placeholder without "name" attr', () => {
    const doc = validDoc(
      paragraph({
        type: 'placeholder',
        attrs: { type: 'CustomField', value: null, original: 'orig', 'max-length': null },
      }),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a loop-value with missing "index" attr', () => {
    const doc = validDoc(
      paragraph({ type: 'loop-value', attrs: { original: 'o', value: 'v' } }),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a bullet-list without "content"', () => {
    const doc = validDoc({ type: 'bullet-list', attrs: { spread: false } })

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a doc with no "content"', () => {
    expect(() => validateJson({ type: 'doc' })).toThrow(JsonParseError)
  })
})

describe('validateJson — invalid attr values', () => {
  it('rejects font-style with an invalid value', () => {
    const doc = validDoc(
      paragraph(text('x', [fontMark({ 'font-style': 'oblique' })])),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects text-decoration with an invalid value', () => {
    const doc = validDoc(
      paragraph(text('x', [fontMark({ 'text-decoration': 'blink' })])),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects align with an invalid value attr', () => {
    const doc = validDoc({ type: 'align', attrs: { value: 'justify' }, content: [paragraph()] })

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a link mark with no-tracked as a boolean', () => {
    const doc = validDoc(
      paragraph(text('x', [{ type: 'link', attrs: { href: 'https://x.com', target: null, 'no-tracked': true } }])),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a placeholder with an unknown type attr', () => {
    const doc = validDoc(
      paragraph({
        type: 'placeholder',
        attrs: { type: 'Unknown', value: null, name: 'x', original: 'o', 'max-length': null },
      }),
    )

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })
})

describe('validateJson — invalid nesting', () => {
  it('rejects inline node directly as doc content', () => {
    const doc = { type: 'doc', content: [text('Hello')] }

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects a doc with empty content array', () => {
    expect(() => validateJson({ type: 'doc', content: [] })).toThrow(JsonParseError)
  })

  it('rejects a bullet-list with empty content array', () => {
    const doc = validDoc({ type: 'bullet-list', attrs: { spread: false }, content: [] })

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })
})

describe('validateJson — malformed arrays', () => {
  it('rejects when content is a string', () => {
    const doc = { type: 'doc', content: 'not an array' }

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects when marks is a string', () => {
    const doc = validDoc(paragraph({ type: 'text', text: 'x', marks: 'bold' }))

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })

  it('rejects when content is a number', () => {
    const doc = { type: 'doc', content: 42 }

    expect(() => validateJson(doc)).toThrow(JsonParseError)
  })
})

describe('validateJson — malformed inputs', () => {
  it('rejects a bare string', () => {
    expect(() => validateJson('Hello world')).toThrow(JsonParseError)
  })

  it('rejects null', () => {
    expect(() => validateJson(null)).toThrow(JsonParseError)
  })

  it('rejects a number', () => {
    expect(() => validateJson(42)).toThrow(JsonParseError)
  })

  it('rejects an empty object', () => {
    expect(() => validateJson({})).toThrow(JsonParseError)
  })

  it('rejects an array', () => {
    expect(() => validateJson([])).toThrow(JsonParseError)
  })

  it('rejects a doc with wrong root type', () => {
    expect(() => validateJson({ type: 'document', content: [paragraph()] })).toThrow(JsonParseError)
  })

  it('rejects LLM-style plain text JSON', () => {
    expect(() => validateJson('{ "type": "doc" }')).toThrow(JsonParseError)
  })
})

describe('safeParseJson — invalid inputs', () => {
  it('returns success: false for invalid input', () => {
    const result = safeParseJson(null)

    expect(result.success).toBe(false)
  })

  it('returns errors array for invalid input', () => {
    const result = safeParseJson({ type: 'unknown', content: [] })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors.length).toBeGreaterThan(0)
  })

  it('errors include a path', () => {
    const result = safeParseJson(validDoc(paragraph({ type: 'text' })))

    expect(result.success).toBe(false)

    if (!result.success) {
      const paths = result.errors.map((e) => e.path)

      expect(paths.some((p) => p.length > 0 || typeof p === 'string')).toBe(true)
    }
  })

  it('errors include a message', () => {
    const result = safeParseJson(null)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors[0]?.message).toBeTruthy()
    }
  })
})

// ─── JsonParseError ───────────────────────────────────────────────────────────

describe('JsonParseError', () => {
  it('is an instance of Error', () => {
    try {
      validateJson(null)
    } catch (err) {
      expect(err).toBeInstanceOf(Error)
    }
  })

  it('has .errors array', () => {
    try {
      validateJson(null)
    } catch (err) {
      expect(err).toBeInstanceOf(JsonParseError)

      if (err instanceof JsonParseError) {
        expect(Array.isArray(err.errors)).toBe(true)
      }
    }
  })

  it('has name "JsonParseError"', () => {
    try {
      validateJson(null)
    } catch (err) {
      if (err instanceof JsonParseError) {
        expect(err.name).toBe('JsonParseError')
      }
    }
  })
})

// ─── Integration: markdown → pipeline → validateJson ─────────────────────────

describe('integration — full pipeline output passes validateJson', () => {
  it('plain text', () => {
    const json = emailRfmToJson('Hello world')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('bold text via :font', () => {
    const json = emailRfmToJson(':font[bold]{font-weight="bold"}')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('italic text', () => {
    const json = emailRfmToJson(':font[italic]{font-style="italic"}')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('link', () => {
    const json = emailRfmToJson(':link[click]{href="https://example.com"}')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('link with target and no-tracked', () => {
    const json = emailRfmToJson(':link[click]{href="https://x.com" target="_blank" no-tracked="true"}')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('bullet list', () => {
    const json = emailRfmToJson('- one\n- two\n- three')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('ordered list', () => {
    const json = emailRfmToJson('1. first\n2. second')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('align block', () => {
    const json = emailRfmToJson(':::align{value="center"}\nCentered text\n:::')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('placeholder', () => {
    const json = emailRfmToJson(
      '::placeholder{type="Subscriber" value="first_name" name="First name" original="[sub:fn]"}',
    )

    expect(() => validateJson(json)).not.toThrow()
  })

  it('loop-value', () => {
    const json = emailRfmToJson('::loop-value{original="orig" value="val" index="0"}')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('multiple paragraphs', () => {
    const json = emailRfmToJson('First paragraph\n\nSecond paragraph\n\nThird paragraph')

    expect(() => validateJson(json)).not.toThrow()
  })

  it('complex: align with link and placeholder', () => {
    const input = [
      ':::align{value="center"}',
      'Hello :link[click here]{href="https://example.com" target="_blank" no-tracked="false"}',
      '::placeholder{type="Subscriber" value="first_name" name="First name" original="[sub:fn]"}',
      ':::',
    ].join('\n')

    const json = emailRfmToJson(input)

    expect(() => validateJson(json)).not.toThrow()
  })

  it('safeParseJson wraps pipeline output successfully', () => {
    const json = emailRfmToJson('Hello world')
    const result = safeParseJson(json)

    expect(result.success).toBe(true)
  })
})

// ─── Flavor-aware structural validation ───────────────────────────────────────

describe('validateJson — emailInlineRfmConfig rejects disallowed nodes', () => {
  it('rejects a bullet-list', () => {
    const json = emailRfmToJson('- one\n- two')
    const result = safeParseJson(json, emailInlineRfmConfig)

    expect(result.success).toBe(false)
  })

  it('rejects an ordered-list', () => {
    const json = emailRfmToJson('1. first\n2. second')
    const result = safeParseJson(json, emailInlineRfmConfig)

    expect(result.success).toBe(false)
  })

  it('rejects an align block', () => {
    const json = emailRfmToJson(':::align{value="center"}\nHello\n:::')
    const result = safeParseJson(json, emailInlineRfmConfig)

    expect(result.success).toBe(false)
  })

  it('rejects a hardbreak node', () => {
    // hardbreak is produced by a line break in a list item — simulate directly
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'before' },
            { type: 'hardbreak', attrs: { isInline: false } },
            { type: 'text', text: 'after' },
          ],
        },
      ],
    }

    expect(safeParseJson(doc, emailInlineRfmConfig).success).toBe(false)
  })
})

describe('validateJson — emailInlineRfmConfig accepts allowed nodes', () => {
  it('accepts a plain paragraph', () => {
    const json = emailInlineRfmToJson('Hello world')

    expect(safeParseJson(json, emailInlineRfmConfig).success).toBe(true)
  })

  it('accepts text with a font mark', () => {
    const json = emailInlineRfmToJson(':font[bold]{font-weight="bold"}')

    expect(safeParseJson(json, emailInlineRfmConfig).success).toBe(true)
  })

  it('accepts text with a link mark', () => {
    const json = emailInlineRfmToJson(':link[click]{href="https://example.com"}')

    expect(safeParseJson(json, emailInlineRfmConfig).success).toBe(true)
  })

  it('accepts a placeholder', () => {
    const json = emailInlineRfmToJson(
      '::placeholder{type="Subscriber" value="fn" name="First name" original="[sub:fn]"}',
    )

    expect(safeParseJson(json, emailInlineRfmConfig).success).toBe(true)
  })

  it('accepts a loop-value', () => {
    const json = emailInlineRfmToJson('::loop-value{original="o" value="v" index="0"}')

    expect(safeParseJson(json, emailInlineRfmConfig).success).toBe(true)
  })
})

describe('validateJson — emailRfmConfig accepts all node types', () => {
  it('accepts a bullet-list', () => {
    const json = emailRfmToJson('- one\n- two')

    expect(safeParseJson(json, emailRfmConfig).success).toBe(true)
  })

  it('accepts an ordered-list', () => {
    const json = emailRfmToJson('1. first\n2. second')

    expect(safeParseJson(json, emailRfmConfig).success).toBe(true)
  })

  it('accepts an align block', () => {
    const json = emailRfmToJson(':::align{value="center"}\nHello\n:::')

    expect(safeParseJson(json, emailRfmConfig).success).toBe(true)
  })

  it('accepts a placeholder', () => {
    const json = emailRfmToJson(
      '::placeholder{type="Date" value="v" name="n" original="o"}',
    )

    expect(safeParseJson(json, emailRfmConfig).success).toBe(true)
  })
})

describe('validateJson — no config falls back to full schema', () => {
  it('accepts a bullet-list without config', () => {
    const json = emailRfmToJson('- item')

    expect(safeParseJson(json).success).toBe(true)
  })

  it('accepts align without config', () => {
    const json = emailRfmToJson(':::align{value="left"}\ntext\n:::')

    expect(safeParseJson(json).success).toBe(true)
  })
})

describe('validateJson — validator is cached per FlavorConfig reference', () => {
  it('calling twice with same config object does not throw', () => {
    const json = emailRfmToJson('Hello')

    expect(() => {
      safeParseJson(json, emailInlineRfmConfig)
      safeParseJson(json, emailInlineRfmConfig)
    }).not.toThrow()
  })
})

describe('validateJson — emailInlineRfmConfig rejects multiple paragraphs', () => {
  it('rejects two paragraphs', () => {
    const doc = validDoc(paragraph(text('one')), paragraph(text('two')))

    expect(safeParseJson(doc, emailInlineRfmConfig).success).toBe(false)
  })

  it('rejects three paragraphs', () => {
    const doc = validDoc(paragraph(text('a')), paragraph(text('b')), paragraph(text('c')))

    expect(safeParseJson(doc, emailInlineRfmConfig).success).toBe(false)
  })

  it('accepts a single paragraph', () => {
    const doc = validDoc(paragraph(text('Hello')))

    expect(safeParseJson(doc, emailInlineRfmConfig).success).toBe(true)
  })

  it('emailRfmConfig still accepts multiple paragraphs', () => {
    const doc = validDoc(paragraph(text('one')), paragraph(text('two')))

    expect(safeParseJson(doc, emailRfmConfig).success).toBe(true)
  })
})

describe('validateJson — config with no text directives rejects marks', () => {
  it('rejects a font mark when config has no allowed text directives', () => {
    const noMarksConfig = {
      name: 'NoMarks',
      allowedBlockNodes: new Set<string>(),
      allowedTextDirectives: new Map<string, null>(),
      allowedLeafDirectives: new Map<string, null>(),
      allowedContainerDirectives: new Map<string, null>(),
    }
    const doc = validDoc(paragraph(text('x', [fontMark({ 'font-weight': 'bold' })])))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => validateJson(doc, noMarksConfig as any)).toThrow(JsonParseError)
  })
})
