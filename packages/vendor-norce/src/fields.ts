/**
 * Norce Custom Field Definitions
 *
 * Field names match the Norce→Rule.io integration exactly. The source of
 * truth is the integration code (`NorceOrderTransformer` /
 * `NorceSubscriberTransformer` in the Rule app), which writes to the plain
 * `Order` and `Subscriber` groups. Empty values are not sent; for `Order`
 * neither are falsy ones, so a `0` total leaves the field out.
 * @see https://help.rule.io/en/articles/349489-norce-integration
 *
 * Consumers provide the numeric IDs from their Rule.io account.
 */

import type { VendorFieldSchema } from '@rule/vendor';

/**
 * Norce field names for Rule.io custom fields.
 *
 * @example
 * ```typescript
 * import { NORCE_FIELDS } from '@rule/vendor-norce';
 *
 * const customFields = {
 *   [NORCE_FIELDS.firstName]: 169233,
 *   [NORCE_FIELDS.orderNumber]: 169234,
 *   // ... map all fields to your Rule.io numeric IDs
 * };
 * ```
 */
export const NORCE_FIELDS = {
  // Subscriber fields (from the order's SellTo customer, address and company)
  customerId: 'Subscriber.Id',
  customerNumber: 'Subscriber.Number',
  firstName: 'Subscriber.FirstName',
  lastName: 'Subscriber.LastName',
  ssn: 'Subscriber.SSN',
  address: 'Subscriber.Address',
  city: 'Subscriber.City',
  zipCode: 'Subscriber.ZipCode',
  country: 'Subscriber.Country',
  countryCode: 'Subscriber.CountryCode',
  companyName: 'Subscriber.CompanyName',

  // Order fields (historical: each order event appends a new record; the
  // Subscriber group is overwritten instead)
  orderId: 'Order.Id',
  orderNumber: 'Order.OrderNumber',
  orderDate: 'Order.OrderDate',
  orderStatus: 'Order.Status',
  source: 'Order.Source',
  currency: 'Order.Currency',
  products: 'Order.Products',
  productNames: 'Order.ProductNames',
  skus: 'Order.Skus',
  totalIncVat: 'Order.OrderTotalIncVat',
  totalExVat: 'Order.OrderTotalExVat',
  paymentMethod: 'Order.PaymentMethod',
  deliveryMethod: 'Order.DeliveryMethod',
  deliveryMark: 'Order.DeliveryMark',
  deliveryNotes: 'Order.DeliveryNotes',
  info: 'Order.Info',

  // Line item sub-fields (JSON keys within the Order.Products loop).
  // Order.Products is the Norce order `Items` array, stored unchanged.
  // `Name` and `PartNo` are read by the integration itself; `QtyOrdered`,
  // `UnitPrice` and `RowAmount` come from the integration's test fixture
  // and are not yet confirmed against a live sync.
  itemName: 'Name',
  itemSku: 'PartNo',
  itemQuantity: 'QtyOrdered',
  itemPrice: 'UnitPrice',
  itemTotal: 'RowAmount',
} as const satisfies VendorFieldSchema;

/** Object type of the Norce field schema. */
export type NorceFieldSchema = typeof NORCE_FIELDS;

/** Union of logical Norce field name keys. */
export type NorceFieldNames = keyof NorceFieldSchema;
