/**
 * Norce Vendor Preset
 *
 * E-commerce preset for the Norce Commerce→Rule.io integration. Ships the
 * field and tag schemas and config validation; like the Shopify preset it
 * has no pre-built automations — callers wire templates to the tags
 * themselves.
 *
 * @example
 * ```typescript
 * import { norcePreset, NORCE_FIELDS } from '@rule/vendor-norce';
 *
 * norcePreset.validateConfig({
 *   theme,
 *   customFields: {
 *     [NORCE_FIELDS.firstName]: 169233,
 *     [NORCE_FIELDS.orderNumber]: 169234,
 *     [NORCE_FIELDS.totalIncVat]: 169235,
 *   },
 *   websiteUrl: 'https://myshop.com',
 * });
 * ```
 */

import type { AutomationConfigV2, VendorPreset, VendorConsumerConfig, VendorFieldInfo } from '@rule/vendor';
import { VendorPresetError } from '@rule/vendor';
import type { NorceFieldSchema, NorceFieldNames } from './fields.js';
import type { NorceTagSchema } from './tags.js';
import { NORCE_FIELDS } from './fields.js';
import { NORCE_TAGS } from './tags.js';

/** Fields an order email needs (must be mapped in customFields). */
const REQUIRED_FIELDS = ['firstName', 'orderNumber', 'totalIncVat'] as const satisfies readonly NorceFieldNames[];

const REQUIRED_FIELD_DESCRIPTIONS: Record<(typeof REQUIRED_FIELDS)[number], string> = {
  firstName: 'Customer first name',
  orderNumber: 'Norce order number (OrderNo)',
  totalIncVat: 'Order total incl. VAT',
};

function validateNorceConfig(config: VendorConsumerConfig): void {
  const missingFields = REQUIRED_FIELDS
    .filter((logicalName) => config.customFields[NORCE_FIELDS[logicalName]] === undefined)
    .map((logicalName) => `${logicalName} ("${NORCE_FIELDS[logicalName]}")`);

  if (missingFields.length > 0) {
    throw new VendorPresetError(
      `norcePreset: missing customFields entries for: ${missingFields.join(', ')}`
    );
  }
}

/**
 * Norce vendor preset for Rule.io.
 *
 * `getAutomations` returns `[]`: no automations are pre-built. The tags in
 * {@link NORCE_TAGS} are the triggers to wire order emails to.
 */
export const norcePreset: VendorPreset<NorceFieldSchema, NorceTagSchema> = {
  vendor: 'norce',
  displayName: 'Norce',
  vertical: 'ecommerce',
  fields: NORCE_FIELDS,
  tags: NORCE_TAGS,

  getAutomations(config: VendorConsumerConfig): AutomationConfigV2[] {
    validateNorceConfig(config);

    return [];
  },

  getAutomation(_id: string, config: VendorConsumerConfig): AutomationConfigV2 | undefined {
    validateNorceConfig(config);

    return undefined;
  },

  validateConfig: validateNorceConfig,

  getRequiredFields(): readonly VendorFieldInfo[] {
    return REQUIRED_FIELDS.map((logicalName) => ({
      logicalName,
      fieldName: NORCE_FIELDS[logicalName],
      description: REQUIRED_FIELD_DESCRIPTIONS[logicalName],
    }));
  },
};
