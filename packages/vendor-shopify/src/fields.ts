/**
 * Shopify Custom Field Definitions
 *
 * Field names match the actual Shopify→Rule.io integration exactly.
 * @see https://help.rule.io/en/articles/349484-shopify-integration
 *
 * Consumers provide the numeric IDs from their Rule.io account.
 */

import type { VendorFieldSchema } from '@rule/vendor';

/**
 * Shopify field names for Rule.io custom fields.
 *
 * @example
 * ```typescript
 * import { SHOPIFY_FIELDS } from '@rule/sdk';
 *
 * const customFields = {
 *   [SHOPIFY_FIELDS.firstName]: 169233,
 *   [SHOPIFY_FIELDS.orderNumber]: 169234,
 *   // ... map all fields to your Rule.io numeric IDs
 * };
 * ```
 */
export const SHOPIFY_FIELDS = {
  // Subscriber fields
  firstName: 'Subscriber.FirstName',
  lastName: 'Subscriber.LastName',
  source: 'Subscriber.Source',
  zipcode: 'Subscriber.Zipcode',
  city: 'Subscriber.City',
  address1: 'Subscriber.Address1',
  address2: 'Subscriber.Address2',
  number: 'Subscriber.Number',
  country: 'Subscriber.Country',

  // Order fields
  orderNumber: 'Order.Number',
  orderDate: 'Order.Date',
  currency: 'Order.Currency',
  totalPrice: 'Order.TotalPrice',
  totalWeight: 'Order.TotalWeight',
  totalTax: 'Order.TotalTax',
  productCount: 'Order.ProductCount',
  discount: 'Order.Discount',
  names: 'Order.Names',
  gateway: 'Order.Gateway',
  skus: 'Order.Skus',
  products: 'Order.Products',
  cartUrl: 'Order.CartUrl',

  // Shipping
  shippingAddress1: 'Order.ShippingAddress1',
  shippingAddress2: 'Order.ShippingAddress2',
  shippingCity: 'Order.ShippingCity',
  shippingZip: 'Order.ShippingZip',
  shippingCountryCode: 'Order.ShippingCountryCode',

  // Line item sub-fields (JSON keys within Order.Products loop)
  itemName: 'name',
  itemQuantity: 'quantity',
  itemPrice: 'price',
  itemSku: 'sku',
} as const satisfies VendorFieldSchema;

/** Object type of the Shopify field schema. */
export type ShopifyFieldSchema = typeof SHOPIFY_FIELDS;

/** Union of logical Shopify field name keys. */
export type ShopifyFieldNames = keyof ShopifyFieldSchema;
