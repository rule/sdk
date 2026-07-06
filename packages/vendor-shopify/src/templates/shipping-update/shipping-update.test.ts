/**
 * Unit tests for {@link createShippingUpdateTemplate}.
 *
 * Drives the factory end-to-end: caller-assembled typed refs →
 * bound template → compiled XML → themed RCML document. Optional
 * sections (status tracker, seller, shipping details, line items,
 * financial, buyer, legal) toggle on sub-object presence.
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
  createShippingUpdateTemplate,
  type ShippingUpdateTemplateContext,
} from './shipping-update.js'

function baseContext(
  overrides: Partial<ShippingUpdateTemplateContext> = {},
): ShippingUpdateTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    order: {
      ref: customField('Order', 'Number', 200003),
    },
    trackingUrl: 'https://shop.example.com/orders/tracking',
    cart: {},
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createShippingUpdateTemplate — baseline', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).toContain('Shipping Confirmation & Receipt')
    expect(json).toContain('View Order')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200003]')
    expect(json).toContain('https://shop.example.com/orders/tracking')
  })

  it('omits all optional sections when only required fields are supplied', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('rc-loop')
    expect(json).not.toContain('VAT')
    expect(json).not.toContain('Tracking')
    expect(json).not.toContain('Subtotal')
    expect(json).not.toContain('This email serves as your official receipt')
  })
})

describe('createShippingUpdateTemplate — status tracker', () => {
  it('renders three-step status tracker when status.steps supplied', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext({
        status: {
          steps: [
            { label: 'Confirmed', bg: '#00FF00', fg: '#000000', width: '33%' },
            { label: 'Shipped', bg: '#0000FF', fg: '#FFFFFF', width: '33%' },
            { label: 'Delivered', bg: '#CCCCCC', fg: '#666666', width: '34%' },
          ],
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Confirmed')
    expect(json).toContain('Shipped')
    expect(json).toContain('Delivered')
  })
})

describe('createShippingUpdateTemplate — seller', () => {
  it('renders company and VAT rows when seller is supplied', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext({
        seller: {
          company: customField('Seller', 'Company', 200040),
          vatNumber: customField('Seller', 'VatNumber', 200041),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200040]')
    expect(json).toContain('[CustomField:200041]')
    expect(json).toContain('Company')
    expect(json).toContain('VAT')
  })
})

describe('createShippingUpdateTemplate — shipping details', () => {
  it('renders tracking and carrier rows when supplied', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext({
        shippingDetails: {
          tracking: customField('Order', 'TrackingNumber', 200050),
          carrier: customField('Order', 'ShippingCarrier', 200051),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200050]')
    expect(json).toContain('[CustomField:200051]')
    expect(json).toContain('Tracking')
    expect(json).toContain('Carrier')
  })
})

describe('createShippingUpdateTemplate — cart + financial', () => {
  it('renders the line-items loop when cart.products is supplied', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext({
        cart: {
          products: {
            source: customField('Order', 'Products', 200014),
            itemName: loopValue('name'),
            itemQuantity: loopValue('quantity'),
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-loop')
    expect(json).toContain('[LoopValue:name]')
    expect(json).toContain('[LoopValue:quantity]')
  })

  it('renders the financial summary when supplied', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext({
        financial: {
          subtotal: customField('Order', 'Subtotal', 200030),
          total: customField('Order', 'TotalPrice', 200005),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200030]')
    expect(json).toContain('[CustomField:200005]')
    expect(json).toContain('Subtotal')
    expect(json).toContain('Total')
  })
})

describe('createShippingUpdateTemplate — legal', () => {
  it('renders the legal section when legal is supplied', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext({
        legal: {
          text: 'This email serves as your official receipt for this transaction.',
          returnPolicy: {
            linkText: 'Return policy',
            linkHref: 'https://shop.example.com/returns',
          },
          terms: {
            linkText: 'Terms',
            linkHref: 'https://shop.example.com/terms',
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('This email serves as your official receipt')
    expect(json).toContain('Return policy')
    expect(json).toContain('Terms')
    expect(json).toContain('https://shop.example.com/returns')
    expect(json).toContain('https://shop.example.com/terms')
  })
})

describe('createShippingUpdateTemplate — chrome + overrides', () => {
  it('applies a partial copy override', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Track shipment' },
    })
    const json = docToString(doc)

    expect(json).toContain('Track shipment')
    expect(json).not.toContain('View Order')
  })

  it('renders the social section from theme.links', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('https://example.com/logo.png')
  })
})
