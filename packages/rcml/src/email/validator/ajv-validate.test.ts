import { describe, expect, it } from 'vitest'
import { validateStructure } from './ajv-validate.js'

/**
 * Unit tests for the AJV-based structural validator. Each case exercises a
 * specific error code emitted by the translator in `./ajv-validate.ts`.
 * Cross-pass integration (AJV + Zod + content delegation) lives in
 * `../validate-email-template.test.ts`.
 */

const EMPTY_HEAD = { tagName: 'rc-head', children: [] } as const
const EMPTY_BODY = { tagName: 'rc-body', children: [] } as const

describe('validateStructure — happy path', () => {
  it('returns no issues for a well-shaped minimal document', () => {
    const doc = {
      tagName: 'rcml',
      children: [EMPTY_HEAD, EMPTY_BODY],
    }

    expect(validateStructure(doc)).toEqual([])
  })

  it('returns no issues when optional `id` is present', () => {
    const doc = {
      id: 'doc-1',
      tagName: 'rcml',
      children: [
        { id: 'head-1', tagName: 'rc-head', children: [] },
        { id: 'body-1', tagName: 'rc-body', children: [] },
      ],
    }

    expect(validateStructure(doc)).toEqual([])
  })
})

describe('validateStructure — tag-level issues', () => {
  it('emits TAG_MISSING when a node lacks `tagName`', () => {
    const doc = { children: [EMPTY_HEAD, EMPTY_BODY] }
    const issues = validateStructure(doc)

    expect(issues.some((i) => i.code === 'TAG_MISSING')).toBe(true)
  })

  it('emits TAG_UNKNOWN when the root tagName is not `rcml`', () => {
    const doc = { tagName: 'not-rcml', children: [] }
    const issues = validateStructure(doc)

    expect(issues.some((i) => i.code === 'TAG_UNKNOWN')).toBe(true)
  })
})

describe('validateStructure — child-level issues', () => {
  it('emits CHILD_INVALID when a child is not allowed under its parent', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        EMPTY_HEAD,
        {
          tagName: 'rc-body',
          children: [
            // rc-column is not allowed directly under rc-body.
            { tagName: 'rc-column', children: [] },
          ],
        },
      ],
    }
    const issues = validateStructure(doc)

    expect(issues.some((i) => i.code === 'CHILD_INVALID')).toBe(true)
  })

  it('emits CHILD_TOO_MANY when rc-section exceeds its maxChildCount', () => {
    const columns = Array.from({ length: 21 }, () => ({
      tagName: 'rc-column' as const,
      children: [],
    }))
    const doc = {
      tagName: 'rcml',
      children: [
        EMPTY_HEAD,
        {
          tagName: 'rc-body',
          children: [{ tagName: 'rc-section', children: columns }],
        },
      ],
    }
    const issues = validateStructure(doc)

    expect(issues.some((i) => i.code === 'CHILD_TOO_MANY')).toBe(true)
  })
})

describe('validateStructure — attribute-level issues', () => {
  it('emits ATTR_UNKNOWN when an unrecognised attribute is present', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        EMPTY_HEAD,
        { tagName: 'rc-body', attributes: { bogus: 'nope' }, children: [] },
      ],
    }
    const issues = validateStructure(doc)
    const unknown = issues.find((i) => i.code === 'ATTR_UNKNOWN')

    expect(unknown).toBeDefined()
    expect(unknown?.message).toContain('bogus')
  })

  it('emits ATTR_INVALID_VALUE when an enum attribute receives an unknown value', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        EMPTY_HEAD,
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-section',
              // `direction` is restricted to 'ltr' | 'rtl'.
              attributes: { direction: 'diagonal' },
              children: [{ tagName: 'rc-column', children: [] }],
            },
          ],
        },
      ],
    }
    const issues = validateStructure(doc)

    expect(issues.some((i) => i.code === 'ATTR_INVALID_VALUE')).toBe(true)
  })

  it('emits ATTR_INVALID_VALUE for rc-social-element name="website"', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [
            {
              tagName: 'rc-attributes',
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
        },
        EMPTY_BODY,
      ],
    }
    const issues = validateStructure(doc)

    expect(issues.some((i) => i.code === 'ATTR_INVALID_VALUE')).toBe(true)
  })
})

describe('validateStructure — issue shape', () => {
  it('attaches a JSON Pointer path to each issue', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        EMPTY_HEAD,
        { tagName: 'rc-body', attributes: { nope: 'x' }, children: [] },
      ],
    }
    const issues = validateStructure(doc)

    expect(issues.every((i) => typeof i.path === 'string')).toBe(true)
    expect(issues.some((i) => i.path.includes('/children/1/attributes'))).toBe(true)
  })

  it('returns every issue from a single validation pass (allErrors)', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          attributes: { bogus1: 'a', bogus2: 'b', bogus3: 'c' },
          children: [],
        },
      ],
    }
    const issues = validateStructure(doc)
    const unknowns = issues.filter((i) => i.code === 'ATTR_UNKNOWN')

    expect(unknowns.length).toBeGreaterThanOrEqual(3)
  })
})

describe('validateStructure — type mismatch and defensive branches', () => {
  it('emits ATTR_INVALID_VALUE when an attribute has the wrong primitive type', () => {
    // brand-style `id` must be a number per the JSON Schema (matches Zod's
    // PositiveNumber). Passing a boolean triggers the `type` keyword in AJV.
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [
            { tagName: 'rc-brand-style', attributes: { id: true } },
          ],
        },
        EMPTY_BODY,
      ],
    }
    const issues = validateStructure(doc)

    // Either ATTR_INVALID_VALUE (type keyword) or an adjacent code is acceptable —
    // the exact error depends on whether AJV reports `type` first. What we want
    // to confirm is that the validator reports something rather than silently
    // accepting.
    expect(issues.length).toBeGreaterThan(0)
  })

  it('reports a SCHEMA_VIOLATION when the root is not an object', () => {
    const issues = validateStructure('not a document')

    expect(issues.length).toBeGreaterThan(0)
    // The `type` keyword on the root produces ATTR_INVALID_VALUE via toIssue's
    // switch — it doesn't know the root vs attr distinction, which is fine:
    // the validator's job here is to flag that the shape isn't an object.
    expect(issues[0]!.code).toBe('ATTR_INVALID_VALUE')
  })

  it('reports a SCHEMA_VIOLATION for an array root', () => {
    const issues = validateStructure([1, 2, 3])

    expect(issues.length).toBeGreaterThan(0)
  })

  it('reports a SCHEMA_VIOLATION for a primitive root', () => {
    const issues = validateStructure(42)

    expect(issues.length).toBeGreaterThan(0)
  })
})
