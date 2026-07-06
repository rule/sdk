/**
 * Order-confirmation template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 * The caller owns context assembly (building the typed
 * {@link OrderConfirmationTemplateContext} with `customField` /
 * `loopValue` from `@rule/template-engine`); the factory handles
 * loading, compile, theme projection, xmlToRcml, and applyTheme.
 *
 * Context is fully structural: optional sections are controlled by
 * the presence of their backing fields (e.g. omit `cart.products` to
 * skip the line-items loop), never by parallel boolean flags.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef, LoopValueRef } from '@rule/template-engine'

/**
 * Typed data context consumed by `order-confirmation.xml`.
 *
 * Presence drives section rendering:
 * - `order.date` absent → single-column orderRef row in the details
 *   box; present → two-column orderRef/orderDate meta row above.
 * - `order.paymentMethod` absent → no payment row.
 * - `cart.items` (custom-field ref) → inline "Items" row in the
 *   details box (fallback when no line-items loop is supplied).
 * - `cart.products` (loop refs) → line-items loop section.
 * - `inlineShippingAddress` → inline "Shipping to" row in the
 *   details box (fallback when no extended address block).
 * - `financial` → financial summary section with subtotal / discount
 *   / tax / shippingCost (all optional) + total (required).
 * - `shippingAddress` → extended multi-line shipping address block.
 * - `heroHeading` → hero heading "{prefix}{orderRef}{suffix}"
 *   between the greeting and the details box.
 *
 * Theme-derived fields (logo, secondary background, social links)
 * flow from `theme`, not context. All caller-visible labels live in
 * the copy defaults — override via `copy: { … }` to customize or
 * localize.
 */
export interface OrderConfirmationTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  order: {
    ref: CustomFieldRef
    date?: CustomFieldRef
    paymentMethod?: CustomFieldRef
  }
  cart: {
    /** Inline items field — rendered as a single row in the details box. */
    items?: CustomFieldRef
    /** Line-items loop — `source.id` is used as `rc-loop` loop-value. */
    products?: {
      source: CustomFieldRef
      itemName: LoopValueRef
      itemSku?: LoopValueRef
      itemQuantity?: LoopValueRef
      itemPrice?: LoopValueRef
      itemTotal?: LoopValueRef
    }
  }
  financial?: {
    subtotal?: CustomFieldRef
    discount?: CustomFieldRef
    tax?: CustomFieldRef
    shippingCost?: CustomFieldRef
    total: CustomFieldRef
  }
  /** Inline shipping-address row in the details box. */
  inlineShippingAddress?: CustomFieldRef
  /** Extended multi-line shipping address block. */
  shippingAddress?: {
    line1: CustomFieldRef
    line2?: CustomFieldRef
    zip?: CustomFieldRef
    city?: CustomFieldRef
    country?: CustomFieldRef
  }
  /**
   * Hero heading between greeting and details box. Usually in the
   * shape "Order #1234 confirmed" — provide `prefix` and/or `suffix`
   * text surrounding the order-ref atom.
   */
  heroHeading?: {
    prefix?: string
    suffix?: string
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

/**
 * Default copy tree for `order-confirmation.xml`.
 *
 * Every `<?copy key?>` in the XML has a matching default entry
 * here. Override `copy` at render time to change labels, localize,
 * or tweak the inline RFM in `footerLinks`.
 */
export interface OrderConfirmationTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly intro: string
  readonly heroHeading: string
  readonly orderRefRow: string
  readonly orderDateRow: string
  readonly detailsHeading: string
  readonly paymentRow: string
  readonly inlineItemsRow: string
  readonly inlineShippingRow: string
  readonly lineItemsHeading: string
  readonly itemNameLine: string
  readonly itemSkuLine: string
  readonly itemQtyLine: string
  readonly itemUnitPriceLine: string
  readonly itemSubtotalLine: string
  readonly subtotalRow: string
  readonly discountRow: string
  readonly taxRow: string
  readonly shippingCostRow: string
  readonly totalRow: string
  readonly shippingAddressHeading: string
  readonly shippingAddressLine: string
  readonly shippingAddress2Line: string
  readonly shippingZipLine: string
  readonly shippingCityLine: string
  readonly shippingCountryCodeLine: string
  readonly ctaButton: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

/** Arguments to `render` — {@link EmailTemplateRenderArgs} bound to order-confirmation. */
export type OrderConfirmationRenderOptions =
  EmailTemplateRenderArgs<OrderConfirmationTemplateCopy, OrderConfirmationTemplateContext>

/** Factory output — {@link EmailTemplate} bound to order-confirmation. */
export type OrderConfirmationTemplate =
  EmailTemplate<OrderConfirmationTemplateCopy, OrderConfirmationTemplateContext>

/**
 * Return a renderer bound to the order-confirmation XML. Call
 * `render({ context, theme, copy? })` to produce the themed
 * RcmlDocument.
 */
export function createOrderConfirmationTemplate(): OrderConfirmationTemplate {
  return createEmailTemplate<OrderConfirmationTemplateCopy, OrderConfirmationTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './order-confirmation.xml',
    copyPath: './order-confirmation-copy.json',
  })
}
