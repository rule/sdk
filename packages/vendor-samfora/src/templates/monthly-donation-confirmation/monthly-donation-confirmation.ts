/**
 * Monthly-donation-confirmation template factory.
 *
 * Sent when a scheduled monthly donation is processed. Default copy is
 * Swedish; pass `copy: { ... }` at render time to localise.
 *
 * Optional `donation.currency` gates the currency-suffix variant of the
 * amount row (`amountRowWithCurrency`); omit to render `amountRow` only.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

export interface MonthlyDonationConfirmationTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  donation: {
    amount: CustomFieldRef
    currency?: CustomFieldRef
    date: CustomFieldRef
    ref: CustomFieldRef
    causeName: CustomFieldRef
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

export interface MonthlyDonationConfirmationTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly intro: string
  readonly detailsHeading: string
  /** Amount row without currency. Slot: `{{amount}}`. */
  readonly amountRow: string
  /** Amount row with currency suffix. Slots: `{{amount}}`, `{{currency}}`. */
  readonly amountRowWithCurrency: string
  readonly causeRow: string
  readonly dateRow: string
  readonly referenceRow: string
  readonly ctaButton: string
  readonly signOff: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type MonthlyDonationConfirmationRenderOptions =
  EmailTemplateRenderArgs<
    MonthlyDonationConfirmationTemplateCopy,
    MonthlyDonationConfirmationTemplateContext
  >

export type MonthlyDonationConfirmationTemplate =
  EmailTemplate<MonthlyDonationConfirmationTemplateCopy, MonthlyDonationConfirmationTemplateContext>

export function createMonthlyDonationConfirmationTemplate(): MonthlyDonationConfirmationTemplate {
  return createEmailTemplate<
    MonthlyDonationConfirmationTemplateCopy,
    MonthlyDonationConfirmationTemplateContext
  >({
    baseUrl: import.meta.url,
    templatePath: './monthly-donation-confirmation.xml',
    copyPath: './monthly-donation-confirmation-copy.json',
  })
}
