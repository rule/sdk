/**
 * Annual-tax-summary template factory.
 *
 * Year-end summary of donations for Swedish gåvoskatteavdrag reporting.
 * Default copy is Swedish; pass `copy: { ... }` at render time to localise.
 *
 * Optional `tax.currency` gates the currency-suffix variants on both
 * the lifetime-total and tax-deductible rows; omit to render the
 * currency-less variants.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

export interface AnnualTaxSummaryTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  tax: {
    year: CustomFieldRef
    totalLifetimeAmount: CustomFieldRef
    taxDeductibleAmount: CustomFieldRef
    currency?: CustomFieldRef
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

export interface AnnualTaxSummaryTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly intro: string
  readonly detailsHeading: string
  readonly yearRow: string
  /** Lifetime-total row without currency. Slot: `{{total}}`. */
  readonly totalRow: string
  /** Lifetime-total row with currency suffix. Slots: `{{total}}`, `{{currency}}`. */
  readonly totalRowWithCurrency: string
  /** Deductible row without currency. Slot: `{{deductible}}`. */
  readonly deductibleRow: string
  /** Deductible row with currency suffix. Slots: `{{deductible}}`, `{{currency}}`. */
  readonly deductibleRowWithCurrency: string
  readonly disclaimer: string
  readonly ctaButton: string
  readonly signOff: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type AnnualTaxSummaryRenderOptions =
  EmailTemplateRenderArgs<AnnualTaxSummaryTemplateCopy, AnnualTaxSummaryTemplateContext>

export type AnnualTaxSummaryTemplate =
  EmailTemplate<AnnualTaxSummaryTemplateCopy, AnnualTaxSummaryTemplateContext>

export function createAnnualTaxSummaryTemplate(): AnnualTaxSummaryTemplate {
  return createEmailTemplate<AnnualTaxSummaryTemplateCopy, AnnualTaxSummaryTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './annual-tax-summary.xml',
    copyPath: './annual-tax-summary-copy.json',
  })
}
