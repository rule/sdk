/**
 * Abandoned-cart template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 * The caller owns context assembly (building the typed
 * {@link AbandonedCartTemplateContext} with `customField` / `loopValue`
 * from `@rule/template-engine`); the reusable factory handles loading
 * the XML + JSON copy, merging copy overrides, projecting
 * `theme.images.logo` / `theme.links` into context, compiling,
 * parsing to RCML, and applying the theme.
 *
 * Context is fully structural: optional sections are controlled by
 * the presence of their backing fields (e.g. omit `cart.products` to
 * skip the line-items block), never by parallel boolean flags.
 *
 * No config→context translation, no field validation, no error-context
 * wrapping. If the caller wants validation, they do it at their call site
 * before constructing the context object.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef, LoopValueRef } from '@rule/template-engine'

/**
 * Typed data context consumed by `abandoned-cart.xml`.
 *
 * Presence is the contract: the XML's `<?if?>` guards probe for
 * optional sub-objects and ref descriptors directly, so optional
 * sections turn on/off by supplying (or omitting) the backing field.
 *
 * - `cart.products` absent → no line-items loop, no heading.
 * - `cart.totalPrice` absent → no total row.
 *
 * Per-line-item rows (`itemSku` / `itemQuantity` / `itemPrice`) toggle
 * on their presence as `LoopValueRef`s inside `cart.products`.
 *
 * The logo section and the social-links section are driven by the
 * theme — the factory pulls `theme.images.logo?.url` and
 * `theme.links` into the compile context so the XML's `<?if?>` gates
 * and `<?for?>` loop can see them. The logo image URL is also
 * rendered on the `<rc-logo>` element via `applyTheme`'s
 * `rcml-logo-style` class binding. The secondary-color background on
 * the total-row section comes from `theme.colors.secondary` via
 * `applyTheme`'s `rcml-brand-color` class binding. Callers filter by
 * curating their theme.
 *
 * Footer-link labels and RFM structure live inline in the
 * `footerLinks` copy entry — callers override that entry to change
 * labels, separator, or styling.
 */
export interface AbandonedCartTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  cart: {
    url: string
    totalPrice?: CustomFieldRef
    products?: {
      /** Items custom field; `.id` is used as `rc-loop` loop-value. */
      source: CustomFieldRef
      itemName: LoopValueRef
      itemSku?: LoopValueRef
      itemQuantity?: LoopValueRef
      itemPrice?: LoopValueRef
    }
  }
  footer: {
    fontSize: string
    textColor: string
  }
}

/**
 * Default copy tree for `abandoned-cart.xml`.
 *
 * Each entry maps to a single `<?copy key …?>` PI in the XML. Bodies
 * carry the full English text as literal strings, plus `{{slot}}`
 * substitutions for custom-field and loop-value refs supplied at
 * render time (built via `customField` / `loopValue` from
 * `@rule/template-engine`; the compiler serializes them to RFM
 * placeholder strings automatically).
 *
 * Footer-link labels and styling live inline in the `footerLinks`
 * entry alongside the RFM atom structure — override that entry to
 * tweak labels, layout, or the separator.
 *
 * To customize wording, supply a partial override to `render`'s
 * `copy?: Partial<AbandonedCartTemplateCopy>`.
 */
export interface AbandonedCartTemplateCopy {
  /** `<rc-preview>` body. */
  readonly preheader: string
  /** Hero heading. Slot: `{{firstNameCustomField}}` — CustomField placeholder. */
  readonly greetingHeading: string
  /** Body message paragraph. */
  readonly message: string
  /** Reminder paragraph. */
  readonly reminder: string
  /** Heading above the line-items loop. */
  readonly lineItemsHeading: string
  /** Loop row: item name. Slot: `{{itemNameLoopValue}}` — loop-value atom. */
  readonly itemNameLine: string
  /** Loop row: SKU label + loop value. Slot: `{{itemSkuLoopValue}}`. */
  readonly itemSkuLine: string
  /** Loop row: quantity label + loop value. Slot: `{{itemQtyLoopValue}}`. */
  readonly itemQtyLine: string
  /** Loop row: price label + loop value. Slot: `{{itemUnitPriceLoopValue}}`. */
  readonly itemUnitPriceLine: string
  /** Cart total row. Slot: `{{totalPriceCustomField}}` — CustomField placeholder. */
  readonly totalRow: string
  /** Primary CTA button label. */
  readonly ctaButton: string
  /**
   * Footer link row. Labels are inline literals; font-size and color
   * come from `rc-text` attributes on the host element;
   * `text-decoration="underline"` lives on the inner `:font` atom.
   * Override this entry to change labels, separator, or styling.
   */
  readonly footerLinks: string
  /** Fixed "Certified by Rule" footer attribution. */
  readonly certifiedByRule: string
}

/** Arguments to `render` — {@link EmailTemplateRenderArgs} bound to abandoned-cart. */
export type AbandonedCartRenderOptions =
  EmailTemplateRenderArgs<AbandonedCartTemplateCopy, AbandonedCartTemplateContext>

/** Factory output — {@link EmailTemplate} bound to abandoned-cart. */
export type AbandonedCartTemplate =
  EmailTemplate<AbandonedCartTemplateCopy, AbandonedCartTemplateContext>

/**
 * Return a renderer bound to the abandoned-cart XML. Call
 * `render({ context, theme, copy? })` to produce the themed
 * {@link import('@rule/rcml').RcmlDocument}. Copy overrides apply
 * per-render, not per-factory — the same template instance can render
 * multiple locales/brand voices.
 */
export function createAbandonedCartTemplate(): AbandonedCartTemplate {
  return createEmailTemplate<AbandonedCartTemplateCopy, AbandonedCartTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './abandoned-cart.xml',
    copyPath: './abandoned-cart-copy.json',
  })
}
