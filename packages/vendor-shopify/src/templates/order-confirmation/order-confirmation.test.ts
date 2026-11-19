/**
 * Unit tests for {@link createOrderConfirmationTemplate}.
 *
 * Drives the factory end-to-end: caller-assembled typed refs →
 * bound template → compiled XML → themed RCML document. The
 * compiler serializes `CustomFieldRef` / `LoopValueRef` values into
 * RFM placeholder strings automatically.
 */

import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

import { DEFAULT_COLORS_MAP, EmailThemeColorType } from '@rule/rcml'
import { customField, loopValue } from '@rule/template-engine'

import {
  TEST_THEME,
  TEST_THEME_WITH_SOCIALS,
  assertValidRCMLDocument,
  docToString,
} from '../../test-fixtures.js'
import {
  createOrderConfirmationTemplate,
  type OrderConfirmationTemplateContext,
  type OrderConfirmationTemplateCopy,
} from './order-confirmation.js'

/** Baseline context: minimal required fields only. */
function baseContext(
  overrides: Partial<OrderConfirmationTemplateContext> = {},
): OrderConfirmationTemplateContext {
  return {
    recipient: {
      firstName: customField('Subscriber', 'FirstName', 200001),
    },
    order: {
      ref: customField('Order', 'Number', 200003),
    },
    cart: {},
    websiteUrl: 'https://shop.example.com/orders',
    footer: { fontSize: '10px', textColor: '#666666' },
    ...overrides,
  }
}

describe('createOrderConfirmationTemplate — baseline', () => {
  it('renders a valid RCML document with default copy', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })

    assertValidRCMLDocument(doc)
    const json = docToString(doc)

    expect(json).not.toContain('Certified by Rule')

    expect(json).toContain("We've received your order")
    expect(json).toContain('View your order')
    expect(json).toContain('[CustomField:200001]')
    expect(json).toContain('[CustomField:200003]')
  })

  it('omits all optional sections when only required fields are supplied', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).not.toContain('rc-loop')
    expect(json).not.toContain('Payment')
    expect(json).not.toContain('Delivering to')
    expect(json).not.toContain('Order date')
  })
})

describe('createOrderConfirmationTemplate — order meta', () => {
  it('renders the order-date block when date supplied', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        order: {
          ref: customField('Order', 'Number', 200003),
          date: customField('Order', 'Date', 200004),
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
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        order: {
          ref: customField('Order', 'Number', 200003),
          paymentMethod: customField('Order', 'Gateway', 200007),
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[CustomField:200007]')
    expect(json).toContain('Payment')
  })
})

describe('createOrderConfirmationTemplate — cart', () => {
  it('renders the inline items row when cart.items is supplied alone', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        cart: { items: customField('Order', 'Products', 200014) },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Items')
    expect(json).toContain('[CustomField:200014]')
    expect(json).not.toContain('rc-loop')
  })

  it('renders the line-items loop when cart.products is supplied', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        cart: {
          products: {
            source: customField('Order', 'Products', 200014),
            itemName: loopValue('title'),
            itemSku: loopValue('sku'),
            itemQuantity: loopValue('quantity'),
            itemPrice: loopValue('price'),
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-loop')
    expect(json).toContain('[LoopValue:title.1]')
    expect(json).toContain('[LoopValue:sku.1]')
    expect(json).toContain('[LoopValue:quantity.1]')
    expect(json).toContain('[LoopValue:price.1]')
  })

  it('omits line-item rows whose refs are absent from cart.products', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        cart: {
          products: {
            source: customField('Order', 'Products', 200014),
            itemName: loopValue('title'),
            // itemSku / itemQuantity / itemPrice / itemTotal all omitted
          },
        },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('[LoopValue:title.1]')
    expect(json).not.toContain('[LoopValue:sku.1]')
    expect(json).not.toContain('[LoopValue:quantity.1]')
    expect(json).not.toContain('[LoopValue:price.1]')
  })
})

