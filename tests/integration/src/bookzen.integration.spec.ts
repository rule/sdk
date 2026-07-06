import { RuleClient } from '@rule/sdk';
import {
  BookzenIntegration,
  BOOKZEN_FIELD_SCHEMA,
  BOOKZEN_SUBSCRIBER_SEED,
  BOOKZEN_SUBSCRIBER_FIELD_VALUES_SEED,
  BOOKZEN_BOOKING_FIELD_VALUES_SEED,
} from '@rule/vendor-bookzen';
import type {
  SeededBookzenSubscriber,
  BookzenSubscriberFieldName,
  BookzenBookingFieldName,
  BookzenFieldName,
} from '@rule/vendor-bookzen';


describe('integrate with Bookzen', () => {
  let bookzenIntegration: BookzenIntegration;

  beforeAll(async () => {
    const apiKey = process.env['RULE_API_KEY']!;
    const client = new RuleClient({ apiKey });

    bookzenIntegration = new BookzenIntegration(client);
  });

  it('initializes without error', () => {
    expect(bookzenIntegration).toBeDefined();
  });

  describe('seed subscriber', () => {
    it('seeds the subscriber with default email', async () => {
      const subscriber: SeededBookzenSubscriber | null = await bookzenIntegration.seedSubscriber();

      expect(subscriber).not.toBeNull();
      expect(subscriber?.email).toEqual(BOOKZEN_SUBSCRIBER_SEED.email);
    });

    it('seeds the subscriber with custom email', async () => {
      const customEmail = 'custom-bookzen-seed@rule.se'
      const subscriber: SeededBookzenSubscriber | null = await bookzenIntegration.seedSubscriber(customEmail);

      expect(subscriber).not.toBeNull();
      expect(subscriber?.email).toEqual(customEmail);
    });
  });

  describe('seed custom fields', () => {
    let seededSubscriber: SeededBookzenSubscriber | null;

    beforeAll(async () => {
      seededSubscriber = await bookzenIntegration.seedSubscriber();
    });

    it('seeds subscriber fields with default values', async () => {
      const response = await bookzenIntegration.seedSubscriberFields(seededSubscriber!.id);

      expect(response.success).toBe(true);
    });

    it('seeds subscriber fields with explicit values', async () => {
      const values = { guestFirstName: 'John' } satisfies Record<BookzenSubscriberFieldName, string | number | null>;
      const response = await bookzenIntegration.seedSubscriberFields(seededSubscriber!.id, values);

      expect(response.success).toBe(true);
    });

    it('seeds booking fields with default values', async () => {
      const response = await bookzenIntegration.seedBookingFields(seededSubscriber!.id);

      expect(response.success).toBe(true);
    });

    it('seeds booking fields with explicit values', async () => {
      const values = {
        bookingRef: 'BKZ-2026-0002',
        serviceType: 'hotel',
        checkInDate: '2026-05-02',
        checkOutDate: '2026-05-05',
        totalGuests: 1,
        totalPrice: 5200.0,
        roomName: 'Deluxe Double Room',
      } satisfies Record<BookzenBookingFieldName, string | number | null>;
      const response = await bookzenIntegration.seedBookingFields(seededSubscriber!.id, values);

      expect(response.success).toBe(true);
    });

    it('seeds all fields with default values', async () => {
      const response = await bookzenIntegration.seedAllFields(seededSubscriber!.id);

      expect(response.success).toBe(true);
    });

    it('seeds all fields with explicit values', async () => {
      const values = {
        ...BOOKZEN_SUBSCRIBER_FIELD_VALUES_SEED,
        ...BOOKZEN_BOOKING_FIELD_VALUES_SEED,
      } satisfies Record<BookzenFieldName, string | number | null>;
      const response = await bookzenIntegration.seedAllFields(seededSubscriber!.id, values);

      expect(response.success).toBe(true);
    });
  });

  describe('resolveCustomFields', () => {
    beforeAll(async () => {
      const subscriber = await bookzenIntegration.seedSubscriber();

      await bookzenIntegration.seedAllFields(subscriber!.id);
    });

    it('resolves all Bookzen field definitions', async () => {
      const resolved = await bookzenIntegration.resolveCustomFields(BOOKZEN_FIELD_SCHEMA);

      expect(resolved.size).toBe(Object.keys(BOOKZEN_FIELD_SCHEMA).length);

      for (const [vendorFieldName, def] of Object.entries(BOOKZEN_FIELD_SCHEMA)) {
        const resolvedField = resolved.get(vendorFieldName as BookzenFieldName);

        expect(resolvedField).toBeDefined();
        expect(resolvedField?.groupName).toBe(def.groupName);
        expect(resolvedField?.fieldName).toBe(def.fieldName);
        expect(resolvedField?.historical).toBe(def.historical);
        expect(resolvedField?.id).toBeTypeOf('number');
        expect(resolvedField?.type).toBeTypeOf('string');
      }
    });

    it('throws when the group does not exist', async () => {
      await expect(
        bookzenIntegration.resolveCustomFields({
          nonExistentField: {
            groupName: 'NonExistentGroup',
            fieldName: 'SomeField',
            historical: false,
            description: 'Test',
          },
        })
      ).rejects.toThrow('Custom field group "NonExistentGroup" not found');
    });
  });

  describe('seed tags', () => {
    let seededSubscriber: SeededBookzenSubscriber | null;

    beforeAll(async () => {
      seededSubscriber = await bookzenIntegration.seedSubscriber();
    });

    it('seeds all tags', async () => {
      const response = await bookzenIntegration.seedAllTags(seededSubscriber!.id);

      expect(response.success).toBe(true);
    });
  });
});
