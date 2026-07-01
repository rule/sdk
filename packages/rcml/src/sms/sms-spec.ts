/**
 * Public machine-readable SMS RCML spec.
 *
 * Describes the single SMS tag (`rc-sms`) in a stable public shape that
 * external consumers (MCP servers, LLM agents, doc generators) can use to
 * understand the SMS template structure. Cross-reference with {@link smsRfmSpec}
 * to understand the content model that fills the tag's body.
 *
 * ```ts
 * const tag = smsSpec.tags['rc-sms']
 * // tag.content.type === 'sms-rfm-content'
 * // smsRfmSpec.flavors['sms-rfm-content'] describes the valid content
 * ```
 */

import { SMS_SCHEMA_SPEC } from './schema/index.js'
import { SmsTagNamesEnum } from './schema/tag-names.js'

// ─── Public types ─────────────────────────────────────────────────────────────

/** How an SMS tag carries its content. */
export type SmsContentSpec = { type: 'sms-rfm-content' }

/**
 * Public descriptor for the `rc-sms` tag.
 *
 * @public
 */
export interface SmsPublicTagSpec {
  /** Human-readable description of what the tag does. */
  description: string
  /** How the tag holds its content. Always `sms-rfm-content` for `rc-sms`. */
  content: SmsContentSpec
  /** Allowed attributes. Always empty — `rc-sms` declares no attributes. */
  attributes: Record<string, never>
}

/**
 * Top-level machine-readable SMS specification exported from `@rule/rcml`.
 *
 * @public
 */
export interface SmsSpec {
  /** Spec format version — incremented when the shape of this object changes. */
  version: string
  /** All supported SMS tags keyed by tag name. */
  tags: Record<string, SmsPublicTagSpec>
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Machine-readable SMS RCML specification.
 *
 * @example
 * ```ts
 * import { smsSpec, smsRfmSpec } from '@rule/rcml'
 *
 * // The only SMS tag
 * Object.keys(smsSpec.tags)  // → ['rc-sms']
 *
 * // Cross-reference with smsRfmSpec to get the content model
 * const tag = smsSpec.tags['rc-sms']
 * const flavor = smsRfmSpec.flavors[tag.content.type]  // 'sms-rfm-content'
 * flavor.topLevelNodes  // ['message', 'link', 'placeholder']
 * ```
 * @public
 */
export const smsSpec: SmsSpec = {
  version: '0.1.0',
  tags: {
    [SmsTagNamesEnum.Sms]: {
      description: SMS_SCHEMA_SPEC[SmsTagNamesEnum.Sms].description ?? '',
      content: { type: 'sms-rfm-content' },
      attributes: {},
    },
  },
}
