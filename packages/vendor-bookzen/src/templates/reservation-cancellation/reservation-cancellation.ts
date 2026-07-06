/**
 * Reservation-cancellation template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

export interface ReservationCancellationTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  reservation: {
    bookingRef: CustomFieldRef
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

export interface ReservationCancellationTemplateCopy {
  readonly preheader: string
  readonly heading: string
  readonly greetingLine: string
  readonly message: string
  readonly referenceRow: string
  readonly followUp: string
  readonly ctaButton: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type ReservationCancellationRenderOptions =
  EmailTemplateRenderArgs<ReservationCancellationTemplateCopy, ReservationCancellationTemplateContext>

export type ReservationCancellationTemplate =
  EmailTemplate<ReservationCancellationTemplateCopy, ReservationCancellationTemplateContext>

export function createReservationCancellationTemplate(): ReservationCancellationTemplate {
  return createEmailTemplate<ReservationCancellationTemplateCopy, ReservationCancellationTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './reservation-cancellation.xml',
    copyPath: './reservation-cancellation-copy.json',
  })
}
