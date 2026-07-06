/**
 * Vendor Preset System — shared contract between a vendor integration and
 * the Rule.io platform.
 *
 * Provides a two-layer abstraction:
 * - **Vendor Preset** (shipped by a `@rule/vendor-*` package): field
 *   names, tags, automation flows, default text.
 * - **Consumer Config** (provided at runtime): brand style, field IDs,
 *   URLs.
 *
 * @module vendors
 */

import type { EmailTheme, RCMLDocumentRoot } from '@rule/rcml'

// ─── Errors ───────────────────────────────────────────────────────────────────

/**
 * Error thrown by a vendor preset when its `VendorConsumerConfig` is missing
 * required custom field mappings — i.e. the integration is not fully set up.
 */
export class VendorPresetError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'VendorPresetError';
  }
}

// ─── Shared data shapes ───────────────────────────────────────────────────────

/**
 * Maps Rule.io custom field paths (strings like `'Order.CustomerName'`) to
 * their account-specific numeric field IDs.
 *
 * @example
 * ```typescript
 * const customFields: CustomFieldMap = {
 *   'Order.CustomerName': 169233,
 *   'Order.OrderRef': 169234,
 * };
 * ```
 */
export interface CustomFieldMap {
  [fieldName: string]: number
}

/**
 * Footer-section localisation overrides.
 */
export interface FooterConfig {
  /** "View in browser" link text (default: 'View in browser') */
  viewInBrowserText?: string
  /** Unsubscribe link text (default: 'Unsubscribe') */
  unsubscribeText?: string
  /** Footer background color (default: '#f3f3f3') */
  backgroundColor?: string
  /** Footer text color (default: '#666666') */
  textColor?: string
  /** Footer text size (default: '10px') */
  fontSize?: string
}

// ─── Automation contract ──────────────────────────────────────────────────────

/**
 * Configuration for building templates.
 *
 * The `theme` field is an {@link EmailTheme} applied to rcml documents via
 * `applyTheme`. Consumers convert their brand-style source (Rule.io API
 * response, hand-rolled config) to an `EmailTheme` before passing it in.
 * `@rule/client` ships `emailThemeFromBrandStyle` for the API-response case.
 */
export interface TemplateConfigV2 {
  /** Typed email theme applied to the built RCML document. */
  theme: EmailTheme
  /** Custom field ID mapping */
  customFields: CustomFieldMap
  /** Website base URL */
  websiteUrl: string
}

/**
 * Full automation configuration.
 *
 * `templateBuilder` returns {@link RCMLDocumentRoot} at the type level so the
 * contract doesn't depend on `@rule/rcml`; concrete implementations return
 * a full `RcmlDocument` (a subtype), which TypeScript accepts by
 * function-return covariance.
 *
 * @example
 * ```typescript
 * import { RuleTags, createAbandonedCartEmail } from '@rule/sdk';
 * import type { AutomationConfigV2 } from '@rule/sdk';
 *
 * const automation: AutomationConfigV2 = {
 *   id: 'abandoned-cart',
 *   triggerTag: RuleTags.CART_IN_PROGRESS,
 *   subject: 'You left something behind!',
 *   templateBuilder: (config) => createAbandonedCartEmail({ ...config }),
 * };
 * ```
 */
export interface AutomationConfigV2 {
  /** Unique identifier for this automation */
  id: string
  /** Display name in Rule.io */
  name: string
  /** Description of what this automation does */
  description: string
  /** Tag that triggers this automation */
  triggerTag: string
  /** Delay before sending (seconds as string) */
  delayInSeconds?: string
  /** Optional conditions for execution */
  conditions?: {
    hasTag?: string[]
    notHasTag?: string[]
  }
  /** Email subject */
  subject: string
  /** Preview text shown in inbox */
  preheader?: string
  /** Function to build the RCML template */
  templateBuilder: (config: TemplateConfigV2) => RCMLDocumentRoot
}

// ─── Schema types ────────────────────────────────────────────────────────────

/**
 * Maps logical field names to Rule.io custom field path strings.
 *
 * Field names are determined by the vendor platform — every Shopify store
 * uses the same field structure because the webhook payload is the same.
 * The numeric IDs are per-account.
 *
 * @example
 * ```typescript
 * const fields = {
 *   customerFirstName: 'Order.CustomerName',
 *   orderRef: 'Order.OrderRef',
 * } as const satisfies VendorFieldSchema;
 * ```
 */
export interface VendorFieldSchema {
  readonly [logicalName: string]: string
}

/**
 * Maps logical tag names to Rule.io tag strings.
 *
 * @example
 * ```typescript
 * const tags = {
 *   orderCompleted: 'OrderCompleted',
 *   cartInProgress: 'CartInProgress',
 * } as const satisfies VendorTagSchema;
 * ```
 */
export interface VendorTagSchema {
  readonly [logicalName: string]: string
}

// ─── Consumer config ─────────────────────────────────────────────────────────

/**
 * Configuration that every consumer must provide, regardless of vendor.
 * These values are unique to each Rule.io account.
 *
 * @example
 * ```typescript
 * const config: VendorConsumerConfig = {
 *   theme: myEmailTheme,
 *   customFields: {
 *     'Order.CustomerName': 169233,
 *     'Order.OrderRef': 169234,
 *   },
 *   websiteUrl: 'https://myshop.com',
 * };
 * ```
 */
export interface VendorConsumerConfig extends TemplateConfigV2 {
  /** Optional footer configuration for localization */
  footer?: FooterConfig
}

