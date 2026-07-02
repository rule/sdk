/**
 * SMS-applicable subset of the Rule.io backend placeholder spec.
 *
 * The full {@link placeholderSpec} covers all token types including
 * email-only tokens (`LoopValue`, `RandomString`, `Dispatcher`, `PromoCode`).
 * This file exports a filtered view containing only the five token types
 * that are valid in user-authored SMS messages.
 *
 * @see {@link placeholderSpec} for the full email + SMS token catalog.
 * @see {@link smsRfmSpec} for the SMS RFM content model that references these tokens.
 */

import { placeholderSpec } from '../email/placeholder-spec.js'
import type { PlaceholderSpec } from '../email/placeholder-spec.js'

export type { PlaceholderSpec, PlaceholderTokenSpec, PlaceholderParamSpec } from '../email/placeholder-spec.js'

// ─── SMS token type union ──────────────────────────────────────────────────────

const SMS_TOKEN_TYPES = [
  'CustomField',
  'Subscriber',
  'User',
  'Date',
  'RemoteContent',
] as const

/** Union of token type keys valid in SMS messages. @public */
export type SmsPlaceholderTokenType = (typeof SMS_TOKEN_TYPES)[number]

// ─── Filtered spec ────────────────────────────────────────────────────────────

/**
 * Machine-readable placeholder spec for SMS — a filtered view of
 * {@link placeholderSpec} containing only the five token types valid in
 * user-authored SMS messages.
 *
 * Excluded: `Link` (system-only — produced internally by the `::unsubscribe`
 * directive; never authored directly), `LoopValue`, `RandomString`,
 * `Dispatcher`, `PromoCode`.
 *
 * @example
 * ```ts
 * import { smsPlaceholderSpec } from '@rule/rcml'
 *
 * // All SMS-valid token type names
 * Object.keys(smsPlaceholderSpec.tokens)
 * // → ['CustomField', 'Subscriber', 'User', 'Date', 'RemoteContent']
 *
 * // Cross-reference with smsRfmSpec:
 * import { smsRfmSpec } from '@rule/rcml'
 * smsRfmSpec.nodes['placeholder'].attrs?.['type'].allowedValues
 * // → same list as Object.keys(smsPlaceholderSpec.tokens)
 * ```
 * @public
 */
export const smsPlaceholderSpec: PlaceholderSpec = {
  version: placeholderSpec.version,
  tokens: Object.fromEntries(
    SMS_TOKEN_TYPES.map((k) => [k, placeholderSpec.tokens[k]!]),
  ),
}