describe('createOrderConfirmationTemplate — financial', () => {
  it('renders just the total row when financial has only total', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        financial: { total: customField('Order', 'TotalPrice', 200005) },
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Total')
    expect(json).toContain('[CustomField:200005]')
    expect(json).not.toContain('Subtotal')
  })

  it('renders subtotal / discount / tax / shippingCost when supplied', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        financial: {
          // Shopify syncs no subtotal; caller-supplied field.
          subtotal: customField('Order', 'Subtotal', 200030),
          discount: customField('Order', 'Discount', 200032),
          tax: customField('Order', 'TaxAmmount', 200031),
          shippingCost: customField('Order', 'Shipping', 200033),
          total: customField('Order', 'TotalPrice', 200005),
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

describe('createOrderConfirmationTemplate — shipping address', () => {
  it('renders an inline row when inlineShippingAddress is supplied', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        inlineShippingAddress: customField('Order', 'ShippingAddress1', 200016),
      }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Delivering to')
    expect(json).toContain('[CustomField:200016]')
  })

  it('renders the extended address block when shippingAddress is supplied', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({
        shippingAddress: {
          line1: customField('Order', 'ShippingAddress1', 200016),
          city: customField('Order', 'ShippingCity', 200018),
          zip: customField('Order', 'ShippingZip', 200019),
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

describe('createOrderConfirmationTemplate — chrome + overrides', () => {
  it('renders the hero heading when supplied', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({ heroHeading: { prefix: 'Order ', suffix: ' confirmed' } }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('Order ')
    expect(json).toContain(' confirmed')
  })

  it.each([
    ['prefix only', { prefix: 'HeroPrefix ' }, 'HeroPrefix '],
    ['suffix only', { suffix: ' HeroSuffix' }, ' HeroSuffix'],
    ['neither', {}, '[CustomField:200003]'],
  ])('renders the hero heading with %s', (_label, heroHeading, expected) => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext({ heroHeading }),
      theme: TEST_THEME,
    })
    const json = docToString(doc)
    const count = (j: string, cls: string) => j.split(cls).length
    const baseline = docToString(createOrderConfirmationTemplate().render({ context: baseContext(), theme: TEST_THEME }))

    expect(json).toContain(expected)
    expect(json).not.toContain('undefined')
    // The hero renders as an h2 so the email keeps a single h1.
    expect(count(json, 'rcml-h1-style')).toBe(count(baseline, 'rcml-h1-style'))
    expect(count(json, 'rcml-h2-style')).toBe(count(baseline, 'rcml-h2-style') + 1)
  })

  it('applies a partial copy override', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
      copy: { ctaButton: 'Track shipment' },
    })
    const json = docToString(doc)

    expect(json).toContain('Track shipment')
    expect(json).not.toContain('View your order')
  })

  it('renders the social section from theme.links', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME_WITH_SOCIALS,
    })
    const json = docToString(doc)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
  })

  it('renders the logo from theme.images.logo', () => {
    const doc = createOrderConfirmationTemplate().render({
      context: baseContext(),
      theme: TEST_THEME,
    })
    const json = docToString(doc)

    expect(json).toContain('https://example.com/logo.png')
  })
})

