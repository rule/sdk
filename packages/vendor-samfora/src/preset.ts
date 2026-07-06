/**
 * Samfora Vendor Preset
 *
 * Swedish charitable-donation preset for Samfora integrations with Rule.io.
 *
 * @example
 * ```typescript
 * import { samforaPreset, SAMFORA_FIELDS } from '@rule/sdk';
 *
 * const config = {
 *   brandStyle: myBrandStyle,
 *   customFields: {
 *     [SAMFORA_FIELDS.donorFirstName]: 200001,
 *     [SAMFORA_FIELDS.donationAmount]: 200002,
 *     [SAMFORA_FIELDS.donationDate]: 200003,
 *     [SAMFORA_FIELDS.donationRef]: 200004,
 *     [SAMFORA_FIELDS.causeName]: 200005,
 *     [SAMFORA_FIELDS.totalLifetimeAmount]: 200006,
 *     [SAMFORA_FIELDS.taxYear]: 200007,
 *     [SAMFORA_FIELDS.taxDeductibleAmount]: 200008,
 *     // Optional: donationCurrency, donationType
 *   },
 *   websiteUrl: 'https://samfora.org',
 * };
 *
 * samforaPreset.validateConfig(config);
 * const automations = samforaPreset.getAutomations(config);
 * ```
 */

import type { AutomationConfigV2, VendorPreset, VendorConsumerConfig, VendorFieldInfo } from '@rule/vendor';
import { resolveVendorAutomations } from '@rule/vendor';
import type { SamforaFieldSchema, SamforaFieldNames } from './fields.js';
import type { SamforaTagSchema } from './tags.js';
import { SAMFORA_FIELDS } from './fields.js';
import { SAMFORA_TAGS } from './tags.js';
import { createSamforaAutomations } from './automations.js';
import { VendorPresetError } from '@rule/vendor';

const FIELD_DESCRIPTIONS: Record<SamforaFieldNames, string> = {
  // Subscriber (standard Rule.io fields)
  donorFirstName: 'Donor first name (standard Subscriber field)',
  donorLastName: 'Donor last name (standard Subscriber field)',
  donorAddress1: 'Donor street address, line 1 (standard Subscriber field)',
  donorAddress2: 'Donor street address, line 2 (standard Subscriber field)',
  donorZipcode: 'Donor postal / ZIP code (standard Subscriber field)',
  donorCity: 'Donor city (standard Subscriber field)',
  donorCountry: 'Donor country (standard Subscriber field)',
  donorPhone: 'Donor phone number (standard Subscriber.Number field)',
  donorSource: 'Signup source (standard Subscriber field)',

  // Donation (historical)
  donationAmount: 'Amount of the donation',
  donationCurrency: 'Currency code (e.g. SEK, EUR)',
  donationDate: 'Date the donation was made',
  donationRef: 'Receipt / transaction reference',
  causeName: 'Charity or cause the gift supports',
  donationType: 'Donation type (one-time / monthly)',
  totalLifetimeAmount: "Donor's lifetime total (used in the annual tax summary)",
  taxYear: 'Tax year for the annual summary',
  taxDeductibleAmount: 'Deductible amount for Swedish gåvoskatteavdrag',
};

/**
 * Fields required by every automation `getAutomations()` returns.
 *
 * Includes the tax-summary's extra fields (`taxYear`, `totalLifetimeAmount`,
 * `taxDeductibleAmount`) so that `validateConfig` passing guarantees every
 * automation in the returned array is buildable. Earlier versions left the
 * tax fields out and validated them inside the template builder, which
 * created a contract mismatch — a consumer could pass validation and still
 * hit a runtime error while iterating.
 *
 * Subscriber-group fields beyond `donorFirstName` (last name, address,
 * city, etc.) stay optional — they're exposed in `SAMFORA_FIELDS` so
 * consumers can reference them from custom extensions, but none of the
 * preset's own template builders currently render them.
 *
 * `donationCurrency` and `donationType` stay optional: currency is a nice-
 * to-have display token, and `donationType` isn't referenced by any of the
 * current template builders.
 */
const REQUIRED_FIELDS: readonly SamforaFieldNames[] = [
  'donorFirstName',
  'donationAmount',
  'donationDate',
  'donationRef',
  'causeName',
  'totalLifetimeAmount',
  'taxYear',
  'taxDeductibleAmount',
];

function validateSamforaConfig(config: VendorConsumerConfig): void {
  const missingFields: string[] = [];

  for (const logicalName of REQUIRED_FIELDS) {
    const fieldName = SAMFORA_FIELDS[logicalName];

    if (config.customFields[fieldName] === undefined) {
      missingFields.push(`${logicalName} ("${fieldName}")`);
    }
  }

  if (missingFields.length > 0) {
    throw new VendorPresetError(
      `samforaPreset: missing customFields entries for: ${missingFields.join(', ')}`,
    );
  }
}

function resolveAutomations(config: VendorConsumerConfig): AutomationConfigV2[] {
  return resolveVendorAutomations(createSamforaAutomations(), config);
}

/**
 * Samfora vendor preset for Rule.io.
 *
 * Provides pre-configured automations for the Samfora donation platform:
 * donation confirmation (first-time, second, and returning donors),
 * monthly donation confirmation, welcome, and annual tax summary.
 *
 * All default copy is in Swedish to match Samfora's market.
 */
export const samforaPreset: VendorPreset<SamforaFieldSchema, SamforaTagSchema> = {
  vendor: 'samfora',
  displayName: 'Samfora',
  vertical: 'donation',
  fields: SAMFORA_FIELDS,
  tags: SAMFORA_TAGS,

  getAutomations(config: VendorConsumerConfig): AutomationConfigV2[] {
    validateSamforaConfig(config);

    return resolveAutomations(config);
  },

  getAutomation(id: string, config: VendorConsumerConfig): AutomationConfigV2 | undefined {
    validateSamforaConfig(config);

    return resolveAutomations(config).find((a) => a.id === id);
  },

  validateConfig: validateSamforaConfig,

  getRequiredFields(): readonly VendorFieldInfo[] {
    return REQUIRED_FIELDS.map((logicalName) => ({
      logicalName,
      fieldName: SAMFORA_FIELDS[logicalName],
      description: FIELD_DESCRIPTIONS[logicalName],
    }));
  },
};
