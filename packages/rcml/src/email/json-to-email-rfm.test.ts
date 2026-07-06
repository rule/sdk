import { describe, expect, it } from 'vitest'
import { jsonToEmailRfm, jsonToEmailInlineRfm } from './json-to-email-rfm.js'
import type { Json } from './validate-rcml-json.js'

/**
 * Direct serializer tests: hand-crafted JSON input → expected RFM markdown.
 *
 * Round-trip equivalence (RFM → JSON → RFM → JSON) lives in
 * `rfm-json-round-trip.test.ts`. Tests in this file deliberately skip the
 * parse step so they catch serializer regressions that happen to round-trip
 * by coincidence.
 */

function paragraph(...children: unknown[]): unknown {
  return { type: 'paragraph', content: children }
}

function text(value: string): unknown {
  return { type: 'text', text: value }
}

function doc(...blocks: unknown[]): Json {
  return { type: 'doc', content: blocks } as Json
}

describe('jsonToEmailRfm', () => {
  it('serializes a plain-text paragraph', () => {
    expect(jsonToEmailRfm(doc(paragraph(text('Hello world'))))).toBe('Hello world')
  })

  it('joins multiple block paragraphs with a blank line', () => {
    expect(jsonToEmailRfm(doc(paragraph(text('First')), paragraph(text('Second'))))).toBe('First\n\nSecond')
  })

  it('emits a :font directive for a text node carrying a font mark', () => {
    const json = doc(
      paragraph({
        type: 'text',
        text: 'bold',
        marks: [
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
            },
          },
        ],
      }),
    )
    const out = jsonToEmailRfm(json)

    expect(out).toContain(':font[bold]')
    expect(out).toContain('font-weight="bold"')
  })

  it('emits a :link directive for a link-marked text run', () => {
    const json = doc(
      paragraph({
        type: 'text',
        text: 'click',
        marks: [
          {
            type: 'link',
            attrs: { href: 'https://example.com', target: null, 'no-tracked': null },
          },
        ],
      }),
    )
    const out = jsonToEmailRfm(json)

    expect(out).toContain(':link[click]')
    expect(out).toContain('href="https://example.com"')
  })

  it('serializes a bullet list with multiple items', () => {
    const json = doc({
      type: 'bullet-list',
      attrs: { spread: false },
      content: [
        {
          type: 'list-item',
          attrs: { label: null, 'list-type': 'bullet', spread: false },
          content: [paragraph(text('one'))],
        },
        {
          type: 'list-item',
          attrs: { label: null, 'list-type': 'bullet', spread: false },
          content: [paragraph(text('two'))],
        },
      ],
    })
    const out = jsonToEmailRfm(json)

    expect(out).toContain('- one')
    expect(out).toContain('- two')
  })

  it('serializes an ordered list starting at 1', () => {
    const json = doc({
      type: 'ordered-list',
      attrs: { order: 1, spread: false },
      content: [
        {
          type: 'list-item',
          attrs: { label: null, 'list-type': 'ordered', spread: false },
          content: [paragraph(text('first'))],
        },
      ],
    })

    expect(jsonToEmailRfm(json)).toContain('1. first')
  })

  it('serializes an :::align block', () => {
    const json = doc({
      type: 'align',
      attrs: { value: 'center' },
      content: [paragraph(text('centered'))],
    })
    const out = jsonToEmailRfm(json)

    expect(out).toContain(':::align{value="center"}')
    expect(out).toContain('centered')
  })

  it('serializes a ::placeholder leaf directive', () => {
    const json = doc(
      paragraph(
        text('Hi '),
        {
          type: 'placeholder',
          attrs: {
            type: 'Subscriber',
            value: 'first_name',
            name: 'first_name',
            original: 'first_name',
            'max-length': null,
          },
        },
      ),
    )
    const out = jsonToEmailRfm(json)

    expect(out).toContain('::placeholder')
    expect(out).toContain('type="Subscriber"')
    expect(out).toContain('name="first_name"')
  })

  it('returns an empty string for an empty document', () => {
    expect(jsonToEmailRfm(doc())).toBe('')
  })
})

describe('jsonToEmailInlineRfm', () => {
  it('serializes a plain-text paragraph', () => {
    expect(jsonToEmailInlineRfm(doc(paragraph(text('Hello'))))).toBe('Hello')
  })

  it('produces the same output as jsonToEmailRfm for inline-RFM-compatible content', () => {
    const json = doc(paragraph(text('Hello')))

    expect(jsonToEmailInlineRfm(json)).toBe(jsonToEmailRfm(json))
  })
})
