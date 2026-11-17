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
  source: 'Subscriber source (static "ShopifyRule")',
  zipcode: 'Subscriber zip/postal code',
  city: 'Subscriber city',
  address1: 'Subscriber address line 1',
  address2: 'Subscriber address line 2',
  number: 'Subscriber phone number',
  country: 'Subscriber country',

  // Cart (checkouts/update)
  cartUrl: 'Abandoned checkout URL (per recipient)',
  cartNames: 'Cart line item titles (JSON array)',
  cartSkus: 'Cart line item SKUs (JSON array)',
  cartModels: 'Cart line item variant titles (JSON array)',
  cartManufacturers: 'Cart line item vendors (JSON array)',
  cartProductTypes: 'Cart product types (deduplicated JSON array)',
  cartProductCategories: 'Cart product category names (deduplicated JSON array)',
  cartProductCollections: 'Cart product collection names (deduplicated JSON array)',
  cartProductTags: 'Cart Shopify product tags (deduplicated JSON array)',
  cartProducts: 'Cart line items (JSON, repeatable field)',

  // Order (orders/paid)
  orderNumber: 'Shopify order number (falls back to order ID)',
  orderName: 'Shopify order name (e.g., #1001)',
  orderDate: 'Order date (processed, created or updated)',
  currency: 'Order currency code (e.g., SEK, EUR)',
  orderStatus: 'Order status ("cancelled", or fulfillment + financial status)',
  totalPrice: 'Order total price incl. tax (same as Order.TotalTaxIncl)',
  totalTaxIncl: 'Order total incl. tax',
  totalTaxExcl: 'Order total excl. tax',
  totalTax: 'Order tax amount (same as Order.TaxAmmount)',
  taxAmount: 'Order tax amount',
  shippingCost: 'Shipping cost',
  discount: 'Discount amount applied',
  totalWeight: 'Order total weight',
  productCount: 'Number of products in order (sum of quantities)',
  paymentMethod: 'Payment gateway name(s)',
  gateway: 'Payment gateway (same as Order.PaymentMethod)',
  deliveryMethod: 'Delivery method (shipping line titles)',
  names: 'Product names (JSON array)',
  skus: 'Product SKUs (JSON array)',
  manufacturers: 'Product vendors (JSON array)',
  brands: 'Product vendors (JSON array, same as Order.Manufacturers)',
  productTags: 'Product tags (deduplicated JSON array)',
  productTypes: 'Product types (deduplicated JSON array)',
  productCategories: 'Product category names (deduplicated JSON array)',
  categories: 'Product category names (same as Order.ProductCategories)',
  productCollections: 'Product collection names (deduplicated JSON array)',
  products: 'Order line items (JSON, repeatable field)',

  // Billing address
  billingFirstname: 'Billing first name',
  billingLastname: 'Billing last name',
  billingStreet: 'Billing address line 1',
  billingCity: 'Billing city',
  billingZipcode: 'Billing zip/postal code',
  billingState: 'Billing province/state',
  billingCountry: 'Billing country',
  billingCompany: 'Billing company',
  billingTele: 'Billing phone',

  // Shipping address
  orderFirstname: 'Shipping first name',
  orderLastname: 'Shipping last name',
  orderStreet: 'Shipping address line 1',
  orderStreet2: 'Shipping address line 2',
  orderZipcode: 'Shipping zip/postal code',
  orderCity: 'Shipping city',
  orderCountry: 'Shipping country',
  shippingAddress1: 'Shipping address line 1',
  shippingAddress2: 'Shipping address line 2',
  shippingCity: 'Shipping city',
  shippingZip: 'Shipping zip/postal code',
  shippingCountryCode: 'Shipping country code',

  // Fulfillment (orders/fulfilled)
  shippedOrderNumber: 'Fulfilled order number',
  shippedAt: 'Fulfillment processed date',
  shippedFinancialStatus: 'Financial status at fulfillment',
  shippedShippingLines: 'Shipping line titles (JSON array)',
  trackingCompany: 'Tracking companies (JSON array)',
  trackingNumber: 'Tracking numbers (JSON array)',

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
