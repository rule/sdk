/**
 * Public API: the `email` namespace object.
 *
 * Bundles the Email RFM string builders under a single import surface so
 * call sites read as `email.createCustomField(...)`,
 * `email.createLink(...)`, etc.
 *
 * @public
 */

import {
  createCustomField,
  createFont,
  createLink,
  createLoopValue,
} from './email-rfm-builders.js'

/**
 * Namespace object grouping the Email RFM string builders.
 *
 * Each builder returns a literal Email RFM directive string suitable for
 * splicing into copy that is later compiled and parsed.
 *
 * @example
 * ```ts
 * import { email } from '@rule/rcml';
 *
 * const fieldAtom = email.createCustomField({
 *   group: 'Order', name: 'Total', id: 13,
 * });
 *
 * const linkAtom = email.createLink({
 *   label: 'Click here',
 *   href: 'https://example.com',
 * });
 * ```
 * @public
 */
export const email = {
  createCustomField,
  createLoopValue,
  createLink,
  createFont,
} as const
