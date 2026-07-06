/**
 * Unit tests for {@link createSamforaWelcomeTemplate}.
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
  createSamforaWelcomeTemplate,
  type SamforaWelcomeTemplateContext,
} from './welcome.js'

function fullContext(
  overrides: Partial<SamforaWelcomeTemplateContext> = {},
): SamforaWelcomeTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    websiteUrl: 'https://samfora.org',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createSamforaWelcomeTemplate', () => {
  it('renders a valid RCML document with default Swedish copy', () => {
    const doc = createSamforaWelcomeTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Välkommen till Samfora')
    expect(json).toContain('Så här kommer du igång')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('https://samfora.org')
  })

  it('renders all three step strings', () => {
    const doc = createSamforaWelcomeTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    // RFM markdown-style numbered prefixes ("1. ...") parse into
    // ordered-list semantics, so the leading "N. " is consumed.
    expect(json).toContain('Välj ett ändamål')
    expect(json).toContain('Ge en engångsgåva')
    expect(json).toContain('Följ effekten')
    expect(json).toContain('ordered-list')
  })

  it('renders Swedish footer link text', () => {
    const doc = createSamforaWelcomeTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Öppna i webbläsare')
    expect(json).toContain('Avregistrera')
  })

  it('renders the social section from theme.links', () => {
    const doc = createSamforaWelcomeTemplate().render({
      context: fullContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('applies a partial copy override', () => {
    const doc = createSamforaWelcomeTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Explore causes' },
    })
    const json = docToString(doc)

    expect(json).toContain('Explore causes')
    expect(json).not.toContain('Utforska ändamål')
  })
})
