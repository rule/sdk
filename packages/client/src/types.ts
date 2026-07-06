/**
 * Public type barrel for `@rule/client`.
 *
 * Every type previously declared in this file lives next to its namespace
 * client (under `resources/<namespace>/<namespace>.types.ts`); this barrel
 * re-exports them all under their original names so `import type { ... }
 * from '@rule/client'` keeps working unchanged for downstream consumers.
 *
 * The `RuleTag` v2 entity historically defined here is now exported as
 * `RuleTagEntity` to avoid colliding with the `RuleTag` string-literal union
 * exported from `constants.ts`.
 */

// ── Cross-cutting base types ─────────────────────────────────────────────────
export type {
  RuleApiResponse,
  RuleListResponse,
  RulePaginationParams,
  PagePaginationParams,
} from './shared.types.js';

// ── Custom field schema ───────────────────────────────────────────────────────
export type {
  CreateCustomFieldEntry,
  CustomFieldDefinition,
  CustomFieldGroup,
  CustomFieldValueType,
  ListCustomFieldGroupsParams,
} from './resources/custom-field/custom-field.types.js';

// ── Client configuration ─────────────────────────────────────────────────────
export type { RuleClientConfig } from './config.js';
export type { RateLimitOptions, RetryInfo } from './core/rate-limit.js';

// ── Subscribers ──────────────────────────────────────────────────────────────
export type {
  Subscriber,
  SubscriberTag,
  SubscriberIdentifier,
  SubscriberSyncPayload,
  CustomFieldGroupData,
  CustomFieldGroupDataRecord,
  SubscriberSegment,
  CreateSubscriberPayload,
  BulkTagsPayload,
  BulkCreateSubscriberEntry,
  BulkCreateSubscriberField,
  BulkCreateAutomationMode,
  BulkCreateSubscribersPayload,
  BulkCreateSubscribersResult,
  SuppressOptions,
  TagRef,
  TagAutomationMode,
  AddSubscriberTagsOptions,
  ListSubscribersByTagIdsParams,
  ListAllSubscribersByTagIdsParams,
  ListSubscribersByTagIdsResult,
} from './resources/subscribers/subscribers.types.js';

// ── Tags ─────────────────────────────────────────────────────────────────────
export type {
  ListTagsParams,
  Tag,
  TagDetail,
  UpdateTagPayload,
} from './resources/tags/tags.types.js';

// ── Automations ──────────────────────────────────────────────────────────────
export type {
  Automation,
  AutomationSendoutType,
  AutomationTrigger,
  CreateEmailAutomationPayload,
  CreateSmsAutomationPayload,
  ListAutomationsParams,
  SetEmailAutomationPayload,
  SetSmsAutomationPayload,
  UpdateEmailAutomationPayload,
  UpdateSmsAutomationPayload,
} from './resources/automations/automations.types.js';

// ── Messages ─────────────────────────────────────────────────────────────────
export type {
  AutomailSetting,
  CreateEmailAutomationMessagePayload,
  CreateEmailCampaignMessagePayload,
  CreateSmsAutomationMessagePayload,
  CreateSmsCampaignMessagePayload,
  EmailAutomationMessage,
  EmailCampaignMessage,
  Message,
  MessageDispatcher,
  SmsAutomationMessage,
  SmsCampaignMessage,
  UpdateEmailAutomationMessagePayload,
  UpdateEmailCampaignMessagePayload,
  UpdateSmsAutomationMessagePayload,
  UpdateSmsCampaignMessagePayload,
} from './resources/messages/messages.types.js';

// ── Templates ────────────────────────────────────────────────────────────────
export type {
  CreateEmailTemplatePayload,
  CreateSmsTemplatePayload,
  EmailTemplate,
  ListTemplatesParams,
  RenderTemplateParams,
  SmsTemplate,
  Template,
  UpdateEmailTemplatePayload,
  UpdateSmsTemplatePayload,
} from './resources/templates/templates.types.js';

// ── Dynamic sets ─────────────────────────────────────────────────────────────
export type {
  CreateDynamicSetPayload,
  DynamicSet,
  DynamicSetSender,
  DynamicSetTrigger,
  UpdateDynamicSetPayload,
} from './resources/dynamic-sets/dynamic-sets.types.js';

// ── Campaigns ────────────────────────────────────────────────────────────────
export type {
  Campaign,
  CampaignMessageType,
  CampaignRecipientSegment,
  CampaignRecipientSubscriber,
  CampaignRecipientTag,
  CampaignRecipients,
  CampaignSendoutType,
  CampaignStatus,
  CreateDefaultCampaignResult,
  CreateDefaultEmailCampaignParams,
  CreateDefaultSmsCampaignParams,
  CreateEmailCampaignPayload,
  CreateSmsCampaignPayload,
  ListCampaignsParams,
  ScheduleCampaignPayload,
  SetEmailCampaignPayload,
  SetSmsCampaignPayload,
  UpdateEmailCampaignPayload,
  UpdateSmsCampaignPayload,
} from './resources/campaigns/campaigns.types.js';


