import { describe, expect, it } from 'vitest'

import { placeholderSpec } from './placeholder-spec.js'
import { rcmlSpec } from './rcml-spec.js'
import { emailRfmSpec } from './email-rfm-spec.js'

// ---------------------------------------------------------------------------
// rcmlSpec
// ---------------------------------------------------------------------------

describe('rcmlSpec', () => {
  it('exports a version string', () => {
    expect(typeof rcmlSpec.version).toBe('string')
    expect(rcmlSpec.version.length).toBeGreaterThan(0)
  })

  it('includes core structural tags', () => {
    const tags = Object.keys(rcmlSpec.tags)

    expect(tags).toContain('rc-body')
    expect(tags).toContain('rc-section')
    expect(tags).toContain('rc-column')
    expect(tags).toContain('rc-text')
    expect(tags).toContain('rc-button')
    expect(tags).toContain('rc-image')
  })

  it('rc-text content type is rcml-content', () => {
    expect(rcmlSpec.tags['rc-text'].content.type).toBe('rcml-content')
  })

  it('rc-button content type is inline-rcml-content', () => {
    expect(rcmlSpec.tags['rc-button'].content.type).toBe('inline-rcml-content')
  })

  it('rc-section content type is children with rc-column', () => {
    const content = rcmlSpec.tags['rc-section'].content

    expect(content.type).toBe('children')

    if (content.type === 'children') {
      expect(content.allowedChildren).toContain('rc-column')
    }
  })

  it('all tags have a non-empty description', () => {
    for (const [name, tag] of Object.entries(rcmlSpec.tags)) {
      expect(tag.description.length, `${name} has empty description`).toBeGreaterThan(0)
    }
  })
})

// ---------------------------------------------------------------------------
// emailRfmSpec
// ---------------------------------------------------------------------------

describe('emailRfmSpec', () => {
  it('exports a version string', () => {
    expect(typeof emailRfmSpec.version).toBe('string')
    expect(emailRfmSpec.version.length).toBeGreaterThan(0)
  })

  it('contains both content flavors', () => {
    expect(emailRfmSpec.flavors).toHaveProperty('rcml-content')
    expect(emailRfmSpec.flavors).toHaveProperty('inline-rcml-content')
  })

  it('inline-rcml-content is a single-paragraph flavor', () => {
    expect(emailRfmSpec.flavors['inline-rcml-content'].singleParagraph).toBe(true)
  })

  it('rcml-content supports block and inline nodes', () => {
    const { blockNodes, inlineNodes } = emailRfmSpec.flavors['rcml-content']

    expect(blockNodes).toContain('paragraph')
    expect(blockNodes).toContain('bullet-list')
    expect(inlineNodes).toContain('text')
    expect(inlineNodes).toContain('placeholder')
    expect(inlineNodes).toContain('loop-value')
  })

  it('placeholder node has correct required attrs', () => {
    const attrs = emailRfmSpec.nodes['placeholder'].attrs!

    expect(attrs['type'].required).toBe(true)
    expect(attrs['value'].required).toBe(true)
    expect(attrs['name'].required).toBe(true)
    expect(attrs['original'].required).toBe(true)
    expect(attrs['max-length'].required).toBe(true)
  })

  it('placeholder node value attr accepts null', () => {
    expect(emailRfmSpec.nodes['placeholder'].attrs!['value'].type).toContain('null')
  })

  it('placeholder node type has correct allowedValues', () => {
    expect(emailRfmSpec.nodes['placeholder'].attrs!['type'].allowedValues).toEqual([
      'CustomField',
      'Subscriber',
      'User',
      'RemoteContent',
      'Date',
    ])
  })

  it('link mark has all required attrs', () => {
    const attrs = emailRfmSpec.marks['link'].attrs

    expect(attrs['href'].required).toBe(true)
    expect(attrs['target'].required).toBe(true)
    expect(attrs['no-tracked'].required).toBe(true)
  })

  it('loop-value node index examples are 1-based', () => {
    const examples = emailRfmSpec.nodes['loop-value'].attrs!['index'].examples ?? []

    for (const ex of examples) {
      expect(Number(ex)).toBeGreaterThanOrEqual(1)
    }
  })
})

// ---------------------------------------------------------------------------
// placeholderSpec
// ---------------------------------------------------------------------------

describe('placeholderSpec', () => {
  it('exports a version string', () => {
    expect(typeof placeholderSpec.version).toBe('string')
    expect(placeholderSpec.version.length).toBeGreaterThan(0)
  })

  it('contains all 10 token types', () => {
    expect(Object.keys(placeholderSpec.tokens)).toHaveLength(10)
  })

  it('includes all expected token names', () => {
    const names = Object.keys(placeholderSpec.tokens)

    for (const expected of [
      'CustomField',
      'Subscriber',
      'User',
      'Date',
      'RemoteContent',
      'LoopValue',
      'Link',
      'RandomString',
      'Dispatcher',
      'PromoCode',
    ]) {
      expect(names).toContain(expected)
    }
  })

  it('tokens with rfmPlaceholderType cross-reference emailRfmSpec allowedValues', () => {
    const rfmAllowed = emailRfmSpec.nodes['placeholder'].attrs!['type'].allowedValues ?? []

    for (const [, token] of Object.entries(placeholderSpec.tokens)) {
      if (token.rfmPlaceholderType !== undefined) {
        expect(rfmAllowed).toContain(token.rfmPlaceholderType)
      }
    }
  })

  it('all tokens have non-empty syntax and at least one example', () => {
    for (const [name, token] of Object.entries(placeholderSpec.tokens)) {
      expect(token.syntax.length, `${name} has empty syntax`).toBeGreaterThan(0)
      expect(token.examples.length, `${name} has no examples`).toBeGreaterThan(0)
    }
  })

  it('Date type param uses allowedValues for literals and patterns for expressions', () => {
    const typeParam = placeholderSpec.tokens['Date'].params!['type']

    expect(typeParam.allowedValues).toEqual(['now', 'tomorrow', 'yesterday'])
    expect(typeParam.patterns).toBeDefined()
    expect(typeParam.patterns!.length).toBeGreaterThan(0)

    // patterns should not contain plain literals
    for (const p of typeParam.patterns!) {
      expect(typeParam.allowedValues).not.toContain(p)
    }
  })

  it('nestable tokens are CustomField, Subscriber, and User', () => {
    const nestable = Object.entries(placeholderSpec.tokens)
      .filter(([, t]) => t.nestable)
      .map(([k]) => k)
      .sort()

    expect(nestable).toEqual(['CustomField', 'Subscriber', 'User'])
  })
})
