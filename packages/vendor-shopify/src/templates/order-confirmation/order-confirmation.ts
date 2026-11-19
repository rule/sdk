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
 * Layout: one column of blocks on the brand canvas — a hero card (greeting, intro,
 * progress bar), an order card (order number, items, summary), a
 * full-width button, and a details card (delivery, payment, date).
 *
 * Presence drives section rendering:
 * - `order.date` absent → no order-date block in the details card.
 * - `order.paymentMethod` absent → no payment block.
 * - `cart.items` (custom-field ref) → inline "Items" row in the
 *   order card, only when `cart.products` is absent.
 * - `cart.products` (loop refs) → line-items loop in the order card.
 * - `inlineShippingAddress` → single-line "Delivering to" block in
 *   the details card (used only when `shippingAddress` is absent).
 * - `financial` → summary rows in the order card with subtotal /
 *   discount / tax / shippingCost (all optional) + total (required).
 * - `shippingAddress` → multi-line "Delivering to" block.
 * - None of the four delivery/payment fields → no details card.
 * - `heroHeading` → h2 "{prefix}{orderRef}{suffix}" under the
 *   greeting in the hero card.
 *
 * Theme-derived fields (logo, social links, brand colours) flow from
 * `theme`, not context. All caller-visible labels live in
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
    /** Inline items field — a single "Items" row in the order card, only when `products` is absent. */
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
  /** Single-line "Delivering to" block in the details card, used only when `shippingAddress` is absent. */
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
   * Hero h2 under the greeting in the hero card. Usually in the
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
  /** Progress bar: the active first step. */
  readonly stepConfirmed: string
  /** Progress bar: second step, shown as upcoming. */
  readonly stepShipped: string
  /** Progress bar: third step, shown as upcoming. */
  readonly stepDelivered: string
  readonly heroHeading: string
  readonly orderDateRow: string
  readonly detailsHeading: string
  readonly paymentRow: string
  readonly inlineItemsRow: string
  readonly inlineShippingRow: string
  /** Value cell beside a label — `{{value}}` is the row's field. */
  readonly valueCell: string
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
  /** Help line above the footer links. */
  readonly helpLine: string
  readonly footerLinks: string
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