// ─── Vendor automation ───────────────────────────────────────────────────────

/**
 * A vendor automation definition pairs an automation config skeleton with
 * the template builder that produces the RCML document.
 *
 * `templateBuilder` returns {@link RCMLDocumentRoot} at the type level;
 * concrete implementations return a full `RcmlDocument` (a subtype),
 * accepted via function-return covariance.
 */
export interface VendorAutomation {
  /** Unique automation identifier within this vendor */
  id: string
  /** Display name */
  name: string
  /** Description of what this automation does */
  description: string
  /** Tag name that triggers this automation */
  triggerTag: string
  /** Delay before sending (seconds as string) */
  delayInSeconds?: string
  /** Tag-based conditions */
  conditions?: {
    hasTag?: string[]
    notHasTag?: string[]
  }
  /** Email subject line */
  subject: string
  /** Preview text shown in inbox */
  preheader?: string
  /**
   * Builds the RCML template using the consumer's account-specific config.
   */
  templateBuilder: (config: VendorConsumerConfig) => RCMLDocumentRoot
}

// ─── Shared utilities ────────────────────────────────────────────────────────

// ─── Automation lookup helpers ───────────────────────────────────────────────

/**
 * Get an automation by ID from a list of resolved automations.
 *
 * @example
 * ```typescript
 * const automations = shopifyPreset.getAutomations(config);
 * const cart = getAutomationById('abandoned-cart', automations);
 * ```
 */
export function getAutomationById(
  id: string,
  automations: AutomationConfigV2[],
): AutomationConfigV2 | undefined {
  return automations.find((a) => a.id === id)
}

/**
 * Get an automation by trigger tag from a list of resolved automations.
 *
 * @example
 * ```typescript
 * const automations = shopifyPreset.getAutomations(config);
 * const cart = getAutomationByTrigger('CartInProgress', automations);
 * ```
 */
export function getAutomationByTrigger(
  tag: string,
  automations: AutomationConfigV2[],
): AutomationConfigV2 | undefined {
  return automations.find((a) => a.triggerTag === tag)
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Resolve vendor automations into standard `AutomationConfigV2` objects.
 *
 * Maps each `VendorAutomation` to an `AutomationConfigV2` whose
 * `templateBuilder` merges the caller's `TemplateConfigV2` overrides with
 * the captured consumer config.
 *
 * @internal Used by vendor preset implementations.
 */
export function resolveVendorAutomations(
  automations: VendorAutomation[],
  config: VendorConsumerConfig,
): AutomationConfigV2[] {
  return automations.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    triggerTag: a.triggerTag,
    delayInSeconds: a.delayInSeconds,
    conditions: a.conditions,
    subject: a.subject,
    preheader: a.preheader,
    templateBuilder: (overrides: TemplateConfigV2) =>
      a.templateBuilder({
        ...config,
        ...overrides,
        customFields: { ...config.customFields, ...overrides.customFields },
      }),
  }))
}

// ─── Vendor preset ───────────────────────────────────────────────────────────

/** Description of a required field for setup documentation. */
export interface VendorFieldInfo {
  /** Logical name used in the preset (e.g., 'customerFirstName') */
  logicalName: string
  /** Rule.io field path (e.g., 'Order.CustomerName') */
  fieldName: string
  /** Human-readable description of what this field contains */
  description: string
}

/**
 * A complete vendor preset. This is the top-level object that the SDK
 * ships for each supported vendor integration.
 *
 * @typeParam TFields - The vendor's field name schema type
 * @typeParam TTags - The vendor's tag schema type
 *
 * @example
 * ```typescript
 * import { shopifyPreset, SHOPIFY_FIELDS } from '@rule/sdk';
 *
 * shopifyPreset.validateConfig(config);
 * const automations = shopifyPreset.getAutomations(config);
 * ```
 */
export interface VendorPreset<
  TFields extends VendorFieldSchema = VendorFieldSchema,
  TTags extends VendorTagSchema = VendorTagSchema,
> {
  /** Vendor identifier (e.g., 'shopify', 'bookzen') */
  readonly vendor: string
  /** Human-readable vendor name */
  readonly displayName: string
  /** Business vertical */
  readonly vertical: 'ecommerce' | 'hospitality' | (string & {})

  /**
   * The field names this vendor uses in Rule.io.
   * Consumers must create these fields in their Rule.io account
   * and provide the numeric IDs via `customFields` in {@link VendorConsumerConfig}.
   */
  readonly fields: TFields

  /**
   * The tag names this vendor uses.
   * Consumers should create these tags in their Rule.io account.
   */
  readonly tags: TTags

  /**
   * Get all automations resolved with the consumer's config.
   * Returns standard {@link AutomationConfigV2} objects ready for deployment.
   *
   * @throws {RuleConfigError} if required custom fields are missing
   */
  getAutomations(config: VendorConsumerConfig): AutomationConfigV2[]

  /**
   * Get a single automation by ID, resolved with consumer config.
   */
  getAutomation(id: string, config: VendorConsumerConfig): AutomationConfigV2 | undefined

  /**
   * Validate that a consumer's config has entries for all required fields.
   *
   * @throws {RuleConfigError} if any required fields are missing from customFields
   */
  validateConfig(config: VendorConsumerConfig): void

  /**
   * Get the list of fields the consumer needs to map.
   * Useful for setup wizards, documentation, or onboarding flows.
   */
  getRequiredFields(): readonly VendorFieldInfo[]
}
