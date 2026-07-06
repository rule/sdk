/**
 * Reservation-request (pending) template factory.
 *
 * Sent when a reservation request is received and awaiting manual
 * approval. Has no CTA — the email is purely informational.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

export interface ReservationRequestTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  reservation: {
    bookingRef: CustomFieldRef
    checkInDate: CustomFieldRef
    checkOutDate?: CustomFieldRef
    totalGuests: CustomFieldRef
  }
  footer: {
    fontSize: string
    textColor: string
  }
}

export interface ReservationRequestTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly message: string
  readonly detailsHeading: string
  readonly referenceRow: string
  /** Single-date row (used when only `checkInDate` is supplied). */
  readonly dateRow: string
  /** Date-range row (used when both check-in and check-out supplied). */
  readonly dateRangeRow: string
  readonly guestsRow: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type ReservationRequestRenderOptions =
  EmailTemplateRenderArgs<ReservationRequestTemplateCopy, ReservationRequestTemplateContext>

export type ReservationRequestTemplate =
  EmailTemplate<ReservationRequestTemplateCopy, ReservationRequestTemplateContext>

export function createReservationRequestTemplate(): ReservationRequestTemplate {
  return createEmailTemplate<ReservationRequestTemplateCopy, ReservationRequestTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './reservation-request.xml',
    copyPath: './reservation-request-copy.json',
  })
}
