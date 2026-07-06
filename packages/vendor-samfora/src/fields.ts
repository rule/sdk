/**
 * Samfora Custom Field Definitions
 *
 * Field names used by the Samfora donation platform integration.
 * Samfora is a Swedish charitable giving platform.
 */

import type { VendorFieldSchema } from '@rule/vendor';

/**
 * Samfora field names for Rule.io custom fields.
 *
 * Follows Rule.io praxis for custom-field groups:
 * - **Subscriber group (flat)** — donor identity fields that get
 *   overwritten on each sync. Uses Rule.io's standard subscriber
 *   field names so consumers can reuse the fields that already exist
 *   on every Rule.io account instead of creating new custom ones.
 *   Only `donorFirstName` is required by the preset's templates;
 *   the rest are mapped for completeness so consumer extensions
 *   can reference them.
 * - **Donation group (historical)** — per-donation event data that
 *   appends a new record on each sync (`Donation.Amount`,
 *   `Donation.Date`, `Donation.Reference`, etc.).
 *
 * @example
 * ```typescript
 * import { SAMFORA_FIELDS } from '@rule/sdk';
 *
 * const customFields = {
 *   [SAMFORA_FIELDS.donorFirstName]: 47736,   // pre-existing in account
 *   [SAMFORA_FIELDS.donationAmount]: 200002,  // created by setup
 *   // ... map to your account's numeric IDs
 * };
 * ```
 */
export const SAMFORA_FIELDS = {
  // Subscriber group — flat, uses Rule.io's standard subscriber fields.
  // Only `donorFirstName` is required (used in greetings); the rest
  // are exposed so consumers can reference them in custom extensions.
  donorFirstName: 'Subscriber.FirstName',
  donorLastName: 'Subscriber.LastName',
  donorAddress1: 'Subscriber.Address1',
  donorAddress2: 'Subscriber.Address2',
  donorZipcode: 'Subscriber.Zipcode',
  donorCity: 'Subscriber.City',
  donorCountry: 'Subscriber.Country',
  donorPhone: 'Subscriber.Number',
  donorSource: 'Subscriber.Source',

  // Donation group — historical, append-only. Created per-account
  // by consumers or by a setup script.
  donationAmount: 'Donation.Amount',
  donationCurrency: 'Donation.Currency',
  donationDate: 'Donation.Date',
  donationRef: 'Donation.Reference',
  causeName: 'Donation.CauseName',
  donationType: 'Donation.Type',
  totalLifetimeAmount: 'Donation.TotalLifetime',
  taxYear: 'Donation.TaxYear',
  taxDeductibleAmount: 'Donation.TaxDeductible',
} as const satisfies VendorFieldSchema;

/** Object type of the Samfora field schema. */
export type SamforaFieldSchema = typeof SAMFORA_FIELDS;

/** Union of logical Samfora field name keys. */
export type SamforaFieldNames = keyof SamforaFieldSchema;
