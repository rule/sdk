/**
 * Public API: typed factories for SMS placeholder nodes.
 *
 * Placeholders are dynamic values the Rule platform substitutes at send
 * time — subscriber fields, custom field values, account attributes,
 * formatted dates, fetched remote content, and system-managed link URLs.
 *
 * Two layers are provided:
 *
 * - {@link createPlaceholderNode} — a low-level factory that takes the raw
 *   `type`, `original`, `name`, optional `value`, and optional `maxLength`.
 *   Use this when you need to express something the convenience builders
 *   below do not cover.
 *
 * - One convenience builder per SMS placeholder token type
 *   ({@link createSubscriberPlaceholder}, {@link createCustomFieldPlaceholder},
 *   etc.) — wraps {@link createPlaceholderNode} and computes the correct
 *   `original` token from domain inputs so callers never have to write
 *   `[Type:Name]` syntax by hand.
 *
 * @public
 */

import type {
  SmsPlaceholderNode,
  SmsPlaceholderType,
} from './../content/json-validator/types.js'

// ─── Generic placeholder ──────────────────────────────────────────────────────

/** Options for {@link createPlaceholderNode}. @public */
export interface CreateSmsPlaceholderNodeOptions {
  /** Placeholder category. */
  type: SmsPlaceholderType
  /**
   * Backend token the Rule platform substitutes at send time, e.g.
   * `'[Subscriber:email]'` or `'[CustomField:Order.Total]'`.
   */
  original: string
  /** Human-readable display label shown in the editor chip. */
  name: string
  /**
   * Resolved preview value shown in the editor, or `null` (default) when
   * not yet resolved.
   */
  value?: string | number | null
  /**
   * Truncation limit (number of characters). Pass a string of digits, e.g.
   * `'20'`. `null` (default) means no limit.
   */
  maxLength?: string | null
}

/**
 * Build an {@link SmsPlaceholderNode} from raw attribute values. Most
 * callers should reach for one of the typed convenience builders below
 * instead — they compute `original` and `name` from domain inputs so the
 * caller never has to assemble bracket-token strings by hand.
 *
 * @example
 * ```ts
 * sms.createPlaceholderNode({
 *   type: 'Subscriber',
 *   original: '[Subscriber:email]',
 *   name: 'email',
 * })
 * ```
 * @public
 */
export function createPlaceholderNode(
  opts: CreateSmsPlaceholderNodeOptions,
): SmsPlaceholderNode {
  const node: SmsPlaceholderNode = {
    type: 'placeholder',
    attrs: {
      type: opts.type,
      name: opts.name,
      original: opts.original,
      value: opts.value ?? null,
    },
  }

  if (opts.maxLength !== undefined) {
    node.attrs['max-length'] = opts.maxLength
  }

  return node
}

// ─── Subscriber ───────────────────────────────────────────────────────────────

/** Options for {@link createSubscriberPlaceholder}. @public */
export interface CreateSmsSubscriberPlaceholderOptions {
  /**
   * Subscriber field identifier — e.g. `'email'`, `'phone_number'`, `'language'`.
   */
  field: string
  /**
   * Override for the editor display label. Defaults to `field` (matching
   * what the SMS RFM parser produces).
   */
  name?: string
}

/**
 * Build a `Subscriber` placeholder node.
 *
 * Produces `original = '[Subscriber:<field>]'`.
 *
 * @example
 * ```ts
 * sms.createSubscriberPlaceholder({ field: 'email' })
 * // → { type: 'placeholder', attrs: { type: 'Subscriber',
 * //     original: '[Subscriber:email]', name: 'email', value: null } }
 * ```
 * @public
 */
export function createSubscriberPlaceholder(
  opts: CreateSmsSubscriberPlaceholderOptions,
): SmsPlaceholderNode {
  return createPlaceholderNode({
    type: 'Subscriber',
    original: `[Subscriber:${opts.field}]`,
    name: opts.name ?? opts.field,
  })
}

// ─── User ─────────────────────────────────────────────────────────────────────

