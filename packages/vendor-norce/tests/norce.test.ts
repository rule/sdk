/**
 * Norce Vendor Preset Tests
 */

import { describe, it, expect } from 'vitest';
import { createEmailTheme } from '@rule/rcml';
import { VendorPresetError } from '@rule/vendor';
import type { VendorConsumerConfig } from '@rule/vendor';
import { norcePreset, NORCE_FIELDS, NORCE_TAGS } from '../src/index.js';

const TEST_CONFIG: VendorConsumerConfig = {
  theme: createEmailTheme({ brandStyleId: 99999 }),
  customFields: {
    [NORCE_FIELDS.firstName]: 300001,
    [NORCE_FIELDS.orderNumber]: 300002,
    [NORCE_FIELDS.totalIncVat]: 300003,
  },
  websiteUrl: 'https://myshop.example.com',
};

describe('norcePreset', () => {
  it('has correct vendor metadata', () => {
    expect(norcePreset.vendor).toBe('norce');
    expect(norcePreset.displayName).toBe('Norce');
    expect(norcePreset.vertical).toBe('ecommerce');
  });

  it('exposes field and tag schemas', () => {
    expect(norcePreset.fields).toBe(NORCE_FIELDS);
    expect(norcePreset.tags).toBe(NORCE_TAGS);
  });

  describe('NORCE_TAGS', () => {
    it('matches the tags the Norce integration sets', () => {
      expect(Object.values(NORCE_TAGS)).toEqual([
        'OrderPlaced',
        'OrderProcessing',
        'OrderShipped',
        'OrderCompleted',
        'OrderCanceled',
      ]);
    });
  });

  describe('NORCE_FIELDS', () => {
    it('uses the integration group and field names', () => {
      expect(NORCE_FIELDS.orderNumber).toBe('Order.OrderNumber');
      expect(NORCE_FIELDS.totalIncVat).toBe('Order.OrderTotalIncVat');
      expect(NORCE_FIELDS.products).toBe('Order.Products');
      expect(NORCE_FIELDS.zipCode).toBe('Subscriber.ZipCode');
    });

    it('uses the Norce Items keys for line-item loops', () => {
      expect(NORCE_FIELDS.itemName).toBe('Name');
      expect(NORCE_FIELDS.itemSku).toBe('PartNo');
    });

    it('puts every group field in the Order or Subscriber group', () => {
      const groupFields = Object.values(NORCE_FIELDS).filter((name) => name.includes('.'));

      for (const name of groupFields) {
        expect(name).toMatch(/^(Order|Subscriber)\.[A-Za-z]+$/);
      }

      expect(groupFields).toHaveLength(27);
    });
  });

  describe('validateConfig', () => {
    it('passes with all required fields', () => {
      expect(() => norcePreset.validateConfig(TEST_CONFIG)).not.toThrow();
    });

    it('throws VendorPresetError naming each missing field', () => {
      const config = { ...TEST_CONFIG, customFields: { [NORCE_FIELDS.firstName]: 1 } };

      expect(() => norcePreset.validateConfig(config)).toThrow(VendorPresetError);
      expect(() => norcePreset.validateConfig(config)).toThrow(
        'norcePreset: missing customFields entries for: orderNumber ("Order.OrderNumber"), totalIncVat ("Order.OrderTotalIncVat")'
      );
    });
  });

  describe('getRequiredFields', () => {
    it('returns the required fields with descriptions', () => {
      expect(norcePreset.getRequiredFields()).toEqual([
        { logicalName: 'firstName', fieldName: 'Subscriber.FirstName', description: 'Customer first name' },
        { logicalName: 'orderNumber', fieldName: 'Order.OrderNumber', description: 'Norce order number (OrderNo)' },
        { logicalName: 'totalIncVat', fieldName: 'Order.OrderTotalIncVat', description: 'Order total incl. VAT' },
      ]);
    });
  });

  describe('automations', () => {
    it('ships no pre-built automations', () => {
      expect(norcePreset.getAutomations(TEST_CONFIG)).toEqual([]);
      expect(norcePreset.getAutomation('anything', TEST_CONFIG)).toBeUndefined();
    });

    it('validates config before returning automations', () => {
      const config = { ...TEST_CONFIG, customFields: {} };

      expect(() => norcePreset.getAutomations(config)).toThrow(VendorPresetError);
      expect(() => norcePreset.getAutomation('anything', config)).toThrow(VendorPresetError);
    });
  });
});
