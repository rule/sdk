/**
 * Public API: typed factories for SMS content JSON nodes.
 *
 * Each builder returns a correctly shaped node for {@link SmsContentJson}.
 * Builders are pure factories — no validation, no normalization beyond the
 * type signatures. Validation happens at the document boundary via
 * {@link createSmsDocument} or {@link safeParseSmsJson}.
 *
 * @public
 */

import type {
  SmsContentJson,
  SmsLinkNode,
  SmsMessageNode,
  SmsPlaceholderNode,
  SmsTopLevelNode,
} from './../content/json-validator/types.js'

// ─── Message node ─────────────────────────────────────────────────────────────

/** Options for {@link createMessageNode}. @public */
export interface CreateSmsMessageNodeOptions {
  /**
   * The text content. May contain `\n` for line breaks and paragraph
   * boundaries. Must be a non-empty string.
   */
  text: string
}

/**
 * Build an {@link SmsMessageNode} — a text segment in the SMS body.
 *
 * Text may contain `\n` characters: a single `\n` produces a line break, and
 * `\n` at a paragraph boundary is also expressed inline in the same way.
 *
 * @example
 * ```ts
 * sms.createMessageNode({ text: 'Your order has shipped!\nAccount: [Subscriber:email]' })
 * ```
 * @public
 */
export function createMessageNode(opts: CreateSmsMessageNodeOptions): SmsMessageNode {
  return { type: 'message', text: opts.text }
}

// ─── Link node ────────────────────────────────────────────────────────────────

/** Options for {@link createLinkNode}. @public */
export interface CreateSmsLinkNodeOptions {
  /**
   * The URL. This is used both as the link destination and as the visible
   * text in the message body.
   */
  url: string
  /** Whether click tracking is enabled for this link. */
  track: boolean
  /** Whether URL shortening is enabled for this link. */
  shorten: boolean
}

/**
 * Build an {@link SmsLinkNode} — a hyperlink in the SMS body.
 *
 * The URL is used as both the destination and the visible text. The Rule
 * platform applies tracking and/or URL shortening at send time based on the
 * `track` and `shorten` flags.
 *
 * @example
 * ```ts
 * sms.createLinkNode({ url: 'https://example.com/orders/123', track: true, shorten: true })
 * ```
 * @public
 */
export function createLinkNode(opts: CreateSmsLinkNodeOptions): SmsLinkNode {
  return {
    type: 'link',
    text: opts.url,
    attrs: {
      track: opts.track,
      shorten: opts.shorten,
    },
  }
}

// ─── Root content document ────────────────────────────────────────────────────

/** Options for {@link createContent}. @public */
export interface CreateSmsContentOptions {
  /**
   * Top-level nodes — a mix of {@link SmsMessageNode}, {@link SmsLinkNode},
   * and {@link SmsPlaceholderNode}. May be empty.
   */
  nodes: SmsTopLevelNode[]
}

/**
 * Build an {@link SmsContentJson} root document — the `sms` container that
 * wraps all top-level nodes.
 *
 * @example
 * ```ts
 * const content = sms.createContent({
 *   nodes: [
 *     sms.createMessageNode({ text: 'Hi ' }),
 *     sms.createSubscriberPlaceholder({ field: 'email' }),
 *     sms.createMessageNode({ text: ', your order has shipped!' }),
 *   ],
 * })
 * ```
 * @public
 */
export function createContent(opts: CreateSmsContentOptions): SmsContentJson {
  return { type: 'sms', content: opts.nodes }
}

// ─── Unsubscribe nodes ────────────────────────────────────────────────────────

/**
 * Build the two-node unsubscribe footer: a localised stop-word message followed
 * by the system unsubscribe link placeholder.
 *
 * Spread the result directly into a `createContent({ nodes })` call:
 *
 * @example
 * ```ts
 * sms.createContent({
 *   nodes: [
 *     sms.createMessageNode({ text: 'Your order has shipped.' }),
 *     ...sms.createUnsubscribeNodes(),
 *   ],
 * })
 * ```
 * @public
 */
export function createUnsubscribeNodes(): [SmsMessageNode, SmsPlaceholderNode] {
  return [
    {
      type: 'message',
      text: '[Subscriber:unsubscribe_text]',
      attrs: { 'is-unsubscribe': true },
    },
    {
      type: 'placeholder',
      attrs: {
        type: 'Link',
        name: 'Unsubscribe',
        original: '[Link:Unsubscribe]',
        value: null,
        'is-unsubscribe': true,
      },
    },
  ]
}
