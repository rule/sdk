/**
 * Public API: factory for constructing SMS RCML documents.
 */

import type { SmsDocument } from './sms-types.js'
import type { SmsContentJson } from './content/json-validator/types.js'
import { smsRfmToJson } from './sms-rfm-to-json.js'
import { safeParseSmsJson } from './validate-sms-json.js'
import { SmsDocumentBuildError, SmsDocumentBuildErrorCodes } from './builders/errors.js'

/**
 * Options for {@link createSmsDocument}.
 * @public
 */
export interface CreateSmsDocumentOptions {
  /**
   * The SMS message body.
   *
   * Accepts either:
   * - A **string** in SMS RFM (SMS Rule Flavor Markdown) — use `::placeholder{…}` for
   *   dynamic values, `:link[url]{…}` for links, and `::unsubscribe` for the footer.
   *   Both `\n` and `\n\n` are preserved as `\n` characters inside `message` node text.
   * - A pre-built {@link SmsContentJson} document — validated on the way in.
   */
  content: string | SmsContentJson
}

/**
 * Create an SMS RCML document.
 *
 * Returns an {@link SmsDocument} that can be passed to
 * `client.templates.createSmsTemplate` or `client.templates.updateSmsTemplate`.
 *
 * @param options - SMS document options.
 * @returns A valid {@link SmsDocument}.
 * @throws {SmsDocumentBuildError} When a pre-built {@link SmsContentJson} is
 *   supplied and fails schema validation.
 *
 * @example
 * ```typescript
 * import { createSmsDocument } from '@rule/rcml';
 *
 * // From an SMS RFM string
 * const doc = createSmsDocument({
 *   content: 'Your order has shipped!\nAccount: [Subscriber:email]',
 * });
 *
 * // From a pre-built content JSON document
 * const doc2 = createSmsDocument({
 *   content: {
 *     type: 'sms',
 *     content: [{ type: 'message', text: 'Hello!' }],
 *   },
 * });
 *
 * const template = await client.templates.createSmsTemplate({
 *   name: 'Order shipped SMS',
 *   content: doc,
 * });
 * ```
 * @public
 */
export function createSmsDocument(options: CreateSmsDocumentOptions): SmsDocument {
  let content: SmsContentJson

  if (typeof options.content === 'string') {
    content = smsRfmToJson(options.content)
  } else {
    const result = safeParseSmsJson(options.content)

    if (!result.success) {
      throw new SmsDocumentBuildError(
        result.errors.map((e) => ({
          code: SmsDocumentBuildErrorCodes.CONTENT_INVALID,
          path: `content${e.path}`,
          message: e.message,
        })),
      )
    }

    content = result.data
  }

  return {
    tagName: 'rc-sms',
    content,
  }
}
