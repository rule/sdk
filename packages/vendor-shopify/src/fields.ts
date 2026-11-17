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
  // Subscriber fields (address priority: shipping, then billing, then customer default)
  firstName: 'Subscriber.FirstName',
  lastName: 'Subscriber.LastName',
  source: 'Subscriber.Source',
  zipcode: 'Subscriber.Zipcode',
  city: 'Subscriber.City',
  address1: 'Subscriber.Address1',
  address2: 'Subscriber.Address2',
  number: 'Subscriber.Number',
  country: 'Subscriber.Country',

  // Cart fields (set by `checkouts/update`, tag CartInProgress)
  cartUrl: 'Cart.CartUrl',
  cartNames: 'Cart.Names',
  cartSkus: 'Cart.SKUs',
  cartModels: 'Cart.Models',
  cartManufacturers: 'Cart.Manufacturers',
  cartProductTypes: 'Cart.ProductTypes',
  cartProductCategories: 'Cart.ProductCategories',
  cartProductCollections: 'Cart.ProductCollections',
  cartProductTags: 'Cart.ProductTags',
  cartProducts: 'Cart.Products',

  // Order fields (set by `orders/paid`, tag OrderCompleted)
  orderNumber: 'Order.Number',
  orderName: 'Order.Name',
  orderDate: 'Order.Date',
  currency: 'Order.Currency',
  orderStatus: 'Order.OrderStatus',
  totalPrice: 'Order.TotalPrice',
  totalTaxIncl: 'Order.TotalTaxIncl',
  totalTaxExcl: 'Order.TotalTaxExcl',
  totalTax: 'Order.TotalTax',
  // Spelling `TaxAmmount` is the integration's own (intentional).
  taxAmount: 'Order.TaxAmmount',
  shippingCost: 'Order.Shipping',
  discount: 'Order.Discount',
  totalWeight: 'Order.TotalWeight',
  productCount: 'Order.ProductCount',
  paymentMethod: 'Order.PaymentMethod',
  gateway: 'Order.Gateway',
  deliveryMethod: 'Order.DeliveryMethod',
  names: 'Order.Names',
  skus: 'Order.SKUs',
  manufacturers: 'Order.Manufacturers',
  brands: 'Order.Brands',
  productTags: 'Order.ProductTags',
  productTypes: 'Order.ProductTypes',
  productCategories: 'Order.ProductCategories',
  categories: 'Order.Categories',
  productCollections: 'Order.ProductCollections',
  products: 'Order.Products',

  // Order billing address
  billingFirstname: 'Order.BillingFirstname',
  billingLastname: 'Order.BillingLastname',
  billingStreet: 'Order.BillingStreet',
  billingCity: 'Order.BillingCity',
  billingZipcode: 'Order.BillingZipcode',
  billingState: 'Order.BillingState',
  billingCountry: 'Order.BillingCountry',
  billingCompany: 'Order.BillingCompany',
  billingTele: 'Order.BillingTele',

  // Order shipping address
  orderFirstname: 'Order.Firstname',
  orderLastname: 'Order.Lastname',
  orderStreet: 'Order.Street',
  orderStreet2: 'Order.Street2',
  orderZipcode: 'Order.Zipcode',
  orderCity: 'Order.City',
  orderCountry: 'Order.Country',
  shippingAddress1: 'Order.ShippingAddress1',
  shippingAddress2: 'Order.ShippingAddress2',
  shippingCity: 'Order.ShippingCity',
  shippingZip: 'Order.ShippingZip',
  shippingCountryCode: 'Order.ShippingCountryCode',

  // Fulfillment fields (set by `orders/fulfilled`, tag OrderShipped)
  shippedOrderNumber: 'OrderShipped.Number',
  shippedAt: 'OrderShipped.ShippingProcessedAt',
  shippedFinancialStatus: 'OrderShipped.FinancialStatus',
  shippedShippingLines: 'OrderShipped.ShippingLines',
  trackingCompany: 'OrderShipped.TrackingCompany',
  trackingNumber: 'OrderShipped.TrackingNumber',

  // Line item sub-fields (JSON keys within the Order.Products / Cart.Products
  // loop). Verified against a live Cart.Products payload: the product name
  // key is `title` (there is no `name`).
  itemName: 'title',
  itemQuantity: 'quantity',
  itemPrice: 'price',
  itemSku: 'sku',
} as const satisfies VendorFieldSchema;

/** Object type of the Shopify field schema. */
export type ShopifyFieldSchema = typeof SHOPIFY_FIELDS;

/** Union of logical Shopify field name keys. */
export type ShopifyFieldNames = keyof ShopifyFieldSchema;
