/**
 * Samfora Tag Definitions
 *
 * Tags used by the Samfora charitable donation integration with Rule.io.
 *
 * Trigger tags fire an automation. Segment tags refine behaviour (e.g.
 * branch donation-confirmation copy between first-time, second-time, and
 * returning donors) without triggering a new flow on their own.
 */

import type { VendorTagSchema } from '@rule/vendor';

/**
 * Samfora tags for Rule.io automations.
 *
 * @example
 * ```typescript
 * import { SAMFORA_TAGS } from '@rule/sdk';
 *
 * await client.syncSubscriber({
 *   email: 'donor@example.com',
 *   tags: [SAMFORA_TAGS.donationReceived, SAMFORA_TAGS.donorFirstGift],
 * }, 'Donation');
 * ```
 */
export const SAMFORA_TAGS = {
  /** Trigger tags — each starts a distinct automation */
  donationReceived: 'donation-received',
  monthlyDonation: 'monthly-donation',
  newDonor: 'new-donor',
  annualTaxSummary: 'annual-tax-summary',

  /** Donor-lifecycle segment tags — used as conditions on confirmation flows */
  donorFirstGift: 'donor-first-gift',
  donorSecondGift: 'donor-second-gift',
  donorReturning: 'donor-returning',
  monthlyGiver: 'monthly-giver',
} as const satisfies VendorTagSchema;

/** Object type of the Samfora tag schema. */
export type SamforaTagSchema = typeof SAMFORA_TAGS;

/** Union of logical Samfora tag name keys. */
export type SamforaTagNames = keyof SamforaTagSchema;
