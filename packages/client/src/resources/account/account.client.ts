/**
 * Account namespace client for the `@rule/client` package.
 *
 * Wraps account-level configuration endpoints, including sender details
 * used when building campaign messages and SMS templates.
 */

import { BaseResource } from '../../core/base-resource.js';
import type {
  AccountSenderDetails,
  AccountSenderDetailsWire,
} from './account.types.js';

// ── Client ────────────────────────────────────────────────────────────────────

export class AccountClient extends BaseResource {
  /**
   * Fetch account sender details.
   *
   * Returns the account-level email and SMS sender configuration. The SMS
   * sender name (`textMessageSenderName`) is used as the `From` field when
   * creating SMS campaigns.
   *
   * @returns The account sender details.
   *
   * @example
   * ```typescript
   * const details = await client.account.getSenderDetails();
   * console.log(details.textMessageSenderName);
   * ```
   */
  async getSenderDetails(): Promise<AccountSenderDetails> {
    const wire = await this.transport.get<AccountSenderDetailsWire>('/sender/details', {
      version: 'v2',
    });

    return mapSenderDetailsWireToEntity(wire);
  }
}

// ── Wire ↔ entity mappers ─────────────────────────────────────────────────────

/**
 * @internal
 */
function mapSenderDetailsWireToEntity(wire: AccountSenderDetailsWire): AccountSenderDetails {
  return {
    accountId: wire.account_id,
    name: wire.name,
    email: wire.email,
    company: wire.company,
    textMessageSenderName: wire.text_message_sender_name,
    linkInsteadOfStopWord: wire.link_instead_of_stop_word,
  };
}
