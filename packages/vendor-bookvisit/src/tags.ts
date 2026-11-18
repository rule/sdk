/**
 * BookVisit Tag Definitions
 *
 * Tags applied by `convertBookVisitBooking` to BookVisit guests in Rule.io.
 */

import type { VendorTagSchema } from '@rule/vendor';

/**
 * BookVisit tags for Rule.io automations.
 *
 * @example
 * ```typescript
 * import { BOOKVISIT_TAGS } from '@rule/vendor-bookvisit';
 *
 * const segmentTag = BOOKVISIT_TAGS.marketingConsent; // 'marketing-consent'
 * ```
 */
export const BOOKVISIT_TAGS = {
  /**
   * Lifecycle tags — one per booking status. `subscribers.sync()` adds them as
   * markers without firing automations; send the booking email with
   * `client.subscribers.resetTagAutomation()` (see `lifecycleTag` on the
   * converter result).
   */
  bookingConfirmed: 'booking-confirmed',
  bookingChanged: 'booking-changed',
  bookingCancelled: 'booking-cancelled',
  bookingNoShow: 'booking-no-show',

  /** Source tags — booked directly with the hotel or through an OTA */
  direct: 'direct',
  ota: 'ota',

  /** Conference booking */
  conference: 'conference',

  /** Guest opted in to marketing email in BookVisit's own booking flow (never set for OTA bookings) */
  marketingConsent: 'marketing-consent',
} as const satisfies VendorTagSchema;

/** Object type of the BookVisit tag schema. */
export type BookVisitTagSchema = typeof BOOKVISIT_TAGS;

/** Union of logical BookVisit tag name keys. */
export type BookVisitTagNames = keyof BookVisitTagSchema;

/** The four lifecycle tag values, one per booking status. */
export type BookVisitLifecycleTag = BookVisitTagSchema[
  'bookingConfirmed' | 'bookingChanged' | 'bookingCancelled' | 'bookingNoShow'
];
