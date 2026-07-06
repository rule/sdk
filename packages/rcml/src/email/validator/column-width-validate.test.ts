import { describe, expect, it } from 'vitest'
import { validateColumnWidths } from './column-width-validate.js'

const section = (columns: unknown[]) => ({
  tagName: 'rc-section',
  children: columns,
})

const col = (width?: string) => ({
  tagName: 'rc-column',
  attributes: width !== undefined ? { width } : {},
  children: [],
})

const colNoAttrs = () => ({
  tagName: 'rc-column',
  children: [],
})

describe('validateColumnWidths — single-column sections', () => {
  it('returns no issues for a single column with no width', () => {
    expect(validateColumnWidths({ tagName: 'rcml', children: [section([colNoAttrs()])] })).toEqual(
      [],
    )
  })

  it('returns no issues for a single column with a pixel width', () => {
    expect(
      validateColumnWidths({ tagName: 'rcml', children: [section([col('200px')])] }),
    ).toEqual([])
  })
})

describe('validateColumnWidths — multi-column sections', () => {
  it('returns no issues when two columns sum to 100%', () => {
    expect(
      validateColumnWidths({ tagName: 'rcml', children: [section([col('50%'), col('50%')])] }),
    ).toEqual([])
  })

  it('returns no issues when three columns sum to 100%', () => {
    expect(
      validateColumnWidths({
        tagName: 'rcml',
        children: [section([col('33%'), col('33%'), col('34%')])],
      }),
    ).toEqual([])
  })

  it('returns no issues for a column with a pixel width in a multi-column section (schema allows it)', () => {
    expect(
      validateColumnWidths({
        tagName: 'rcml',
        children: [section([col('80px'), col('50%')])],
      }),
    ).toEqual([])
  })

  it('returns no issues when a column has no width attribute in a multi-column section (schema allows it)', () => {
    expect(
      validateColumnWidths({
        tagName: 'rcml',
        children: [section([colNoAttrs(), col('50%')])],
      }),
    ).toEqual([])
  })

  it('returns no issues when no column has a width attribute (schema allows it)', () => {
    expect(
      validateColumnWidths({
        tagName: 'rcml',
        children: [section([colNoAttrs(), colNoAttrs()])],
      }),
    ).toEqual([])
  })

  it('flags all-percentage widths that do not sum to 100%', () => {
    const issues = validateColumnWidths({
      tagName: 'rcml',
      children: [section([col('40%'), col('40%')])],
    })

    expect(issues).toHaveLength(1)
    expect(issues[0].message).toMatch(/sum to 80%/)
  })

  it('skips sum check when any column uses a non-percentage width', () => {
    expect(
      validateColumnWidths({
        tagName: 'rcml',
        children: [section([col('80px'), col('40%')])],
      }),
    ).toEqual([])
  })

  it('allows floating-point rounding within ±0.5%', () => {
    // 33.33% × 3 = 99.99% — should not produce an error
    expect(
      validateColumnWidths({
        tagName: 'rcml',
        children: [section([col('33.33%'), col('33.33%'), col('33.34%')])],
      }),
    ).toEqual([])
  })
})

describe('validateColumnWidths — nesting', () => {
  it('validates sections nested inside rc-wrapper or rc-body', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [section([col('40%'), col('40%')])],
        },
      ],
    }
    const issues = validateColumnWidths(doc)

    expect(issues.length).toBeGreaterThan(0)
  })
})
