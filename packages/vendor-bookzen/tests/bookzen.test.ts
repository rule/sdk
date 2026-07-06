/**
 * Bookzen Vendor Preset Tests
 */

import { describe, it, expect } from 'vitest';
import { VendorPresetError } from '@rule/vendor';
import type { CustomFieldMap, VendorConsumerConfig } from '@rule/vendor';
import { bookzenPreset, BOOKZEN_FIELD_SCHEMA, BOOKZEN_TAGS } from '../src/index.js';
import { TEST_THEME } from './helpers.js';

// ============================================================================
// Shared fixtures
// ============================================================================

const TEST_CUSTOM_FIELDS: CustomFieldMap = {
  'Subscriber.FirstName': 100001,
  'Booking.BookingRef': 100002,
  'Booking.ServiceType': 100003,
  'Booking.CheckInDate': 100004,
  'Booking.CheckOutDate': 100005,
  'Booking.TotalGuests': 100006,
  'Booking.TotalPrice': 100007,
  'Booking.RoomName': 100008,
};

const TEST_CONFIG: VendorConsumerConfig = {
  theme: TEST_THEME,
  customFields: TEST_CUSTOM_FIELDS,
  websiteUrl: 'https://myhotel.example.com',
};

// ============================================================================
// Preset metadata
// ============================================================================

describe('bookzenPreset', () => {
  it('has correct vendor metadata', () => {
    expect(bookzenPreset.vendor).toBe('bookzen');
    expect(bookzenPreset.displayName).toBe('Bookzen');
    expect(bookzenPreset.vertical).toBe('hospitality');
  });

  it('exposes field and tag schemas', () => {
    expect(bookzenPreset.fields).toBe(BOOKZEN_FIELD_SCHEMA);
    expect(bookzenPreset.tags).toBe(BOOKZEN_TAGS);
  });

  // ============================================================================
  // Validation
  // ============================================================================

  describe('validateConfig', () => {
    it('passes with all required fields', () => {
      expect(() => bookzenPreset.validateConfig(TEST_CONFIG)).not.toThrow();
    });

    it('throws VendorPresetError when fields are missing', () => {
      const incompleteConfig: VendorConsumerConfig = {
        ...TEST_CONFIG,
        customFields: {
          'Subscriber.FirstName': 100001,
        },
      };

      expect(() => bookzenPreset.validateConfig(incompleteConfig)).toThrow(VendorPresetError);
    });

    it('error message lists the missing fields', () => {
      const incompleteConfig: VendorConsumerConfig = {
        ...TEST_CONFIG,
        customFields: {},
      };

      expect(() => bookzenPreset.validateConfig(incompleteConfig)).toThrow(
        /bookzenPreset.*guestFirstName/
      );
    });
  });

  // ============================================================================
  // getRequiredFields
  // ============================================================================

  describe('getRequiredFields', () => {
    it('returns all fields with descriptions', () => {
      const fields = bookzenPreset.getRequiredFields();

      expect(fields.length).toBe(Object.keys(BOOKZEN_FIELD_SCHEMA).length);

      for (const field of fields) {
        expect(field.logicalName).toBeTruthy();
        expect(field.fieldName).toBeTruthy();
        expect(field.description).toBeTruthy();
        const def = BOOKZEN_FIELD_SCHEMA[field.logicalName as keyof typeof BOOKZEN_FIELD_SCHEMA];

        expect(`${def.groupName}.${def.fieldName}`).toBe(field.fieldName);
      }
    });
  });

  // ============================================================================
  // getAutomations
  // ============================================================================

  describe('getAutomations', () => {
    // The pre-built automation entries have been retired. Template
    // authors now build contexts directly via the factory functions
    // (createReservationConfirmationTemplate, etc.) and wire
    // automations through @rule/client. See
    // packages/templates/README.md for the authoring pattern.
    it('returns an empty list (pre-built automations retired)', () => {
      const automations = bookzenPreset.getAutomations(TEST_CONFIG);

      expect(automations).toHaveLength(0);
    });
  });

  // ============================================================================
  // getAutomation
  // ============================================================================

  describe('getAutomation', () => {
    it('returns undefined for any ID (no automations defined)', () => {
      const automation = bookzenPreset.getAutomation('nonexistent', TEST_CONFIG);

      expect(automation).toBeUndefined();
    });
  });
});

// ============================================================================
// Field and tag constants
// ============================================================================

describe('BOOKZEN_FIELDS', () => {
  it('all values are valid field definitions', () => {
    for (const def of Object.values(BOOKZEN_FIELD_SCHEMA)) {
      expect(typeof def.groupName).toBe('string');
      expect(def.groupName.length).toBeGreaterThan(0);
      expect(typeof def.fieldName).toBe('string');
      expect(def.fieldName.length).toBeGreaterThan(0);
      expect(typeof def.historical).toBe('boolean');
      expect(typeof def.description).toBe('string');
      expect(def.description.length).toBeGreaterThan(0);
    }
  });

  it('splits fields between the flat Subscriber group and the historical Booking group', () => {
    // Rule.io praxis: guest identity on the flat Subscriber group
    // (overwritten per sync); per-booking event data on the historical
    // Booking group (appended per sync).
    expect(BOOKZEN_FIELD_SCHEMA.guestFirstName.groupName).toBe('Subscriber');
    expect(BOOKZEN_FIELD_SCHEMA.guestFirstName.historical).toBe(false);

    const bookingFields = [
      BOOKZEN_FIELD_SCHEMA.bookingRef,
      BOOKZEN_FIELD_SCHEMA.serviceType,
      BOOKZEN_FIELD_SCHEMA.checkInDate,
      BOOKZEN_FIELD_SCHEMA.checkOutDate,
      BOOKZEN_FIELD_SCHEMA.totalGuests,
      BOOKZEN_FIELD_SCHEMA.totalPrice,
      BOOKZEN_FIELD_SCHEMA.roomName,
    ];

    for (const def of bookingFields) {
      expect(def.groupName).toBe('Booking');
      expect(def.historical).toBe(true);
    }
  });

  it('every field uses either the Subscriber or Booking group', () => {
    for (const def of Object.values(BOOKZEN_FIELD_SCHEMA)) {
      expect(['Subscriber', 'Booking']).toContain(def.groupName);
    }
  });
});

describe('BOOKZEN_TAGS', () => {
  it('all values are non-empty strings', () => {
    for (const value of Object.values(BOOKZEN_TAGS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });
});
