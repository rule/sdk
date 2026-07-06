/**
 * Welcome template factory.
 *
 * Vertical-agnostic template for newsletter signups, account
 * creation, or any opt-in acknowledgement. Thin wrapper over
 * {@link createEmailTemplate} from `@rule/rcml`.
 *
 * Context is fully structural: optional sections are controlled by
 * the presence of their backing fields (omit `benefits` to skip the
 * benefits list; omit `discount` to skip the discount callout; omit
 * `closing` to skip the sign-off paragraph).
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

/**
 * Typed data context consumed by `welcome.xml`.
 *
 * Presence drives section rendering:
 * - `benefits` (array of strings) → benefits list section. Omit or
 *   pass `undefined` to skip; empty-array is engine-truthy so use
 *   absence, not `[]`.
 * - `discount` (object with `code`) → welcome-discount callout.
 * - `closing` (string) → closing paragraph below the CTA.
 *
 * Theme-derived fields (logo, brand-color backgrounds, social links)
 * come from `theme`. All caller-visible labels live in the copy
 * defaults — override via `copy: { … }`.
 */
export interface WelcomeTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  /** Benefit bullets rendered in order. Omit to skip section. */
  benefits?: readonly string[]
  /** Welcome discount code. Omit to skip section. */
  discount?: {
    code: string
  }
  /** Closing / sign-off paragraph rendered below the CTA. Omit to skip. */
  closing?: string
  footer: {
    fontSize: string
    textColor: string
  }
}

/**
 * Default copy tree for `welcome.xml`.
 *
 * Override via `copy: { … }` at render time to change labels or
 * localize.
 */
export interface WelcomeTemplateCopy {
  readonly preheader: string
  /** Hero banner heading. */
  readonly heading: string
  /** Greeting line. Slot: `{{firstName}}`. */
  readonly greetingLine: string
  /** Intro paragraph below the greeting. */
  readonly intro: string
  /** Heading above the benefits list (when `context.benefits` is supplied). */
  readonly benefitsHeading: string
  /** Single benefit row. Slot: `{{text}}` filled from `context.benefits[i]`. */
  readonly benefitItem: string
  /** Heading above the discount callout. */
  readonly discountHeading: string
  /** Message above the discount code. */
  readonly discountMessage: string
  /** Discount code line. Slot: `{{code}}` filled from `context.discount.code`. */
  readonly discountCodeLine: string
  /** Closing paragraph. Slot: `{{text}}` filled from `context.closing`. */
  readonly closingLine: string
  /** Primary CTA button label. */
  readonly ctaButton: string
  /** Footer link row (inline RFM). */
  readonly footerLinks: string
  /** Fixed "Certified by Rule" footer attribution. */
  readonly certifiedByRule: string
}

/** Arguments to `render` — {@link EmailTemplateRenderArgs} bound to welcome. */
export type WelcomeRenderOptions =
  EmailTemplateRenderArgs<WelcomeTemplateCopy, WelcomeTemplateContext>

/** Factory output — {@link EmailTemplate} bound to welcome. */
export type WelcomeTemplate =
  EmailTemplate<WelcomeTemplateCopy, WelcomeTemplateContext>

/**
 * Return a renderer bound to the welcome XML. Call
 * `render({ context, theme, copy? })` to produce the themed
 * RcmlDocument.
 */
export function createWelcomeTemplate(): WelcomeTemplate {
  return createEmailTemplate<WelcomeTemplateCopy, WelcomeTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './welcome.xml',
    copyPath: './welcome-copy.json',
  })
}
