/**
 * Rule.io HTTP API client.
 *
 * Wraps the v2 and v3 endpoints of the Rule.io email-marketing API. Use this
 * package to create subscribers, manage automations, send campaign emails,
 * and read analytics. Composes with `@rule/rcml` to build templates and
 * with the `@rule/vendor-*` preset packages for platform-specific flows.
 */

export { RuleClient } from './client.js';
export { RuleApiError, RuleClientError } from './errors.js';
export type { RuleValidationErrors } from './errors.js';
export { RULE_API_V2_BASE_URL, RULE_API_V3_BASE_URL, RuleTags } from './constants.js';
export type { RuleTag } from './constants.js';
export { AnalyticsMetrics, AnalyticsObjectTypes, AnalyticsMessageTypes } from './resources/analytics/analytics.types.js';
export type * from './types.js';
export * from './brand-style-to-theme.js';
export { findTemplateOwner } from './find-template-owner.js';
export {
  resolvePreferredBrandStyle,
  type ResolvePreferredBrandStyleResult,
  type ResolvePreferredBrandStyleSource,
} from './resolve-preferred-brand-style.js';
export { formatDateForRule } from './utils/index.js';
export type {
  TemplateOwner,
  CampaignTemplateOwner,
  AutomationTemplateOwner,
  PartialScanError,
  FindTemplateOwnerOptions,
  FindTemplateOwnerResult,
} from './find-template-owner.js';
export { parseWebhookEvent, markTagDirection } from './webhooks/index.js';
