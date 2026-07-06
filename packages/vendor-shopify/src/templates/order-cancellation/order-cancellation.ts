/**
 * Order-cancellation template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 * The caller owns context assembly (building the typed
 * {@link OrderCancellationTemplateContext} with `customField` from
 * `@rule/template-engine`); the reusable factory handles loading the XML
 * + JSON copy, merging copy overrides, projecting
 * `theme.images.logo` / `theme.links` into context, compiling,
 * parsing to RCML, and applying the theme.
 *
 * Context is fully structural: optional sections are controlled by
 * the presence of their backing fields (e.g. omit `order.date` to
 * skip the cancellation-date row), never by parallel boolean flags.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

/**
 * Typed data context consumed by `order-cancellation.xml`.
 *
 * Presence is the contract: the XML's `<?if?>` guards probe for
 * optional sub-objects and ref descriptors directly, so optional
 * sections turn on/off by supplying (or omitting) the backing field.
 *
 * - `order.date` absent → no cancellation-date row.
 * - `support` absent → no support callout.
 * - `support.linkHref` absent → support paragraph renders without a
 *   link beside it.
 *
 * The logo section and the social-links section are driven by the
 * theme (`theme.images.logo` / `theme.links`). The secondary-color
 * backgrounds on the hero banner and order-details section come from
 * `theme.colors.secondary` via `applyTheme`'s `rcml-brand-color`
 * class binding. Callers filter by curating their theme.
 *
 * All free-text (heading, greeting, message, follow-up, CTA label,
 * support paragraph text) lives in the copy defaults — override the
 * relevant `copy` entry to change wording or localize.
 */
export interface OrderCancellationTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  order: {
    ref: CustomFieldRef
    date?: CustomFieldRef
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  /**
   * Optional support callout. Presence drives section rendering;
   * `linkHref` additionally drives whether the link row renders
   * alongside the `supportText` paragraph. Callers are responsible
   * for sanitizing `linkHref` (URL or `mailto:…`).
   */
  support?: {
    linkText?: string
    linkHref?: string
  }
  footer: {
    fontSize: string
    textColor: string
  }
}

/**
 * Default copy tree for `order-cancellation.xml`.
 *
 * Each entry maps to a single `<?copy key …?>` PI in the XML. Bodies
 * carry the full English text plus `{{slot}}` substitutions for
 * custom-field refs supplied at render time. The `supportLink` and
 * `footerLinks` entries carry RFM atom structure inline so callers
 * can tweak labels / layout / styling through copy overrides.
 *
 * To customize wording, supply a partial override to `render`'s
 * `copy?: Partial<OrderCancellationTemplateCopy>`.
 */
export interface OrderCancellationTemplateCopy {
  /** `<rc-preview>` body. */
  readonly preheader: string
  /** Hero banner heading. */
  readonly heading: string
  /** Greeting line. Slot: `{{firstName}}` — CustomField placeholder. */
  readonly greetingLine: string
  /** Main cancellation-confirmation paragraph. */
  readonly message: string
  /** Order reference row. Slot: `{{orderRef}}` — CustomField placeholder. */
  readonly orderRefRow: string
  /** Cancellation-date row. Slot: `{{orderDate}}` — CustomField placeholder. */
  readonly orderDateRow: string
  /** Support callout paragraph. */
  readonly supportText: string
  /**
   * Support link atom. Slots: `{{linkText}}`, `{{linkHref}}` — both
   * supplied by the caller via `context.support.linkText` / `.linkHref`.
   */
  readonly supportLink: string
  /** Closing follow-up paragraph. */
  readonly followUp: string
  /** Primary CTA button label. */
  readonly ctaButton: string
  /**
   * Footer link row. Labels are inline literals; font-size and color
   * come from `rc-text` attributes on the host element.
   */
  readonly footerLinks: string
  /** Fixed "Certified by Rule" footer attribution. */
  readonly certifiedByRule: string
}

/** Arguments to `render` — {@link EmailTemplateRenderArgs} bound to order-cancellation. */
export type OrderCancellationRenderOptions =
  EmailTemplateRenderArgs<OrderCancellationTemplateCopy, OrderCancellationTemplateContext>

/** Factory output — {@link EmailTemplate} bound to order-cancellation. */
export type OrderCancellationTemplate =
  EmailTemplate<OrderCancellationTemplateCopy, OrderCancellationTemplateContext>

/**
 * Return a renderer bound to the order-cancellation XML. Call
 * `render({ context, theme, copy? })` to produce the themed
 * RcmlDocument.
 */
export function createOrderCancellationTemplate(): OrderCancellationTemplate {
  return createEmailTemplate<OrderCancellationTemplateCopy, OrderCancellationTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './order-cancellation.xml',
    copyPath: './order-cancellation-copy.json',
  })
}
