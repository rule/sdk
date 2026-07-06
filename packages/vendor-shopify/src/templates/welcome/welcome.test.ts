/**
 * Unit tests for {@link createWelcomeTemplate}.
 *
 * Drives the factory end-to-end: caller-assembled typed refs +
 * optional sections → bound template → compiled XML → themed RCML
 * document.
 */

import { describe, expect, it } from 'vitest'

import { customField } from '@rule/template-engine'

import {
  TEST_THEME,
  TEST_THEME_WITH_SOCIALS,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createWelcomeTemplate,
  type WelcomeTemplateContext,
} from './welcome.js'

function baseContext(
  overrides: Partial<WelcomeTemplateContext> = {},
): WelcomeTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    websiteUrl: 'https://shop.example.com',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createWelcomeTemplate — baseline', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Welcome!')
    expect(json).toContain("Thanks for subscribing")
    expect(json).toContain('Learn More')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('https://shop.example.com')
  })

  it('omits benefits, discount, and closing when absent', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain("Why you'll love being with us")
    expect(json).not.toContain('Your welcome discount')
  })
})

describe('createWelcomeTemplate — benefits', () => {
  it('renders the benefits list when benefits is supplied', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext({
        benefits: ['Free shipping over $50', 'Early access to new drops', 'Members-only offers'],
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain("Why you'll love being with us")
    expect(json).toContain('Free shipping over $50')
    expect(json).toContain('Early access to new drops')
    expect(json).toContain('Members-only offers')
  })
})

describe('createWelcomeTemplate — discount', () => {
  it('renders the discount callout when discount is supplied', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext({
        discount: { code: 'WELCOME10' },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Your welcome discount')
    expect(json).toContain('Use this code at checkout')
    expect(json).toContain('WELCOME10')
  })
})

describe('createWelcomeTemplate — closing', () => {
  it('renders the closing paragraph when supplied', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext({
        closing: "We'll be in touch with news and updates.",
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain("We'll be in touch with news and updates")
  })
})

describe('createWelcomeTemplate — chrome + overrides', () => {
  it('applies a partial copy override', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Start shopping' },
    })
    const json = docToString(doc)

    expect(json).toContain('Start shopping')
    expect(json).not.toContain('Learn More')
  })

  it('renders the social section from theme.links', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createWelcomeTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('https://example.com/logo.png')
  })
})
