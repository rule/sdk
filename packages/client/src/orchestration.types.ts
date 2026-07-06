/**
 * Configuration and result types for the deprecated orchestration helpers
 * `RuleClient.createAutomationEmail` and `RuleClient.createCampaignEmail`.
 *
 * These types stay public so existing callers continue compiling. The
 * implementation lives in `client.ts` until the helpers are relocated to
 * consumers in a follow-up change.
 */

import type { RcmlDocument, RcmlSection, RcmlLoop, RcmlSwitch } from '@rule/rcml';

import type { AutomationSendoutType } from './resources/automations/automations.types.js';
import type {
  CampaignRecipientSegment,
  CampaignRecipientTag,
  CampaignSendoutType,
} from './resources/campaigns/campaigns.types.js';

export interface CreateAutomationEmailConfig {
  name: string;
  description?: string;
  triggerType: 'tag' | 'segment' | 'event';
  triggerValue: string;
  subject: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  delayInSeconds?: string;
  /**
   * Sendout type for the automation.
   * - `'marketing'` — marketing emails (default)
   * - `'transactional'` — order confirmations, receipts, etc.
   */
  sendoutType?: AutomationSendoutType;
  /** Full RCML template document. Provide this OR `brandStyleId`, not both. */
  template?: RcmlDocument;
  /**
   * Rule.io brand style ID. When provided (without `template`), the SDK
   * auto-fetches the brand style and builds editor-compatible RCML.
   */
  brandStyleId?: number;
  /**
   * RCML body children to include when using `brandStyleId`. Supports
   * sections, loops, and switch blocks. If omitted or empty, a default
   * placeholder content section is added automatically.
   */
  sections?: (RcmlSection | RcmlLoop | RcmlSwitch)[];
}

export interface CreateAutomationEmailResult {
  /** The automation (automail) ID. */
  automationId: number;
  /**
   * @deprecated Use {@link automationId} instead.
   */
  automailId: number;
  messageId: number;
  templateId: number;
  dynamicSetId: number;
}

/**
 * Configuration for creating a complete campaign email in one call.
 *
 * @example
 * ```typescript
 * const result = await client.createCampaignEmail({
 *   name: 'April Newsletter',
 *   subject: 'What\'s new this month',
 *   sendoutType: 1,
 *   brandStyleId: 976,
 *   tags: [{ id: 42, negative: false }],
 * });
 * ```
 */
export interface CreateCampaignEmailConfig {
  name: string;
  subject: string;
  preheader?: string;
  fromName?: string;
  fromEmail?: string;
  sendoutType?: CampaignSendoutType;
  tags?: CampaignRecipientTag[];
  segments?: CampaignRecipientSegment[];
  subscribers?: number[];
  /** Full RCML template. Provide this OR `brandStyleId`, not both. */
  template?: RcmlDocument;
  /** Brand style ID to auto-build editor-compatible RCML. */
  brandStyleId?: number;
  /** RCML body sections when using `brandStyleId`. Defaults to placeholder content when omitted or empty. */
  sections?: (RcmlSection | RcmlLoop | RcmlSwitch)[];
}

export interface CreateCampaignEmailResult {
  campaignId: number;
  messageId: number;
  templateId: number;
  dynamicSetId: number;
}
