/**
 * Account namespace types for the `@rule/client` package.
 *
 * The sender details endpoint returns account-level email and SMS sender
 * configuration used when creating campaigns.
 */

import type { RuleApiResponse } from '../../shared.types.js';

// ── Public SDK types ──────────────────────────────────────────────────────────

/**
 * Account sender details as returned by `GET /sender/details`.
 *
 * Contains the account-level email and SMS sender configuration.
 */
export interface AccountSenderDetails {
  /** Account ID. */
  accountId: number;
  /** Sender display name for emails. */
  name: string;
  /** Sender email address. */
  email: string;
  /** Company name. */
  company: string;
  /** SMS sender name (the `From` field for text messages). */
  textMessageSenderName: string;
  /**
   * Whether to use an unsubscribe link instead of a stop-word in SMS messages.
   *
   * When `true`, the default SMS template should include a link-based
   * unsubscribe. When `false` or omitted, a stop-word is used instead.
   */
  linkInsteadOfStopWord?: boolean;
}

// ── Internal wire types ───────────────────────────────────────────────────────

/**
 * Wire-format sender details from `GET /sender/details`.
 *
 * The endpoint returns the object at the root level (not nested under `data`).
 * @internal
 */
export interface AccountSenderDetailsWire extends RuleApiResponse {
  account_id: number;
  name: string;
  email: string;
  company: string;
  text_message_sender_name: string;
  link_instead_of_stop_word?: boolean;
}
