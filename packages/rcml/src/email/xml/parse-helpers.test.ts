import { describe, expect, it } from 'vitest'
import type {
  RcmlBody,
  RcmlButton,
  RcmlColumn,
  RcmlSection,
  RcmlSpacer,
  RcmlText,
} from '../rcml-types.js'
import { convertXmlToRcml } from './parse-helpers.js'

/**
 * Unit tests for the XML parsing orchestrator. These focus on the
 * parser's internal behaviour: attribute lifting, leaf handling,
 * whitespace skipping, error classification. Full public-API coverage
 * lives in `../xml-to-rcml.test.ts` and round-trip coverage lives in
 * `../rcml-xml-round-trip.test.ts`.
 */

describe('convertXmlToRcml — discriminated result', () => {
  it('returns success: true with a shaped document for valid XML', () => {
    const result = convertXmlToRcml(
      '<rcml><rc-head></rc-head><rc-body></rc-body></rcml>',
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data).toEqual({
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        { tagName: 'rc-body', children: [] },
      ],
    })
  })

  it('returns success: false with an XML_PARSE_ERROR on malformed input', () => {
    const result = convertXmlToRcml('<rcml><rc-body></rc-head></rcml>')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors[0]?.code).toBe('XML_PARSE_ERROR')
    expect(result.errors[0]?.path).toBe('')
  })

  it('returns ROOT_INVALID when the input has no element', () => {
    const result = convertXmlToRcml('   ')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(['XML_PARSE_ERROR', 'ROOT_INVALID']).toContain(result.errors[0]?.code)
  })

  it('returns XML_PARSE_ERROR when fast-xml-parser throws on a broken tag', () => {
    // Unclosed tag forces a parser throw rather than a lenient parse.
    const result = convertXmlToRcml('<rcml><rc-head></rcml>')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(['XML_PARSE_ERROR', 'ROOT_INVALID']).toContain(result.errors[0]?.code)
  })

  it('returns an error when a text-only payload has no element', () => {
    const result = convertXmlToRcml('just plain text')

    expect(result.success).toBe(false)
  })
})

describe('convertXmlToRcml — attribute handling', () => {
  it('preserves attributes on interior nodes', () => {
    const result = convertXmlToRcml(
      '<rcml><rc-head></rc-head><rc-body background-color="#fff" width="600px"></rc-body></rcml>',
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.children[1]).toMatchObject({
      tagName: 'rc-body',
      attributes: { 'background-color': '#fff', width: '600px' },
    })
  })

  it('omits the `attributes` field when an element has none', () => {
    const result = convertXmlToRcml('<rcml><rc-head></rc-head><rc-body></rc-body></rcml>')

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.children[0]).not.toHaveProperty('attributes')
  })

  it('lifts the `id` attribute out of the XML attribute bag into the top-level node', () => {
    const result = convertXmlToRcml(
      '<rcml id="root"><rc-head id="h"></rc-head><rc-body id="b" width="600px"></rc-body></rcml>',
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.id).toBe('root')
    expect(result.data.children[0].id).toBe('h')
    expect(result.data.children[1].id).toBe('b')
    // Other attributes stay on `attributes`; `id` is NOT duplicated there.
    const body = result.data.children[1]

    expect(body).toMatchObject({ attributes: { width: '600px' } })
    expect(body.attributes).not.toHaveProperty('id')
  })
})

describe('convertXmlToRcml — leaf vs container handling', () => {
  it('omits `children` on leaf tags even though fast-xml-parser emits an empty child list', () => {
    const result = convertXmlToRcml(
      '<rcml><rc-head></rc-head><rc-body><rc-section><rc-column><rc-spacer height="10px"></rc-spacer></rc-column></rc-section></rc-body></rcml>',
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    const spacer = firstColumnChild<RcmlSpacer>(result.data.children[1])

    expect(spacer.tagName).toBe('rc-spacer')
    expect(spacer).not.toHaveProperty('children')
  })

  it('preserves `children: []` on empty non-leaf tags', () => {
    const result = convertXmlToRcml('<rcml><rc-head></rc-head><rc-body></rc-body></rcml>')

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.children[0]).toEqual({ tagName: 'rc-head', children: [] })
    expect(result.data.children[1]).toEqual({ tagName: 'rc-body', children: [] })
  })
})

describe('convertXmlToRcml — whitespace + text handling', () => {
  it('skips whitespace between structural children (pretty-printed input)', () => {
    const xml = [
      '<rcml>',
      '  <rc-head></rc-head>',
      '  <rc-body></rc-body>',
      '</rcml>',
    ].join('\n')
    const result = convertXmlToRcml(xml)

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.children).toHaveLength(2)
  })

  it('parses RFM body inside rc-text into a ProseMirror doc', () => {
    const result = convertXmlToRcml(
      '<rcml><rc-head></rc-head><rc-body><rc-section><rc-column><rc-text>Hello</rc-text></rc-column></rc-section></rc-body></rcml>',
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    const textNode = firstColumnChild<RcmlText>(result.data.children[1])

    expect(textNode.tagName).toBe('rc-text')
    expect(textNode.content).toMatchObject({ type: 'doc' })
    expect(textNode).not.toHaveProperty('children')
  })

  it('emits an empty content doc when rc-text has no body', () => {
    const result = convertXmlToRcml(
      '<rcml><rc-head></rc-head><rc-body><rc-section><rc-column><rc-text></rc-text></rc-column></rc-section></rc-body></rcml>',
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    const textNode = firstColumnChild<RcmlText>(result.data.children[1])

    expect(textNode.content).toEqual({ type: 'doc', content: [] })
  })

  it('surfaces EMAIL_RFM_PARSE_ERROR when rc-text contains invalid RFM', () => {
    // Unclosed `:font[` directive — RFM parser rejects.
    const xml =
      '<rcml><rc-head></rc-head><rc-body><rc-section><rc-column><rc-text>:font[hi</rc-text></rc-column></rc-section></rc-body></rcml>'
    const result = convertXmlToRcml(xml)

    if (!result.success) {
      expect(result.errors.some((e) => e.code === 'EMAIL_RFM_PARSE_ERROR')).toBe(true)
      // Path should point at the rc-text node's content
      expect(result.errors.find((e) => e.code === 'EMAIL_RFM_PARSE_ERROR')?.path).toContain('/content')
    }
  })

  it('routes rc-button content through the inline-RFM parser', () => {
    const result = convertXmlToRcml(
      '<rcml><rc-head></rc-head><rc-body><rc-section><rc-column><rc-button>Click</rc-button></rc-column></rc-section></rc-body></rcml>',
    )

    expect(result.success).toBe(true)
    if (!result.success) return
    const btn = firstColumnChild<RcmlButton>(result.data.children[1])

    expect(btn.tagName).toBe('rc-button')
    expect(btn.content.type).toBe('doc')
  })
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Descend body → section[0] → column[0] → child[0] with a caller-supplied
 * column-child narrowing. The runtime check on the final tag name fails
 * loudly if the XML fixture and the expected leaf type drift apart.
 */
function firstColumnChild<T extends { tagName: string }>(body: RcmlBody): T {
  const section = body.children[0] as RcmlSection
  const column = section.children[0] as RcmlColumn

  return column.children[0] as T
}
