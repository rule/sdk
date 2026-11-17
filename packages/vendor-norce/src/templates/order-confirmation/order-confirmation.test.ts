/**
 * Unit tests for {@link createNorceOrderConfirmationTemplate}.
 *
 * Drives the factory end-to-end: caller-assembled typed refs →
 * bound template → compiled XML → themed RCML document. The
 * compiler serializes `CustomFieldRef` / `LoopValueRef` values into
 * RFM placeholder strings automatically.
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
  createNorceOrderConfirmationTemplate,
  type NorceOrderConfirmationTemplateContext,
} from './order-confirmation.js'

/** Baseline context: minimal required fields only. */
function baseContext(
  overrides: Partial<NorceOrderConfirmationTemplateContext> = {},
): NorceOrderConfirmationTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    order: {
      ref: customField('Order', 'OrderNumber', 200003),
    },
    cart: {},
    websiteUrl: 'https://shop.example.com/orders',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createNorceOrderConfirmationTemplate — baseline', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).not.toContain('Certified by Rule')

    expect(json).toContain('Thank you for your order')
    expect(json).toContain('Order Summary')
    expect(json).toContain('View Order')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200003]')
  })

  it('omits all optional sections when only required fields are supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('rc-loop')
    expect(json).not.toContain('Items Ordered')
    expect(json).not.toContain('Shipping to')
    expect(json).not.toContain('Order date')
    expect(json).not.toContain('rc-social')
  })
})

describe('createNorceOrderConfirmationTemplate — order meta', () => {
  it('renders a two-column orderRef/orderDate meta row when date supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        order: {
          ref: customField('Order', 'OrderNumber', 200003),
          date: customField('Order', 'OrderDate', 200004),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200003]')
    expect(json).toContain('[CustomField:200004]')
    expect(json).toContain('Order date')
  })

  it('renders the paymentMethod row when supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        order: {
          ref: customField('Order', 'OrderNumber', 200003),
          paymentMethod: customField('Order', 'PaymentMethod', 200007),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200007]')
    expect(json).toContain('Payment')
  })
})

describe('createNorceOrderConfirmationTemplate — cart', () => {
  it('renders the inline items row when cart.items is supplied alone', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        cart: { items: customField('Order', 'ProductNames', 200012) },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Items')
    expect(json).toContain('[CustomField:200012]')
    expect(json).not.toContain('rc-loop')
  })

  it('renders the line-items loop when cart.products is supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        cart: {
          products: {
            source: customField('Order', 'Products', 200014),
            itemName: loopValue('Name'),
            itemSku: loopValue('PartNo'),
            itemQuantity: loopValue('QtyOrdered'),
            itemPrice: loopValue('UnitPrice'),
            itemTotal: loopValue('RowAmount'),
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[LoopValue:RowAmount.1]')
    expect(json).toContain('rc-loop')
    expect(json).toContain('Items Ordered')
    expect(json).toContain('[LoopValue:Name.1]')
    expect(json).toContain('[LoopValue:PartNo.1]')
    expect(json).toContain('[LoopValue:QtyOrdered.1]')
    expect(json).toContain('[LoopValue:UnitPrice.1]')
  })

  it('omits line-item rows whose refs are absent from cart.products', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        cart: {
          products: {
            source: customField('Order', 'Products', 200014),
            itemName: loopValue('Name'),
            // itemSku / itemQuantity / itemPrice / itemTotal all omitted
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[LoopValue:Name.1]')
    expect(json).not.toContain('[LoopValue:PartNo.1]')
    expect(json).not.toContain('[LoopValue:QtyOrdered.1]')
    expect(json).not.toContain('[LoopValue:UnitPrice.1]')
  })
})

describe('createNorceOrderConfirmationTemplate — financial', () => {
  it('renders just the total row when financial has only total', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        financial: { total: customField('Order', 'OrderTotalIncVat', 200005) },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Total')
    expect(json).toContain('[CustomField:200005]')
    expect(json).not.toContain('Subtotal')
  })

  it('renders subtotal / discount / tax / shippingCost when supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        financial: {
          // Norce syncs none of these; caller-supplied fields.
          subtotal: customField('Order', 'Subtotal', 200030),
          discount: customField('Order', 'Discount', 200032),
          tax: customField('Order', 'Tax', 200031),
          shippingCost: customField('Order', 'Shipping', 200033),
          total: customField('Order', 'OrderTotalIncVat', 200005),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200030]')
    expect(json).toContain('[CustomField:200031]')
    expect(json).toContain('[CustomField:200032]')
    expect(json).toContain('[CustomField:200033]')
    expect(json).toContain('[CustomField:200005]')
    expect(json).toContain('Subtotal')
    expect(json).toContain('Tax')
    expect(json).toContain('Discount')
  })
})

describe('createNorceOrderConfirmationTemplate — shipping address', () => {
  it('renders an inline row when inlineShippingAddress is supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        inlineShippingAddress: customField('Subscriber', 'Address', 200016),
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Shipping to')
    expect(json).toContain('[CustomField:200016]')
  })

  it('renders the extended address block when shippingAddress is supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({
        shippingAddress: {
          line1: customField('Subscriber', 'Address', 200016),
          city: customField('Subscriber', 'City', 200018),
          zip: customField('Subscriber', 'ZipCode', 200019),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200016]')
    expect(json).toContain('[CustomField:200018]')
    expect(json).toContain('[CustomField:200019]')
  })
})

describe('createNorceOrderConfirmationTemplate — chrome + overrides', () => {
  it('renders the hero heading when supplied', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext({ heroHeading: { prefix: 'HeroPrefix ', suffix: ' HeroSuffix' } }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('HeroPrefix ')
    expect(json).toContain(' HeroSuffix')
  })

  it('applies a partial copy override', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Track shipment' },
    })
    const json = docToString(doc)

    expect(json).toContain('Track shipment')
    expect(json).not.toContain('View Order')
  })

  it('renders the social section from theme.links', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createNorceOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('https://example.com/logo.png')
  })
})
