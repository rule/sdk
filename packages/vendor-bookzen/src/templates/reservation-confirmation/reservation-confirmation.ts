/**
 * Reservation-confirmation template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 * Caller assembles {@link ReservationConfirmationTemplateContext}
 * with `customField` from `@rule/template-engine`; the factory handles
 * loading, compile, theme projection, xmlToRcml, and applyTheme.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

/**
 * Typed data context consumed by `reservation-confirmation.xml`.
 *
 * Optional fields gate their rows: omit `reservation.roomName` to
 * skip the room row, `reservation.checkOutDate` for single-date
 * stays, `reservation.totalPrice` to skip the price row.
 *
 * Theme-derived fields (logo, brand-color, social links) come from
 * `theme`. All caller-visible labels live in copy defaults.
 */
export interface ReservationConfirmationTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  reservation: {
    bookingRef: CustomFieldRef
    serviceType: CustomFieldRef
    totalGuests: CustomFieldRef
    checkInDate: CustomFieldRef
    checkOutDate?: CustomFieldRef
    totalPrice?: CustomFieldRef
    roomName?: CustomFieldRef
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

/**
 * Default copy tree for `reservation-confirmation.xml`. Override
 * `copy: { … }` at render time to customize labels or localize.
 */
export interface ReservationConfirmationTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly intro: string
  readonly detailsHeading: string
  readonly referenceRow: string
  readonly serviceRow: string
  readonly roomRow: string
  readonly checkInRow: string
  readonly checkOutRow: string
  readonly guestsRow: string
  readonly totalPriceRow: string
  readonly ctaButton: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type ReservationConfirmationRenderOptions =
  EmailTemplateRenderArgs<ReservationConfirmationTemplateCopy, ReservationConfirmationTemplateContext>

export type ReservationConfirmationTemplate =
  EmailTemplate<ReservationConfirmationTemplateCopy, ReservationConfirmationTemplateContext>

export function createReservationConfirmationTemplate(): ReservationConfirmationTemplate {
  return createEmailTemplate<ReservationConfirmationTemplateCopy, ReservationConfirmationTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './reservation-confirmation.xml',
    copyPath: './reservation-confirmation-copy.json',
  })
}
