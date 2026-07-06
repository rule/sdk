import { RuleApiError } from '@rule/client';
import type {
  CustomFieldGroupEntry,
  RuleApiResponse,
  RuleClient,
  Subscriber,
  WriteCustomFieldDataPayload,
} from '@rule/client';
import {
  BOOKZEN_BOOKING_FIELD_SCHEMA,
  BOOKZEN_FIELD_SCHEMA,
  BOOKZEN_SUBSCRIBER_FIELD_SCHEMA
} from './fields.js';
import type {
  BookzenFieldName,
  BookzenSubscriberFieldName,
  BookzenBookingFieldName,
  BookzenFieldSchema
} from './fields.js';
import type { ResolvedVendorField, VendorFieldDefinition, VendorFieldSchema } from './types.js';
import { BOOKZEN_TAGS } from './tags.js';


export type SeededBookzenSubscriber = {
  id: number;
  email: string | null;
}

// TODO: move seeds to the separate file
export const BOOKZEN_SUBSCRIBER_SEED = {
  email: 'bookzen-seed@rule.se',
}

export const BOOKZEN_SUBSCRIBER_FIELD_VALUES_SEED = {
  guestFirstName: 'Astrid',
} satisfies Record<BookzenSubscriberFieldName, string | number | null>;

export const BOOKZEN_BOOKING_FIELD_VALUES_SEED = {
  bookingRef: 'BKZ-2026-0001',
  serviceType: 'accommodation',
  checkInDate: '2026-05-01',
  checkOutDate: '2026-05-04',
  totalGuests: 2,
  totalPrice: 3600.0,
  roomName: 'Superior Sea View',
} satisfies Record<BookzenBookingFieldName, string | number | null>;

export const BOOKZEN_FIELD_VALUES_SEED = {
  ...BOOKZEN_SUBSCRIBER_FIELD_VALUES_SEED,
  ...BOOKZEN_BOOKING_FIELD_VALUES_SEED,
} satisfies Record<BookzenFieldName, string | number | null>;

export class BookzenIntegration {
  constructor(private readonly _client: RuleClient) {
  }

  async setup(): Promise<void> {
    const subscriber: SeededBookzenSubscriber | null = await this.seedSubscriber();

    if (!subscriber) {
      throw new Error('Failed to seed the subscriber');
    }

    const seedCustomFieldsResult: RuleApiResponse = await this.seedAllFields(subscriber.id, BOOKZEN_FIELD_VALUES_SEED);

    if (!seedCustomFieldsResult.success) {
      throw new Error('Failed to seed custom fields: ' + seedCustomFieldsResult.error);
    }

    const seedAllTagsResult: RuleApiResponse = await this.seedAllTags(subscriber.id);

    if (!seedAllTagsResult.success) {
      throw new Error('Failed to seed all tags: ' + seedAllTagsResult.error);
    }

    const resolvedCustomFieldsMap: Map<BookzenFieldName, ResolvedVendorField> = await this.resolveCustomFields<BookzenFieldSchema>(BOOKZEN_FIELD_SCHEMA);

    console.log('Setup completed successfully. Resolved custom fields:', Object.fromEntries(resolvedCustomFieldsMap.entries()));
  }

  async seedSubscriber(email = BOOKZEN_SUBSCRIBER_SEED.email): Promise<SeededBookzenSubscriber | null> {
    try {
      const subscriber: Subscriber = await this._client.subscribers.create({ email });

      return {
        id: subscriber.id,
        email: subscriber.email,
      };
    } catch (error) {
      if (!(error instanceof RuleApiError) || !error.isConflict()) throw error;

      const existing: Subscriber | null = await this._client.subscribers.getByEmail(email);

      return existing ? {
        id: existing.id,
        email: existing.email,
      } : null;
    }
  }

  async seedSubscriberFields(
    subscriberId: number,
    fieldValues = BOOKZEN_SUBSCRIBER_FIELD_VALUES_SEED
  ): Promise<RuleApiResponse> {
    return this._client.subscribers.writeCustomFieldData(
      subscriberId,
      this._buildCustomFieldGroupsFromSchema(BOOKZEN_SUBSCRIBER_FIELD_SCHEMA, fieldValues)
    );
  }

  async seedBookingFields(
    subscriberId: number,
    fieldValues = BOOKZEN_BOOKING_FIELD_VALUES_SEED
  ): Promise<RuleApiResponse> {
    return this._client.subscribers.writeCustomFieldData(
      subscriberId,
      this._buildCustomFieldGroupsFromSchema(BOOKZEN_BOOKING_FIELD_SCHEMA, fieldValues)
    );
  }

  async seedAllFields(
    subscriberId: number,
    fieldValues = BOOKZEN_FIELD_VALUES_SEED
  ): Promise<RuleApiResponse> {
    return this._client.subscribers.writeCustomFieldData(
      subscriberId,
      this._buildCustomFieldGroupsFromSchema(BOOKZEN_FIELD_SCHEMA, fieldValues)
    );
  }

  async resolveCustomFields<T extends Partial<VendorFieldSchema>>(schema: T): Promise<Map<keyof T, ResolvedVendorField>> {
    const entries = Object.entries(schema) as [string, VendorFieldDefinition][];
    const groupNames = [...new Set(entries.map(([, def]) => def.groupName))];

    const groups = await Promise.all(
      groupNames.map(async (name) => {
        const group = await this._client.customField.getGroupByName(name);

        if (!group) {
          throw new Error(`Custom field group "${name}" not found in Rule.io account`);
        }

        return group;
      })
    );

    const groupFieldsMap = new Map(groupNames.map((name, i) => [name, groups[i]?.fields ?? []]));
    const result = new Map<string, ResolvedVendorField>();

    for (const [vendorFieldName, def] of entries) {
      const fields = groupFieldsMap.get(def.groupName) ?? [];
      const field = fields.find((f) => f.name === def.fieldName);

      if (!field) {
        throw new Error(`Custom field "${def.fieldName}" not found in group "${def.groupName}"`);
      }

      result.set(vendorFieldName, { ...def, id: field.id, type: field.type });
    }

    return result;
  }

  async seedAllTags(subscriberId: number): Promise<RuleApiResponse> {
    const tags = Object.values(BOOKZEN_TAGS);

    // No automation: tag seeding in test fixtures should not trigger automations.
    await Promise.all(
      tags.map((tag) => this._client.subscribers.addSubscriberTag({ id: subscriberId }, tag))
    );

    return { success: true };
  }

  private _buildCustomFieldGroupsFromSchema(
    fields: VendorFieldSchema,
    fieldValues: Record<string, string | number | null>
  ): WriteCustomFieldDataPayload {
    const groupMap = new Map<string, CustomFieldGroupEntry>();

    for (const [ fieldName, { groupName, fieldName: ruleName, historical } ] of Object.entries(fields)) {
      let groupEntry = groupMap.get(groupName);

      if (!groupEntry) {
        groupEntry = { group: groupName, historical, createIfNotExists: true, values: [] };
        groupMap.set(groupName, groupEntry);
      }

      groupEntry.values.push({
        field: ruleName,
        createIfNotExists: true,
        value: String(fieldValues[fieldName] ?? '')
      });
    }

    return { groups: Array.from(groupMap.values()) };
  }
}
