import type { VendorConsumerConfig, VendorFieldInfo, AutomationConfigV2 } from '@rule/vendor';
import { VendorPresetError } from '@rule/vendor';
import type { BookVisitFieldSchema } from './fields.js';
import type { BookVisitTagSchema } from './tags.js';
import { BOOKVISIT_FIELD_SCHEMA } from './fields.js';
import { BOOKVISIT_TAGS } from './tags.js';

function fieldPath(groupName: string, fieldName: string): string {
  return `${groupName}.${fieldName}`;
}

function validateBookVisitConfig(config: VendorConsumerConfig): void {
  const missingFields: string[] = [];

  for (const [logicalName, def] of Object.entries(BOOKVISIT_FIELD_SCHEMA)) {
    const path = fieldPath(def.groupName, def.fieldName);

    if (config.customFields[path] === undefined) {
      missingFields.push(`${logicalName} ("${path}")`);
    }
  }

  if (missingFields.length > 0) {
    throw new VendorPresetError(
      `bookvisitPreset: missing customFields entries for: ${missingFields.join(', ')}`
    );
  }
}

export const bookvisitPreset: {
  readonly vendor: string;
  readonly displayName: string;
  readonly vertical: string;
  readonly fields: BookVisitFieldSchema;
  readonly tags: BookVisitTagSchema;
  getAutomations(config: VendorConsumerConfig): AutomationConfigV2[];
  getAutomation(id: string, config: VendorConsumerConfig): AutomationConfigV2 | undefined;
  validateConfig(config: VendorConsumerConfig): void;
  getRequiredFields(): readonly VendorFieldInfo[];
} = {
  vendor: 'bookvisit',
  displayName: 'BookVisit',
  vertical: 'hospitality',
  fields: BOOKVISIT_FIELD_SCHEMA,
  tags: BOOKVISIT_TAGS,

  getAutomations(_config: VendorConsumerConfig): AutomationConfigV2[] {
    return [];
  },

  getAutomation(_id: string, _config: VendorConsumerConfig): AutomationConfigV2 | undefined {
    return undefined;
  },

  validateConfig: validateBookVisitConfig,

  getRequiredFields(): readonly VendorFieldInfo[] {
    return Object.entries(BOOKVISIT_FIELD_SCHEMA).map(([logicalName, def]) => ({
      logicalName,
      fieldName: fieldPath(def.groupName, def.fieldName),
      description: def.description,
    }));
  },
};
