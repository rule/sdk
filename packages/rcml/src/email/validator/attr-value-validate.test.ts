import { describe, expect, it } from 'vitest'
import { validateAttrValues } from './attr-value-validate.js'

/**
 * Unit tests for the tree-walked attribute-value validator. Tests feed
 * hand-crafted trees (typed as `unknown` to exercise the defensive shape
 * checks) and assert on the resulting issue list.
 */

const VALID_DOC = {
  tagName: 'rcml',
  children: [
    { tagName: 'rc-head', children: [] },
    {
      tagName: 'rc-body',
      attributes: { 'background-color': '#ffffff', width: '600px' },
      children: [],
    },
  ],
}

describe('validateAttrValues — happy path', () => {
  it('returns no issues for a valid minimal document', () => {
    expect(validateAttrValues(VALID_DOC)).toEqual([])
  })

  it('returns no issues when a node has no `attributes` field', () => {
    expect(
      validateAttrValues({
        tagName: 'rcml',
        children: [
          { tagName: 'rc-head', children: [] },
          { tagName: 'rc-body', children: [] },
        ],
      }),
    ).toEqual([])
  })
})

describe('validateAttrValues — bad attribute values', () => {
  it('flags a bad padding with ATTR_INVALID_VALUE and the correct JSON Pointer', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-section',
              attributes: { padding: 'banana' },
              children: [{ tagName: 'rc-column', children: [] }],
            },
          ],
        },
      ],
    }
    const issues = validateAttrValues(doc)

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      code: 'ATTR_INVALID_VALUE',
      path: '/children/1/children/0/attributes/padding',
    })
  })

  it('flags a bad color on rc-body background', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          attributes: { 'background-color': 'not-a-color' },
          children: [],
        },
      ],
    }
    const issues = validateAttrValues(doc)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.code).toBe('ATTR_INVALID_VALUE')
    expect(issues[0]?.path).toBe('/children/1/attributes/background-color')
  })

  it('reports multiple issues in one pass (does not stop at the first)', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          attributes: {
            'background-color': 'not-a-color',
            width: 'not-a-length',
          },
          children: [],
        },
      ],
    }
    const issues = validateAttrValues(doc)

    expect(issues.length).toBeGreaterThanOrEqual(2)
  })

  it('flags an rc-social-element name that is not a known social network', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-social',
              children: [
                {
                  tagName: 'rc-social-element',
                  attributes: { name: 'website', href: 'https://acme.example/' },
                },
              ],
            },
          ],
        },
      ],
    }
    const issues = validateAttrValues(doc)

    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({
      code: 'ATTR_INVALID_VALUE',
      path: '/children/1/children/0/children/0/attributes/name',
    })
  })

  it('accepts "web" as an rc-social-element name (the value Rule\'s RCML schema actually uses for the website slot)', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-social',
              children: [
                {
                  tagName: 'rc-social-element',
                  attributes: { name: 'web', href: 'https://acme.example/' },
                },
              ],
            },
          ],
        },
      ],
    }

    expect(validateAttrValues(doc)).toEqual([])
  })
})

describe('validateAttrValues — shape defence', () => {
  it('silently skips unknown attribute names (AJV reports those)', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          attributes: { bogus: 'x' },
          children: [],
        },
      ],
    }

    expect(validateAttrValues(doc)).toEqual([])
  })

  it('silently skips unknown tag names (AJV reports those)', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'not-a-real-tag',
          attributes: { padding: 'banana' },
          children: [],
        },
      ],
    }

    expect(validateAttrValues(doc)).toEqual([])
  })

  it('returns an empty list for a non-object input', () => {
    expect(validateAttrValues(null)).toEqual([])
    expect(validateAttrValues('string')).toEqual([])
    expect(validateAttrValues(42)).toEqual([])
    expect(validateAttrValues([])).toEqual([])
  })

  it('walks into children and reports issues at deep paths', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-section',
              children: [
                {
                  tagName: 'rc-column',
                  children: [
                    { tagName: 'rc-spacer', attributes: { height: 'banana' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    const issues = validateAttrValues(doc)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.path).toBe(
      '/children/1/children/0/children/0/children/0/attributes/height',
    )
  })
})
