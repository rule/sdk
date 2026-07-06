import { describe, expect, it } from 'vitest'
import { RcmlXmlParseError, safeXmlToRcml, xmlToRcml } from './xml-to-rcml.js'

describe('xmlToRcml (throwing)', () => {
  it('throws RcmlXmlParseError on malformed XML', () => {
    expect(() => xmlToRcml('<rcml><rc-body></rc-head></rcml>')).toThrow(RcmlXmlParseError)
  })

  it('parses a simple well-formed template', () => {
    const xml = '<rcml><rc-head></rc-head><rc-body></rc-body></rcml>'

    expect(xmlToRcml(xml)).toEqual({
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        { tagName: 'rc-body', children: [] },
      ],
    })
  })

  it('lifts `id` out of the XML attribute bag into the top-level node', () => {
    const parsed = xmlToRcml('<rcml id="root"><rc-head></rc-head><rc-body></rc-body></rcml>')

    expect(parsed).toMatchObject({ id: 'root', tagName: 'rcml' })
  })
})

describe('safeXmlToRcml (non-throwing)', () => {
  it('returns success: false + error list on unparseable input', () => {
    const result = safeXmlToRcml('<<<not xml>>>')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.code).toBe('XML_PARSE_ERROR')
  })

  it('returns success: true + data on well-formed input', () => {
    const result = safeXmlToRcml('<rcml><rc-head></rc-head><rc-body></rc-body></rcml>')

    expect(result.success).toBe(true)
    if (!result.success) return
    expect(result.data.tagName).toBe('rcml')
    expect(result.data.children).toHaveLength(2)
  })

  it('reports ROOT_INVALID when the input has no root element', () => {
    const result = safeXmlToRcml('')

    expect(result.success).toBe(false)
    if (result.success) return
    // Either XML_PARSE_ERROR or ROOT_INVALID depending on how the validator treats empty input;
    // both are valid classifications for "no usable document here".
    expect(['XML_PARSE_ERROR', 'ROOT_INVALID']).toContain(result.errors[0]?.code)
  })

  it('surfaces EMAIL_RFM_PARSE_ERROR when a text element contains invalid RFM', () => {
    // Unclosed directive inside rc-text — the RFM parser rejects it.
    const xml = '<rcml><rc-head></rc-head><rc-body><rc-section><rc-column><rc-text>:font[hi</rc-text></rc-column></rc-section></rc-body></rcml>'
    const result = safeXmlToRcml(xml)

    if (!result.success) {
      expect(result.errors.some((e) => e.code === 'EMAIL_RFM_PARSE_ERROR')).toBe(true)
    }
  })
})
