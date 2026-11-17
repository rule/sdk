/**
 * Unit tests for {@link createNorceOrderCancellationTemplate}.
 *
 * Drives the factory end-to-end: caller-assembled typed refs + copy
 * overrides → bound template → compiled XML → themed RCML document.
 * The compiler serializes `CustomFieldRef` values into RFM placeholder
 * strings automatically.
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
  createNorceOrderCancellationTemplate,
  type NorceOrderCancellationTemplateContext,
} from './order-cancellation.js'

/** A fully-populated data shape exercising every optional section. */
function fullContext(
  overrides: Partial<NorceOrderCancellationTemplateContext> = {},
): NorceOrderCancellationTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    order: {
      ref: customField('Order', 'OrderNumber', 200010),
      // Norce syncs no cancellation date (Order.OrderDate is when the
      // order was placed); caller-supplied field.
      date: customField('Order', 'CancelledAt', 200012),
    },
    websiteUrl: 'https://shop.example.com',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createNorceOrderCancellationTemplate', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).not.toContain('Certified by Rule')

    expect(json).toContain('Order Cancelled')
    expect(json).toContain('Visit Our Store')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200010]')
    expect(json).toContain('[CustomField:200012]')
    expect(json).toContain('https://shop.example.com')
  })

  it('omits the cancellation-date row when `order.date` is absent', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext({
        order: { ref: customField('Order', 'OrderNumber', 200010) },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200010]')
    expect(json).not.toContain('[CustomField:200012]')
    expect(json).not.toContain('Cancelled on')
  })

  it('omits the support callout when `support` is absent', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('Have questions')
  })

  it('renders the support paragraph only when `support` is an empty object', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext({ support: {} }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Have questions')
    // No linkHref/linkText → the support-link atom does not appear.
    expect(json).not.toContain('mailto:')
  })

  it('renders the support link when `support.linkHref` and `support.linkText` are supplied', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext({
        support: { linkText: 'Contact us', linkHref: 'mailto:help@example.com' },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Have questions')
    expect(json).toContain('Contact us')
    expect(json).toContain('mailto:help@example.com')
  })

  it('omits the support link when `support.linkText` is absent', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext({ support: { linkHref: 'mailto:help@example.com' } }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Have questions')
    expect(json).not.toContain('mailto:help@example.com')
  })

  it('applies a partial copy override without touching other entries', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Shop again' },
    })
    const json = docToString(doc)

    expect(json).toContain('Shop again')
    expect(json).not.toContain('Visit Our Store')
  })

  it('propagates footer fontSize/textColor to rc-text attributes', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext({ footer: { fontSize: '14px', textColor: '#111111' } }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('14px')
    expect(json).toContain('#111111')
  })

  it('renders the social section from theme.links', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
    expect(json).toContain('instagram')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createNorceOrderCancellationTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    // TEST_THEME.images.logo.url = 'https://example.com/logo.png'.
    expect(json).toContain('https://example.com/logo.png')
  })
})
