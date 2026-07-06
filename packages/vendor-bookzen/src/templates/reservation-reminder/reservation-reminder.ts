/**
 * Reservation-reminder template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 *
 * Optional sections gate on context: omit `reservation.checkOutDate`
 * to render a single-date row; omit `reservation.roomName` to skip
 * the room row; omit `practicalInfo` to skip the practical-info
 * paragraph. The CTA always renders.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

export interface ReservationReminderTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  reservation: {
    checkInDate: CustomFieldRef
    checkOutDate?: CustomFieldRef
    roomName?: CustomFieldRef
  }
  /** Caller-supplied practical-info paragraph body. Omit to skip. */
  practicalInfo?: string
  /** URL the CTA button links to. */
  websiteUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

export interface ReservationReminderTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly intro: string
  readonly detailsHeading: string
  /** Single-date row (used when only `checkInDate` is supplied). */
  readonly dateRow: string
  /** Date-range row (used when both check-in and check-out supplied). */
  readonly dateRangeRow: string
  readonly roomRow: string
  readonly practicalInfoHeading: string
  /** Body row for practical info. Slot: `{{text}}` filled from context. */
  readonly practicalInfoBody: string
  readonly ctaButton: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type ReservationReminderRenderOptions =
  EmailTemplateRenderArgs<ReservationReminderTemplateCopy, ReservationReminderTemplateContext>

export type ReservationReminderTemplate =
  EmailTemplate<ReservationReminderTemplateCopy, ReservationReminderTemplateContext>

export function createReservationReminderTemplate(): ReservationReminderTemplate {
  return createEmailTemplate<ReservationReminderTemplateCopy, ReservationReminderTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './reservation-reminder.xml',
    copyPath: './reservation-reminder-copy.json',
  })
}