describe('createOrderConfirmationTemplate — design', () => {
  interface RcmlNode {
    tagName: string
    attributes?: Record<string, string>
    children?: RcmlNode[]
  }

  const render = (
    overrides: Partial<OrderConfirmationTemplateContext> = {},
    copy: Partial<OrderConfirmationTemplateCopy> = {},
  ): string =>
    docToString(createOrderConfirmationTemplate().render({
      context: baseContext(overrides),
      theme: TEST_THEME,
      copy,
    }))
  const bodyOf = (json: string): string =>
    JSON.stringify((JSON.parse(json) as { children: unknown[] }).children[1])

  it('hard-codes no colour in the XML', () => {
    const xml = readFileSync(new URL('./order-confirmation.xml', import.meta.url), 'utf8')

    expect(xml).not.toMatch(/#[0-9a-f]{3,6}\b/i)
  })

  // The Rule editor's style settings recolour a template through the
  // rc-head defaults (rc-body = Canvas, rc-section = Background, font
  // classes = text). An inline colour on a body node outranks those
  // defaults and freezes that node at render time, so it must not exist.
  it('leaves section backgrounds and text colours to the editor-linked theme defaults', () => {
    const body = JSON.parse(bodyOf(render())) as RcmlNode
    const nodes: RcmlNode[] = []

    const walk = (n: RcmlNode): void => {
      nodes.push(n)
      n.children?.forEach(walk)
    }

    walk(body)

    const sectionBgs = nodes
      .filter((n) => n.tagName === 'rc-section')
      .map((n) => n.attributes?.['background-color'])

    // Every section inherits the rc-section default. Rule rejects
    // "transparent", so none may carry a background of its own.
    expect(sectionBgs.length).toBeGreaterThan(0)
    expect(sectionBgs.filter((bg) => bg !== undefined)).toEqual([])

    const textColors = nodes
      .filter((n) => n.tagName === 'rc-text' || n.tagName === 'rc-heading')
      .map((n) => n.attributes?.color)
      .filter((c) => c !== undefined)

    // Only the caller-supplied footer colour.
    expect(textColors).toEqual(['#666666'])
  })

  // The render above only reaches the baseline branches, and @{brand.*}
  // is resolved to hex before output, so pin every branch at the source.
  it('puts no brand colour on a section, text or heading in any branch', () => {
    const xml = readFileSync(new URL('./order-confirmation.xml', import.meta.url), 'utf8')
    const bodyStart = xml.indexOf('</rc-head>')

    expect(bodyStart).toBeGreaterThan(0)
    const tags = [...xml.slice(bodyStart).matchAll(/<rc-(?:section|text|heading)\b[^>]*>/g)].map((m) => m[0])

    expect(tags.filter((tag) => /\b(?:background-)?color="@\{brand\./.test(tag))).toEqual([])
    // Any section background — "transparent" included, which Rule rejects —
    // would override the editor-linked rc-section default.
    expect(tags.filter((tag) => tag.startsWith('<rc-section') && /\bbackground-color=/.test(tag))).toEqual([])
  })

  // EmailTheme.colors is Partial and applyTheme writes only supplied
  // slots, so the head must already carry the fallback surfaces.
  it.each([
    ['theme with non-default surfaces', {
      ...TEST_THEME,
      colors: {
        ...TEST_THEME.colors,
        [EmailThemeColorType.Background]: { type: EmailThemeColorType.Background, hex: '#112233' },
        [EmailThemeColorType.Body]: { type: EmailThemeColorType.Body, hex: '#445566' },
      },
    }, { 'rc-body': '#112233', 'rc-section': '#445566' }],
    ['theme with no colours', { ...TEST_THEME, colors: {} }, { 'rc-body': DEFAULT_COLORS_MAP[EmailThemeColorType.Background].hex, 'rc-section': DEFAULT_COLORS_MAP[EmailThemeColorType.Body].hex }],
  ] as const)('seeds editor-linked surface defaults in rc-head (%s)', (_label, theme, expected) => {
    const rendered = createOrderConfirmationTemplate().render({ context: baseContext(), theme })

    assertValidRCMLDocument(rendered)
    const doc = JSON.parse(docToString(rendered)) as { children: RcmlNode[] }
    const attrNodes = doc.children[0].children?.filter((c) => c.tagName === 'rc-attributes') ?? []

    // One head defaults node per tag: applyTheme must update the seeds, not add beside them.
    expect(attrNodes).toHaveLength(1)
    const attrs = attrNodes[0].children ?? []
    const bgs = (tag: string): (string | undefined)[] =>
      attrs.filter((c) => c.tagName === tag).map((c) => c.attributes?.['background-color'])

    expect({ 'rc-body': bgs('rc-body'), 'rc-section': bgs('rc-section') })
      .toEqual({ 'rc-body': [expected['rc-body']], 'rc-section': [expected['rc-section']] })
  })

  it('paints the active progress step from the theme primary', () => {
    expect(bodyOf(render())).toContain('"border-color":"#0066CC"')
  })

  it('titles the order card with the detailsHeading copy', () => {
    const body = bodyOf(render({}, { detailsHeading: 'Order card title' }))

    expect(body).toContain('Order card title')
  })

  it.each([
    ['delivery and payment', { inlineShippingAddress: customField('Order', 'ShippingAddress1', 200016), order: { ref: customField('Order', 'Number', 200003), paymentMethod: customField('Order', 'Gateway', 200007) } }, 2],
    ['payment only', { order: { ref: customField('Order', 'Number', 200003), paymentMethod: customField('Order', 'Gateway', 200007) } }, 1],
    ['delivery only', { inlineShippingAddress: customField('Order', 'ShippingAddress1', 200016) }, 1],
  ] as const)('gives the details card one width-less column per side with content (%s)', (_label, overrides, columns) => {
    const doc = JSON.parse(render(overrides)) as { children: RcmlNode[] }
    const card = doc.children[1].children?.find((s) => JSON.stringify(s).includes('rcml-h4-style'))
    const cols = card?.children?.filter((c) => c.tagName === 'rc-column') ?? []

    expect(cols).toHaveLength(columns)
    expect(cols.every((c) => c.attributes?.width === undefined)).toBe(true)
  })

  it('renders the three progress steps', () => {
    const json = render()

    expect(json).toContain('Confirmed')
    expect(json).toContain('Shipped')
    expect(json).toContain('Delivered')
  })

  it('omits the details card when no delivery or payment field is supplied', () => {
    // Body only: rc-head carries the theme's h4 class definition. The
    // details card is the only section with this padding, so it also
    // catches an empty card shell left behind.
    const shell = '"padding":"28px 0px 12px 0px"'
    const body = bodyOf(render())

    expect(body).not.toContain('rcml-h4-style')
    expect(body).not.toContain(shell)
    expect(bodyOf(render({ order: { ref: customField('Order', 'Number', 200003), date: customField('Order', 'Date', 200004) } })))
      .toContain(shell)
  })

  it('keeps the line-items loop to one column slot so index-1 refs match', () => {
    const doc = JSON.parse(render({
      cart: {
        products: {
          source: customField('Order', 'Products', 200014),
          itemName: loopValue('title'),
          itemQuantity: loopValue('quantity'),
          itemPrice: loopValue('price'),
          itemSku: loopValue('sku'),
          itemTotal: loopValue('total'),
        },
      },
    })) as { children: RcmlNode[] }
    const columns = (node: RcmlNode): number =>
      (node.tagName === 'rc-column' ? 1 : 0) + (node.children ?? []).reduce((n, c) => n + columns(c), 0)
    const loop = doc.children[1].children?.find((n) => n.tagName === 'rc-loop')

    expect(loop).toBeDefined()
    expect(columns(loop as RcmlNode)).toBe(1)
    expect(JSON.stringify(loop)).toContain('[LoopValue:total.1]')
  })

  it('labels the unit price when no line total is supplied', () => {
    const body = bodyOf(render({
      cart: {
        products: {
          source: customField('Order', 'Products', 200014),
          itemName: loopValue('title'),
          itemPrice: loopValue('price'),
        },
      },
    }))

    expect(body).toContain('Unit price ')
    expect(body).toContain('[LoopValue:price.1]')
  })

  it('drops the inline items row when the line-items loop is supplied', () => {
    const body = bodyOf(render({
      cart: {
        items: customField('Order', 'ProductsText', 200015),
        products: { source: customField('Order', 'Products', 200014), itemName: loopValue('title') },
      },
    }))

    expect(body).toContain('rc-loop')
    expect(body).not.toContain('[CustomField:200015]')
  })

  it('prefers the multi-line address over the inline one', () => {
    const json = render({
      inlineShippingAddress: customField('Order', 'ShippingAddress1', 200016),
      shippingAddress: { line1: customField('Order', 'ShippingAddress1', 200017) },
    })

    expect(json).toContain('[CustomField:200017]')
    expect(json).not.toContain('[CustomField:200016]')
  })
})