// ── Brand styles ─────────────────────────────────────────────────────────────
export type {
  BrandStyle,
  BrandStyleColour,
  BrandStyleColourEntry,
  BrandStyleColourType,
  BrandStyleFont,
  BrandStyleFontEntry,
  BrandStyleFontOrigin,
  BrandStyleFontType,
  BrandStyleImage,
  BrandStyleImageEntry,
  BrandStyleImageType,
  BrandStyleLink,
  BrandStyleLinkEntry,
  BrandStyleLinkType,
  BrandStyleListItem,
  CreateBrandStyleFromDomainPayload,
  CreateBrandStylePayload,
  UpdateBrandStylePayload,
} from './resources/brand-styles/brand-styles.types.js';

// ── API keys ─────────────────────────────────────────────────────────────────
export type {
  ApiKey,
  CreateApiKeyPayload,
  UpdateApiKeyPayload,
} from './resources/api-keys/api-keys.types.js';

// ── Account ───────────────────────────────────────────────────────────────────
export type {
  AccountSenderDetails,
} from './resources/account/account.types.js';

// ── Exports ──────────────────────────────────────────────────────────────────
export type {
  ExportDateRange,
  ExportDispatchersParams,
  ExportStatisticsParams,
  ExportSubscribersParams,
  ExportStatisticFilterType,
  ExportStatisticObjectType,
  ExportStatisticObject,
  ExportStatisticType,
  ExportDispatcherRecord,
  ExportStatisticRecord,
  ExportSubscriberRecord,
  ExportStatisticsResult,
} from './resources/exports/exports.types.js';

// ── Analytics ────────────────────────────────────────────────────────────────
export type {
  AnalyticsObjectType,
  AnalyticsMetric,
  AnalyticsMessageType,
  AnalyticsDateRangeParams,
  AnalyticsQueryParams,
  AnalyticsParams,
  AnalyticsMetricValue,
  AnalyticsStat,
  AnalyticsResult,
} from './resources/analytics/analytics.types.js';

// ── Recipients ───────────────────────────────────────────────────────────────
export type {
  ListRecipientsParams,
  RecipientSegment,
  RecipientSubscriber,
  RecipientTag,
} from './resources/recipients/recipients.types.js';

// ── Custom field data ────────────────────────────────────────────────────────
export type {
  CustomFieldDataValue,
  CustomFieldValueEntry,
  CustomFieldData,
  CustomFieldDataFilters,
  CustomFieldDataByGroupFilters,
  CustomFieldDataListResult,
  CustomFieldDataResult,
  ListCustomFieldDataParams,
  ListAllCustomFieldDataParams,
  ListCustomFieldDataByGroupParams,
  ListAllCustomFieldDataByGroupParams,
  CustomFieldEntry,
  CustomFieldGroupEntry,
  WriteCustomFieldDataPayload,
  PatchCustomFieldDataPayload,
  CustomFieldValue,
  CustomFieldDataInput,
  CustomFieldDataWriteResult,
  SearchCustomFieldDataParams,
} from './resources/subscribers/subscribers.types.js';

// ── Orchestration helpers (deprecated wrappers on RuleClient) ────────────────
export type {
  CreateAutomationEmailConfig,
  CreateAutomationEmailResult,
  CreateCampaignEmailConfig,
  CreateCampaignEmailResult,
} from './orchestration.types.js';

// ── Webhooks ─────────────────────────────────────────────────────────────────
export type {
  CampaignLinkClickedEvent,
  CampaignOpenedEvent,
  CampaignSentEvent,
  ImportFinishedEvent,
  SubscriberAddedToSegmentEvent,
  SubscriberAddedToTagEvent,
  SubscriberBouncedEvent,
  SubscriberOptedInEvent,
  SubscriberRemovedFromTagEvent,
  SubscriberResubscribedEvent,
  SubscriberSuppressedEvent,
  SubscriberTagChangedEvent,
  TransactionLinkClickedEvent,
  TransactionOpenedEvent,
  TransactionSentEvent,
  WebhookAccount,
  WebhookBounceInfo,
  WebhookCampaignRef,
  WebhookEvent,
  WebhookImportSummary,
  WebhookSegmentRef,
  WebhookSubscriber,
  WebhookTagRef,
  WebhookTransactionMessage,
  WebhookTransactionRef,
} from './webhooks/index.js';
