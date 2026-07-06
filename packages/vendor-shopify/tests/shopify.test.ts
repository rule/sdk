/**
 * Shopify Vendor Preset Tests
 */

import { describe, it, expect } from 'vitest';
import { VendorPresetError } from '@rule/vendor';
import type { CustomFieldMap, VendorConsumerConfig } from '@rule/vendor';
import { shopifyPreset, SHOPIFY_FIELDS, SHOPIFY_TAGS } from '../src/index.js';
import { TEST_THEME } from '../src/test-fixtures.js';

// ============================================================================
// Shared fixtures
// ============================================================================

const TEST_CUSTOM_FIELDS: CustomFieldMap = {
  // Subscriber fields
  [SHOPIFY_FIELDS.firstName]: 200001,
  [SHOPIFY_FIELDS.lastName]: 200002,
  // Order fields
  [SHOPIFY_FIELDS.orderNumber]: 200003,
  [SHOPIFY_FIELDS.orderDate]: 200004,
  [SHOPIFY_FIELDS.totalPrice]: 200005,
  [SHOPIFY_FIELDS.totalTax]: 200006,
  [SHOPIFY_FIELDS.totalWeight]: 200007,
  [SHOPIFY_FIELDS.discount]: 200008,
  [SHOPIFY_FIELDS.currency]: 200009,
  [SHOPIFY_FIELDS.gateway]: 200010,
  [SHOPIFY_FIELDS.productCount]: 200011,
  [SHOPIFY_FIELDS.names]: 200012,
  [SHOPIFY_FIELDS.skus]: 200013,
  [SHOPIFY_FIELDS.products]: 200014,
  [SHOPIFY_FIELDS.cartUrl]: 200015,
  // Shipping address
  [SHOPIFY_FIELDS.shippingAddress1]: 200016,
  [SHOPIFY_FIELDS.shippingAddress2]: 200017,
  [SHOPIFY_FIELDS.shippingCity]: 200018,
  [SHOPIFY_FIELDS.shippingZip]: 200019,
  [SHOPIFY_FIELDS.shippingCountryCode]: 200020,
};

const TEST_CONFIG: VendorConsumerConfig = {
  theme: TEST_THEME,
  customFields: TEST_CUSTOM_FIELDS,
  websiteUrl: 'https://myshop.example.com',
};

// ============================================================================
// Preset metadata
// ============================================================================

describe('shopifyPreset', () => {
  it('has correct vendor metadata', () => {
    expect(shopifyPreset.vendor).toBe('shopify');
    expect(shopifyPreset.displayName).toBe('Shopify');
    expect(shopifyPreset.vertical).toBe('ecommerce');
  });

  it('exposes field and tag schemas', () => {
    expect(shopifyPreset.fields).toBe(SHOPIFY_FIELDS);
    expect(shopifyPreset.tags).toBe(SHOPIFY_TAGS);
  });

  // ============================================================================
  // Validation
  // ============================================================================

  describe('validateConfig', () => {
    it('passes with all required fields', () => {
      expect(() => shopifyPreset.validateConfig(TEST_CONFIG)).not.toThrow();
    });

    it('passes without optional fields and builds all templates', () => {
      const minimalConfig: VendorConsumerConfig = {
        ...TEST_CONFIG,
        customFields: {
          [SHOPIFY_FIELDS.firstName]: 1,
          [SHOPIFY_FIELDS.orderNumber]: 2,
          [SHOPIFY_FIELDS.totalPrice]: 3,
        },
      };

      expect(() => {
        shopifyPreset.validateConfig(minimalConfig);
        // Ensure automations (and their templates) build with minimal config
        shopifyPreset.getAutomations(minimalConfig);
      }).not.toThrow();
    });

    it('throws VendorPresetError when fields are missing', () => {
      const incompleteConfig: VendorConsumerConfig = {
        ...TEST_CONFIG,
        customFields: {
          [SHOPIFY_FIELDS.firstName]: 200001,
          // missing all others
        },
      };

      expect(() => shopifyPreset.validateConfig(incompleteConfig)).toThrow(VendorPresetError);
    });

    it('error message lists the missing fields', () => {
      const incompleteConfig: VendorConsumerConfig = {
        ...TEST_CONFIG,
        customFields: {},
      };

      expect(() => shopifyPreset.validateConfig(incompleteConfig)).toThrow(
        /shopifyPreset.*firstName/
      );
    });
  });

  // ============================================================================
  // getRequiredFields
  // ============================================================================

  describe('getRequiredFields', () => {
    it('returns all required fields with descriptions', () => {
      const fields = shopifyPreset.getRequiredFields();

      expect(fields.length).toBe(3);

      for (const field of fields) {
        expect(field.logicalName).toBeTruthy();
        expect(field.fieldName).toBeTruthy();
        expect(field.description).toBeTruthy();
        expect(SHOPIFY_FIELDS[field.logicalName as keyof typeof SHOPIFY_FIELDS]).toBe(
          field.fieldName
        );
      }
    });
  });

  // ============================================================================
  // getAutomations
  // ============================================================================

  describe('getAutomations', () => {
    // The pre-built automation entries have been retired. Template
    // authors now build contexts directly via the factory functions
    // (createOrderConfirmationTemplate, etc.) and wire automations
    // through @rule/client. See packages/templates/README.md for
    // the authoring pattern.
    it('returns an empty list (pre-built automations retired)', () => {
      const automations = shopifyPreset.getAutomations(TEST_CONFIG);

      expect(automations).toHaveLength(0);
    });
  });

  // ============================================================================
  // getAutomation
  // ============================================================================

  describe('getAutomation', () => {
    it('returns undefined for any ID (no automations defined)', () => {
      const automation = shopifyPreset.getAutomation('nonexistent', TEST_CONFIG);

      expect(automation).toBeUndefined();
    });
  });
});

// ============================================================================
// Field and tag constants
// ============================================================================

describe('SHOPIFY_FIELDS', () => {
  it('all values are non-empty strings', () => {
    for (const value of Object.values(SHOPIFY_FIELDS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('has 31 fields', () => {
    expect(Object.keys(SHOPIFY_FIELDS)).toHaveLength(31);
  });
});

describe('SHOPIFY_TAGS', () => {
  it('all values are non-empty strings', () => {
    for (const value of Object.values(SHOPIFY_TAGS)) {
      expect(typeof value).toBe('string');
      expect(value.length).toBeGreaterThan(0);
    }
  });

  it('has 5 tags', () => {
    expect(Object.keys(SHOPIFY_TAGS)).toHaveLength(5);
  });
});
