/**
 * Bookzen Tag Definitions
 *
 * Standard tags used by Bookzen hospitality integrations with Rule.io.
 */

import type { VendorTagSchema } from '@rule/vendor';

/**
 * Bookzen tags for Rule.io automations.
 *
 * @example
 * ```typescript
 * import { BOOKZEN_TAGS } from '@rule/sdk';
 *
 * await client.syncSubscriber({
 *   email: 'guest@example.com',
 *   tags: [BOOKZEN_TAGS.accommodation],
 * }, 'Booking');
 * ```
 */
export const BOOKZEN_TAGS = {
  /** Service type tags — used for segmentation */
  accommodation: 'accommodation',
  restaurant: 'restaurant',
  experience: 'experience',

  /** Lifecycle tags — each triggers a distinct automation */
  reservationConfirmed: 'reservation-confirmed',
  reservationCancelled: 'reservation-cancelled',
  reservationReminder: 'reservation-reminder',
  feedbackRequest: 'feedback-request',
  reservationRequest: 'reservation-request',

  /** Customer segmentation */
  newCustomer: 'new-customer',
  returningCustomer: 'returning-customer',
} as const satisfies VendorTagSchema;

/** Object type of the Bookzen tag schema. */
export type BookzenTagSchema = typeof BOOKZEN_TAGS;

/** Union of logical Bookzen tag name keys. */
export type BookzenTagNames = keyof BookzenTagSchema;
