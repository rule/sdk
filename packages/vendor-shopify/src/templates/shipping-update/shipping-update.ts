/**
 * Shipping-update template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 * The caller owns context assembly (building the typed
 * {@link ShippingUpdateTemplateContext} with `customField` /
 * `loopValue` from `@rule/template-engine`); the factory handles
 * loading, compile, theme projection, xmlToRcml, and applyTheme.
 *
 * Context is fully structural: optional sections are controlled by
 * the presence of their backing sub-objects (e.g. omit
 * `shippingDetails` to skip the shipping details section), never by
 * parallel boolean flags.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef, LoopValueRef } from '@rule/template-engine'

/**
 * Typed data context consumed by `shipping-update.xml`.
 *
 * Presence drives section rendering: omit a sub-object to skip its
 * section. Within each section, individual rows gate on their own
 * field presence.
 *
 * Sections:
 * - `status` → three-step progress tracker (confirmed → shipped →
 *   delivered, or any other caller-defined sequence).
 * - `seller` → company / VAT rows.
 * - `order` → always rendered (orderRef is required); optional date,
 *   paymentMethod, customerEmail rows.
 * - `shippingDetails` → address / carrier / tracking / ETA rows.
 * - `cart.products` → line-items loop.
 * - `financial` → subtotal / discount / tax / shippingCost / total.
 * - `buyer` → customer name / billing address rows.
 * - `legal` → legal text / return-policy link / terms link.
 *
 * Theme-derived fields (logo, secondary background, social links)
 * flow from `theme`. All caller-visible labels live in the copy
 * defaults.
 */
export interface ShippingUpdateTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  order: {
    ref: CustomFieldRef
    date?: CustomFieldRef
    paymentMethod?: CustomFieldRef
    customerEmail?: CustomFieldRef
  }
  /** URL the CTA button links to (typically the order-tracking page). */
  trackingUrl: string
  status?: {
    steps: readonly {
      label: string
      bg: string
      fg: string
      width: string
    }[]
  }
  seller?: {
    company?: CustomFieldRef
    vatNumber?: CustomFieldRef
  }
  shippingDetails?: {
    address?: CustomFieldRef
    carrier?: CustomFieldRef
    tracking?: CustomFieldRef
    estimatedDelivery?: CustomFieldRef
  }
  cart: {
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
    total?: CustomFieldRef
  }
  buyer?: {
    fullName?: CustomFieldRef
    billingAddress?: CustomFieldRef
  }
  legal?: {
    /** Legal paragraph text. Absent → paragraph omitted. */
    text?: string
    /** Return-policy link. Both `linkText` + `linkHref` required together. */
    returnPolicy?: { linkText: string; linkHref: string }
    /** Terms-and-conditions link. Both required together. */
    terms?: { linkText: string; linkHref: string }
  }
  footer: {
    fontSize: string
    textColor: string
  }
}

/**
 * Default copy tree for `shipping-update.xml`.
 *
 * Each entry maps to a single `<?copy key?>` PI in the XML. Override
 * via `copy: { … }` at render time to change labels, localize, or
 * tweak the inline RFM in `statusStepLabel` / `footerLinks` / link
 * atoms.
 */
export interface ShippingUpdateTemplateCopy {
  readonly preheader: string
  readonly heading: string
  readonly greetingLine: string
  readonly statusStepLabel: string
  readonly companyRow: string
  readonly vatRow: string
  readonly orderRefRow: string
  readonly orderDateRow: string
  readonly paymentRow: string
  readonly customerEmailRow: string
  readonly shippingAddressRow: string
  readonly carrierRow: string
  readonly trackingRow: string
  readonly estimatedDeliveryRow: string
  readonly ctaButton: string
  readonly lineItemsHeading: string
  readonly itemNameLine: string
  readonly itemSkuLine: string
  readonly itemQtyLine: string
  readonly itemUnitPriceLine: string
  readonly itemLineTotalLine: string
  readonly subtotalRow: string
  readonly discountRow: string
  readonly taxRow: string
  readonly shippingCostRow: string
  readonly totalRow: string
  readonly customerFullNameLine: string
  readonly billingAddressRow: string
  readonly legalText: string
  readonly returnPolicyLink: string
  readonly termsLink: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

/** Arguments to `render` — {@link EmailTemplateRenderArgs} bound to shipping-update. */
export type ShippingUpdateRenderOptions =
  EmailTemplateRenderArgs<ShippingUpdateTemplateCopy, ShippingUpdateTemplateContext>

/** Factory output — {@link EmailTemplate} bound to shipping-update. */
export type ShippingUpdateTemplate =
  EmailTemplate<ShippingUpdateTemplateCopy, ShippingUpdateTemplateContext>

/**
 * Return a renderer bound to the shipping-update XML. Call
 * `render({ context, theme, copy? })` to produce the themed
 * RcmlDocument.
 */
export function createShippingUpdateTemplate(): ShippingUpdateTemplate {
  return createEmailTemplate<ShippingUpdateTemplateCopy, ShippingUpdateTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './shipping-update.xml',
    copyPath: './shipping-update-copy.json',
  })
}