/** Options for {@link createUserPlaceholder}. @public */
export interface CreateSmsUserPlaceholderOptions {
  /**
   * Account field identifier — e.g. `'CompanyName'`, `'Street'`, `'Zip'`,
   * `'City'`, `'EmailAddress'`.
   */
  field: string
  /** Override for the editor display label. Defaults to `field`. */
  name?: string
}

/**
 * Build a `User` placeholder node.
 *
 * Produces `original = '[User:<field>]'`.
 *
 * @example
 * ```ts
 * sms.createUserPlaceholder({ field: 'CompanyName' })
 * ```
 * @public
 */
export function createUserPlaceholder(
  opts: CreateSmsUserPlaceholderOptions,
): SmsPlaceholderNode {
  return createPlaceholderNode({
    type: 'User',
    original: `[User:${opts.field}]`,
    name: opts.name ?? opts.field,
  })
}

// ─── CustomField ──────────────────────────────────────────────────────────────

/** Options for {@link createCustomFieldPlaceholder}. @public */
export interface CreateSmsCustomFieldPlaceholderOptions {
  /** Custom field group name, e.g. `'Order'`. */
  group: string
  /** Custom field name within the group, e.g. `'Total'`. */
  name: string
  /**
   * Truncation limit in characters. When set, the `original` token gets a
   * `::<maxLength>` suffix and the `max-length` attr is populated with the
   * same value as a string.
   */
  maxLength?: number
}

/**
 * Build a `CustomField` placeholder node.
 *
 * Produces `original = '[CustomField:<group>.<name>]'`, or
 * `'[CustomField:<group>.<name>::<maxLength>]'` when `maxLength` is given.
 *
 * @example
 * ```ts
 * sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total' })
 * sms.createCustomFieldPlaceholder({ group: 'Order', name: 'Total', maxLength: 20 })
 * ```
 * @public
 */
export function createCustomFieldPlaceholder(
  opts: CreateSmsCustomFieldPlaceholderOptions,
): SmsPlaceholderNode {
  const fullName = `${opts.group}.${opts.name}`
  const truncSuffix = opts.maxLength !== undefined ? `::${opts.maxLength}` : ''

  return createPlaceholderNode({
    type: 'CustomField',
    original: `[CustomField:${fullName}${truncSuffix}]`,
    name: fullName,
    maxLength: opts.maxLength !== undefined ? String(opts.maxLength) : undefined,
  })
}

// ─── Date ─────────────────────────────────────────────────────────────────────

/**
 * Date source for {@link createDatePlaceholder}. The simple keywords
 * (`'now'`, `'tomorrow'`, `'yesterday'`) cover the common cases; the
 * tagged-object variants cover offsets and custom-field references.
 *
 * @public
 */
export type SmsDateSource =
  | 'now'
  | 'tomorrow'
  | 'yesterday'
  | { kind: 'days-from-now'; count: number }
  | { kind: 'days-ago'; count: number }
  | { kind: 'custom-field'; group: string; name: string }

/**
 * Date output format for {@link createDatePlaceholder}. The closed set
 * matches what the SMS RFM parser accepts.
 *
 * @public
 */
export type SmsDateFormat = 'Y-m-d' | 'd.m.Y' | 'm-d-Y' | 'm/d/Y' | 'd/m/Y'

/** Options for {@link createDatePlaceholder}. @public */
export interface CreateSmsDatePlaceholderOptions {
  /** Where the date comes from. */
  source: SmsDateSource
  /** PHP date format string. */
  format: SmsDateFormat
  /** Override for the editor display label. Defaults to a human-readable
   * description of `source`. */
  name?: string
}

/** @internal */
function renderDateSource(source: SmsDateSource): string {
  if (typeof source === 'string') return source

  switch (source.kind) {
    case 'days-from-now':
      return `in-${source.count}-days`
    case 'days-ago':
      return `${source.count}-days-ago`
    case 'custom-field':
      return `[CustomField:${source.group}.${source.name}]`
  }
}

