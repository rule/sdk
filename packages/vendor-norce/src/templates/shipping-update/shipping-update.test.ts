/**
 * Unit tests for {@link createNorceShippingUpdateTemplate}.
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
  createNorceShippingUpdateTemplate,
  type NorceShippingUpdateTemplateContext,
} from './shipping-update.js'

function baseContext(
  overrides: Partial<NorceShippingUpdateTemplateContext> = {},
): NorceShippingUpdateTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    order: {
      // The Delivered event writes the order record, so this names the
      // delivered order.
      ref: customField('Order', 'OrderNumber', 200003),
    },
    trackingUrl: 'https://shop.example.com/orders/tracking',
    cart: {},
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createNorceShippingUpdateTemplate — baseline', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).not.toContain('Certified by Rule')

    expect(json).toContain('Shipping Confirmation & Receipt')
    expect(json).toContain('View Order')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200003]')
    expect(json).toContain('https://shop.example.com/orders/tracking')
  })

  it('omits all optional sections when only required fields are supplied', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('rc-loop')
    expect(json).not.toContain('VAT')
    expect(json).not.toContain('Tracking')
    expect(json).not.toContain('Subtotal')
  })
})

describe('createNorceShippingUpdateTemplate — status tracker', () => {
  it('renders three-step status tracker when status.steps supplied', () => {
    const doc = createNorceShippingUpdateTemplate().render({
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

describe('createNorceShippingUpdateTemplate — seller', () => {
  it('renders company and VAT rows when seller is supplied', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext({
        seller: {
          // Not synced by Norce: the shop's own fields, caller-supplied.
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

describe('createNorceShippingUpdateTemplate — shipping details', () => {
  it('renders tracking and carrier rows when supplied', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext({
        shippingDetails: {
          // Norce syncs no tracking number; caller-supplied field.
          tracking: customField('Shipment', 'TrackingNumber', 200050),
          carrier: customField('Order', 'DeliveryMethod', 200051),
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

describe('createNorceShippingUpdateTemplate — cart + financial', () => {
  it('renders the line-items loop when cart.products is supplied', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext({
        cart: {
          products: {
            // The Delivered event fetches the full order from Norce, so its
            // Order record carries the line items too.
            source: customField('Order', 'Products', 200014),
            itemName: loopValue('Name'),
            itemQuantity: loopValue('QtyOrdered'),
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-loop')
    expect(json).toContain('[LoopValue:Name.1]')
    expect(json).toContain('[LoopValue:QtyOrdered.1]')
  })

  it('renders the financial summary when supplied', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext({
        financial: {
          subtotal: customField('Order', 'OrderTotalExVat', 200030),
          total: customField('Order', 'OrderTotalIncVat', 200005),
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

describe('createNorceShippingUpdateTemplate — legal', () => {
  it('renders the legal section when legal is supplied', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext({
        legal: {
          text: 'Custom legal wording from the shop.',
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

    expect(json).toContain('Custom legal wording from the shop.')
    expect(json).toContain('Return policy')
    expect(json).toContain('Terms')
    expect(json).toContain('https://shop.example.com/returns')
    expect(json).toContain('https://shop.example.com/terms')
  })
})

describe('createNorceShippingUpdateTemplate — chrome + overrides', () => {
  it('applies a partial copy override', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Track shipment' },
    })
    const json = docToString(doc)

    expect(json).toContain('Track shipment')
    expect(json).not.toContain('View Order')
  })

  it('renders the social section from theme.links', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createNorceShippingUpdateTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('https://example.com/logo.png')
  })
})
