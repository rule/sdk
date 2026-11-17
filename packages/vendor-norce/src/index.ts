/**
 * Norce Vendor Preset
 *
 * Field and tag schemas for the Norce Commerce→Rule.io integration, plus
 * its email templates. Each template lives in `src/templates/<name>/`
 * (layout XML, default copy JSON, factory, tests), as in vendor-shopify.
 */

export { norcePreset } from './preset.js';
export { NORCE_FIELDS } from './fields.js';
export { NORCE_TAGS } from './tags.js';
export type { NorceFieldSchema, NorceFieldNames } from './fields.js';
export type { NorceTagSchema, NorceTagNames } from './tags.js';

// Order-confirmation template (trigger: NORCE_TAGS.orderProcessing).
export { createNorceOrderConfirmationTemplate } from './templates/order-confirmation/order-confirmation.js';
export type {
  NorceOrderConfirmationRenderOptions,
  NorceOrderConfirmationTemplate,
  NorceOrderConfirmationTemplateContext,
  NorceOrderConfirmationTemplateCopy,
} from './templates/order-confirmation/order-confirmation.js';

// Shipping-update template (trigger: NORCE_TAGS.orderShipped).
export { createNorceShippingUpdateTemplate } from './templates/shipping-update/shipping-update.js';
export type {
  NorceShippingUpdateRenderOptions,
  NorceShippingUpdateTemplate,
  NorceShippingUpdateTemplateContext,
  NorceShippingUpdateTemplateCopy,
} from './templates/shipping-update/shipping-update.js';