/** @internal */
function defaultDateName(source: SmsDateSource): string {
  if (typeof source === 'string') return source

  switch (source.kind) {
    case 'days-from-now':
      return `In ${source.count} days`
    case 'days-ago':
      return `${source.count} days ago`
    case 'custom-field':
      return `${source.group}.${source.name}`
  }
}

/**
 * Build a `Date` placeholder node.
 *
 * Produces `original = '[Date:<source>::<format>]'`, where `<source>` is
 * derived from {@link SmsDateSource}.
 *
 * @example
 * ```ts
 * sms.createDatePlaceholder({ source: 'tomorrow', format: 'd.m.Y' })
 * // original: '[Date:tomorrow::d.m.Y]'
 *
 * sms.createDatePlaceholder({
 *   source: { kind: 'days-from-now', count: 7 },
 *   format: 'Y-m-d',
 * })
 * // original: '[Date:in-7-days::Y-m-d]'
 *
 * sms.createDatePlaceholder({
 *   source: { kind: 'custom-field', group: 'Order', name: 'CreatedAt' },
 *   format: 'Y-m-d',
 * })
 * // original: '[Date:[CustomField:Order.CreatedAt]::Y-m-d]'
 * ```
 * @public
 */
export function createDatePlaceholder(
  opts: CreateSmsDatePlaceholderOptions,
): SmsPlaceholderNode {
  const sourceToken = renderDateSource(opts.source)

  return createPlaceholderNode({
    type: 'Date',
    original: `[Date:${sourceToken}::${opts.format}]`,
    name: opts.name ?? defaultDateName(opts.source),
  })
}

// ─── RemoteContent ────────────────────────────────────────────────────────────

/** Options for {@link createRemoteContentPlaceholder}. @public */
export interface CreateSmsRemoteContentPlaceholderOptions {
  /**
   * Absolute URL the Rule platform fetches at send time. May contain
   * nested `[CustomField:…]`, `[Subscriber:…]`, or `[User:…]` tokens that
   * are resolved before the request is made.
   */
  url: string
}

/**
 * Build a `RemoteContent` placeholder node.
 *
 * Produces `original = '[RemoteContent:<url>]'`. The `name` attribute is
 * always `'RemoteContent'`, matching what the SMS RFM parser produces.
 *
 * @example
 * ```ts
 * sms.createRemoteContentPlaceholder({ url: 'https://api.example.com/promo' })
 * ```
 * @public
 */
export function createRemoteContentPlaceholder(
  opts: CreateSmsRemoteContentPlaceholderOptions,
): SmsPlaceholderNode {
  return createPlaceholderNode({
    type: 'RemoteContent',
    original: `[RemoteContent:${opts.url}]`,
    name: 'RemoteContent',
  })
}

// ─── Link (system-managed link URL) ───────────────────────────────────────────

/**
 * The five system-managed link types that can be inserted as a `Link`
 * placeholder or as the `text` of a `link` node (see `createLinkNode`).
 *
 * @public
 */
export type SmsSystemLinkType =
  | 'Optin'
  | 'Unsubscribe'
  | 'WebBrowser'
  | 'ShareLink'
  | 'Signup'

/** Options for {@link createLinkPlaceholder}. @public */
export interface CreateSmsLinkPlaceholderOptions {
  /** Which system-managed link to insert. */
  link: SmsSystemLinkType
}

/**
 * Build a `Link` placeholder node — inserts a system-managed link URL as
 * plain text in the message body.
 *
 * To produce a clickable hyperlink instead, use {@link createLinkNode} with
 * the system link URL as `url`.
 *
 * Produces `original = '[Link:<link>]'` and `name = '<link>'`.
 *
 * @example
 * ```ts
 * sms.createLinkPlaceholder({ link: 'Unsubscribe' })
 * // original: '[Link:Unsubscribe]', name: 'Unsubscribe'
 * ```
 * @public
 */
export function createLinkPlaceholder(
  opts: CreateSmsLinkPlaceholderOptions,
): SmsPlaceholderNode {
  return createPlaceholderNode({
    type: 'Link',
    original: `[Link:${opts.link}]`,
    name: opts.link,
  })
}
