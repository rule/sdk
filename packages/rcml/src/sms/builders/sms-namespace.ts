/**
 * Public API: the `sms` namespace object.
 *
 * Bundles every SMS content builder under a single import surface so call
 * sites read as `sms.createMessageNode(...)`, `sms.createLinkNode(...)`, etc.
 *
 * @public
 */

import { createContent, createLinkNode, createMessageNode, createUnsubscribeNodes } from './nodes.js'
import {
  createCustomFieldPlaceholder,
  createDatePlaceholder,
  createPlaceholderNode,
  createRemoteContentPlaceholder,
  createSubscriberPlaceholder,
  createUserPlaceholder,
} from './placeholders.js'

/**
 * Namespace object grouping every SMS content-JSON builder.
 *
 * @example
 * ```ts
 * import { sms, createSmsDocument } from '@rule/rcml';
 *
 * const content = sms.createContent({
 *   nodes: [
 *     sms.createMessageNode({ text: 'Hi ' }),
 *     sms.createSubscriberPlaceholder({ field: 'email' }),
 *     sms.createMessageNode({ text: '!\n' }),
 *     sms.createLinkNode({ url: 'https://example.com', track: true, shorten: true }),
 *   ],
 * });
 *
 * const doc = createSmsDocument({ content });
 * ```
 * @public
 */
export const sms = {
  // Nodes
  createContent,
  createMessageNode,
  createLinkNode,
  createUnsubscribeNodes,

  // Placeholders — generic + per-type convenience builders
  createPlaceholderNode,
  createSubscriberPlaceholder,
  createUserPlaceholder,
  createCustomFieldPlaceholder,
  createDatePlaceholder,
  createRemoteContentPlaceholder,
} as const
