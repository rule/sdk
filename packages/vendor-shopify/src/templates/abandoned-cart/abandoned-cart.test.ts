/**
 * Unit tests for {@link createAbandonedCartTemplate}.
 *
 * Drives the factory end-to-end: caller-assembled typed refs + link
 * strings → bound copy → compiled XML → themed RCML document. The
 * compiler serializes `CustomFieldRef` / `LoopValueRef` values into
 * RFM placeholder strings automatically.
 *
 * Context is structural: optional sections toggle on/off based on the
 * presence of their backing fields, not parallel `has*` flags.
 */

import { describe, expect, it } from 'vitest'

import { customField, loopValue } from '@rule/template-engine'

import {
  TEST_THEME,
  TEST_THEME_WITH_SOCIALS,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createAbandonedCartTemplate,
  type AbandonedCartTemplateContext,
} from './abandoned-cart.js'

/** A fully-populated data shape exercising every optional section. */
function fullContext(overrides: Partial<AbandonedCartTemplateContext> = {}): AbandonedCartTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    cart: {
      url: 'https://shop.example.com/cart',
      totalPrice: customField('Order', 'TotalPrice', 200005),
      products: {
        source: customField('Order', 'Products', 200014),
        itemName: loopValue('name'),
        itemSku: loopValue('sku'),
        itemQuantity: loopValue('quantity'),
        itemPrice: loopValue('unitPrice'),
      },
    },
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createAbandonedCartTemplate', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createAbandonedCartTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Hi ')
    expect(json).toContain('Return to Cart')
    expect(json).toContain('Your Cart')
    expect(json).toContain('Total: ')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200005]')
    expect(json).toContain('[LoopValue:name]')
    expect(json).toContain('[LoopValue:sku]')
    expect(json).toContain('[LoopValue:quantity]')
    expect(json).toContain('[LoopValue:unitPrice]')
    expect(json).toContain('[Link:WebBrowser]')
    expect(json).toContain('[Link:Unsubscribe]')
    expect(json).toContain('https://shop.example.com/cart')
  })

  it('applies a partial copy override without touching other entries', () => {
    const doc = createAbandonedCartTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Checkout Now' },
    })
    const json = docToString(doc)

    expect(json).toContain('Checkout Now')
    expect(json).not.toContain('Return to Cart')
    expect(json).toContain('Your Cart')
  })

  it('reuses the same template instance across renders with different copy overrides', () => {
    const template = createAbandonedCartTemplate()

    const defaultDoc = template.render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const overriddenDoc = template.render({
      context: fullContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Checkout Now' },
    })

    expect(docToString(defaultDoc)).toContain('Return to Cart')
    expect(docToString(overriddenDoc)).toContain('Checkout Now')
    expect(docToString(overriddenDoc)).not.toContain('Return to Cart')
  })

  it('omits line-item loop, total row, and social section when their backing fields are absent', () => {
    const doc = createAbandonedCartTemplate().render({
      context: fullContext({
        // Structural omission replaces the old has* flags: no products +
        // no totalPrice means those sections don't render. TEST_THEME
        // carries no social links → no social section.
        cart: { url: 'https://shop.example.com/cart' },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('rc-loop')
    expect(json).not.toContain('Total: ')
    expect(json).not.toContain('rc-social')
  })

  it('omits optional line-item rows when refs are absent from cart.products', () => {
    const doc = createAbandonedCartTemplate().render({
      context: fullContext({
        cart: {
          url: 'https://shop.example.com/cart',
          products: {
            source: customField('Order', 'Products', 200014),
            itemName: loopValue('name'),
            // itemSku / itemQuantity / itemPrice all omitted → rows don't render
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[LoopValue:name]')
    expect(json).not.toContain('[LoopValue:sku]')
    expect(json).not.toContain('[LoopValue:quantity]')
    expect(json).not.toContain('[LoopValue:unitPrice]')
  })

  it('propagates footer fontSize/textColor to rc-text attributes', () => {
    const doc = createAbandonedCartTemplate().render({
      context: fullContext({ footer: { fontSize: '14px', textColor: '#111111' } }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('14px')
    expect(json).toContain('#111111')
  })

  it('renders social section from theme.links', () => {
    // No context override — the factory derives socials from theme.
    const doc = createAbandonedCartTemplate().render({
      context: fullContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
    expect(json).toContain('instagram')
  })

  it('renders logo section from theme.images.logo', () => {
    // No context override — the factory derives the logo URL from theme.
    const doc = createAbandonedCartTemplate().render({
      context: fullContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    // TEST_THEME.images.logo.url = 'https://example.com/logo.png'.
    expect(json).toContain('https://example.com/logo.png')
  })
})
