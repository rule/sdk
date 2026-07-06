/**
 * Shopify Vendor Preset
 *
 * Reference e-commerce preset for Shopify integrations with Rule.io.
 *
 * @example
 * ```typescript
 * import { shopifyPreset, SHOPIFY_FIELDS } from '@rule/sdk';
 *
 * const config = {
 *   brandStyle: myBrandStyle,
 *   customFields: {
 *     [SHOPIFY_FIELDS.firstName]: 169233,
 *     [SHOPIFY_FIELDS.orderNumber]: 169234,
 *     // ...
 *   },
 *   websiteUrl: 'https://myshop.com',
 * };
 *
 * shopifyPreset.validateConfig(config);
 * const automations = shopifyPreset.getAutomations(config);
 * ```
 */

import type { AutomationConfigV2, VendorPreset, VendorConsumerConfig, VendorFieldInfo } from '@rule/vendor';
import { resolveVendorAutomations } from '@rule/vendor';
import type { ShopifyFieldSchema, ShopifyFieldNames } from './fields.js';
import type { ShopifyTagSchema } from './tags.js';
import { SHOPIFY_FIELDS } from './fields.js';
import { SHOPIFY_TAGS } from './tags.js';
import { createShopifyAutomations } from './automations.js';
import { VendorPresetError } from '@rule/vendor';

const FIELD_DESCRIPTIONS: Record<ShopifyFieldNames, string> = {
  // Subscriber
  firstName: 'Customer first name',
  lastName: 'Customer last name',
  source: 'Subscriber source',
  zipcode: 'Subscriber zip/postal code',
  city: 'Subscriber city',
  address1: 'Subscriber address line 1',
  address2: 'Subscriber address line 2',
  number: 'Subscriber phone number',
  country: 'Subscriber country',

  // Order
  orderNumber: 'Shopify order number',
  orderDate: 'Order date',
  currency: 'Order currency code (e.g., SEK, EUR)',
  totalPrice: 'Order total price',
  totalWeight: 'Order total weight',
  totalTax: 'Order total tax',
  productCount: 'Number of products in order',
  discount: 'Discount amount applied',
  names: 'Product names (comma-separated)',
  gateway: 'Payment gateway used',
  skus: 'Product SKUs (comma-separated)',
  products: 'Order line items (JSON, repeatable field)',
  cartUrl: 'Abandoned cart URL (CartInProgress only)',

  // Shipping
  shippingAddress1: 'Shipping address line 1',
  shippingAddress2: 'Shipping address line 2',
  shippingCity: 'Shipping city',
  shippingZip: 'Shipping zip/postal code',
  shippingCountryCode: 'Shipping country code',

  // Line item sub-fields
  itemName: 'Line item product name (JSON key)',
  itemQuantity: 'Line item quantity (JSON key)',
  itemPrice: 'Line item price (JSON key)',
  itemSku: 'Line item SKU (JSON key)',
};

/** Fields required by the automations (must be mapped in customFields). */
const REQUIRED_FIELDS: readonly ShopifyFieldNames[] = [
  'firstName',
  'orderNumber',
  'totalPrice',
];

function validateShopifyConfig(config: VendorConsumerConfig): void {
  const missingFields: string[] = [];

  for (const logicalName of REQUIRED_FIELDS) {
    const fieldName = SHOPIFY_FIELDS[logicalName];

    if (config.customFields[fieldName] === undefined) {
      missingFields.push(`${logicalName} ("${fieldName}")`);
    }
  }

  if (missingFields.length > 0) {
    throw new VendorPresetError(
      `shopifyPreset: missing customFields entries for: ${missingFields.join(', ')}`
    );
  }
}

function resolveAutomations(config: VendorConsumerConfig): AutomationConfigV2[] {
  return resolveVendorAutomations(createShopifyAutomations(), config);
}

/**
 * Shopify vendor preset for Rule.io.
 *
 * Provides pre-configured automations for the standard Shopify e-commerce
 * flows: order confirmation, shipping update, order cancellation, and
 * abandoned cart.
 */
export const shopifyPreset: VendorPreset<ShopifyFieldSchema, ShopifyTagSchema> = {
  vendor: 'shopify',
  displayName: 'Shopify',
  vertical: 'ecommerce',
  fields: SHOPIFY_FIELDS,
  tags: SHOPIFY_TAGS,

  getAutomations(config: VendorConsumerConfig): AutomationConfigV2[] {
    validateShopifyConfig(config);

    return resolveAutomations(config);
  },

  getAutomation(id: string, config: VendorConsumerConfig): AutomationConfigV2 | undefined {
    validateShopifyConfig(config);

    return resolveAutomations(config).find((a) => a.id === id);
  },

  validateConfig: validateShopifyConfig,

  getRequiredFields(): readonly VendorFieldInfo[] {
    return REQUIRED_FIELDS.map((logicalName) => ({
      logicalName,
      fieldName: SHOPIFY_FIELDS[logicalName],
      description: FIELD_DESCRIPTIONS[logicalName],
    }));
  },
};
