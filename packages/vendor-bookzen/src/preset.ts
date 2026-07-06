import type { VendorConsumerConfig, VendorFieldInfo, AutomationConfigV2 } from '@rule/vendor';
import { VendorPresetError } from '@rule/vendor';
import type { BookzenFieldSchema } from './fields.js';
import type { BookzenTagSchema } from './tags.js';
import { BOOKZEN_FIELD_SCHEMA } from './fields.js';
import { BOOKZEN_TAGS } from './tags.js';

function fieldPath(groupName: string, fieldName: string): string {
  return `${groupName}.${fieldName}`;
}

function validateBookzenConfig(config: VendorConsumerConfig): void {
  const missingFields: string[] = [];

  for (const [logicalName, def] of Object.entries(BOOKZEN_FIELD_SCHEMA)) {
    const path = fieldPath(def.groupName, def.fieldName);

    if (config.customFields[path] === undefined) {
      missingFields.push(`${logicalName} ("${path}")`);
    }
  }

  if (missingFields.length > 0) {
    throw new VendorPresetError(
      `bookzenPreset: missing customFields entries for: ${missingFields.join(', ')}`
    );
  }
}

export const bookzenPreset: {
  readonly vendor: string;
  readonly displayName: string;
  readonly vertical: string;
  readonly fields: BookzenFieldSchema;
  readonly tags: BookzenTagSchema;
  getAutomations(config: VendorConsumerConfig): AutomationConfigV2[];
  getAutomation(id: string, config: VendorConsumerConfig): AutomationConfigV2 | undefined;
  validateConfig(config: VendorConsumerConfig): void;
  getRequiredFields(): readonly VendorFieldInfo[];
} = {
  vendor: 'bookzen',
  displayName: 'Bookzen',
  vertical: 'hospitality',
  fields: BOOKZEN_FIELD_SCHEMA,
  tags: BOOKZEN_TAGS,

  getAutomations(_config: VendorConsumerConfig): AutomationConfigV2[] {
    return [];
  },

  getAutomation(_id: string, _config: VendorConsumerConfig): AutomationConfigV2 | undefined {
    return undefined;
  },

  validateConfig: validateBookzenConfig,

  getRequiredFields(): readonly VendorFieldInfo[] {
    return Object.entries(BOOKZEN_FIELD_SCHEMA).map(([logicalName, def]) => ({
      logicalName,
      fieldName: fieldPath(def.groupName, def.fieldName),
      description: def.description,
    }));
  },
};
