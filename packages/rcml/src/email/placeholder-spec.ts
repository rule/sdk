/**
 * Public machine-readable placeholder spec.
 *
 * Describes every backend token type that the Rule.io renderer substitutes at
 * send time. These tokens appear as:
 *
 * - The `original` field of `::placeholder{...}` and `::loop-value{...}` RFM
 *   nodes (cross-reference: {@link emailRfmSpec}).
 * - Plain `[Type:value]` strings embedded directly in RCML attribute values
 *   (e.g. link `href`, subject line, custom attributes).
 *
 * Where a token maps to an RFM `::placeholder` type, the entry's
 * `rfmPlaceholderType` field holds that type string so consumers can
 * cross-reference with `emailRfmSpec.nodes['placeholder'].attrs.type`.
 *
 * `If/ElseIf/Else/EndIf` control-flow tokens and `DynamicVariable` are
 * intentionally out of scope for this spec.
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Describes one parameter of a placeholder token. */
export interface PlaceholderParamSpec {
  /** `true` when the parameter must be present. */
  required: boolean
  /** Human-readable description of the parameter. */
  description: string
  /**
   * Exhaustive list of **literal** allowed values for strictly enum-type parameters.
   * Absent when the parameter accepts free-form input or pattern-based values.
   */
  allowedValues?: string[]
  /**
   * Non-exhaustive list of **pattern** expressions for parameters that accept
   * structured but parameterised values (e.g. `'in-<count>-days'`).
   * Uses `<placeholder>` notation for variable parts.
   * May coexist with `allowedValues` when both literal and pattern forms are valid.
   */
  patterns?: string[]
  /**
   * Free-form format hint for non-enum parameters (e.g. `'PHP date format string'`).
   * Absent when `allowedValues` or `patterns` fully describes the valid inputs.
   */
  format?: string
}

/** Describes one backend placeholder token type. */
export interface PlaceholderTokenSpec {
  /** Human-readable description of what this token does at render time. */
  description: string
  /**
   * Syntax pattern for the token.
   * Uses `<param>` for required parameters and `[param]` for optional ones.
   * Where a token has two distinct syntactic forms (e.g. CustomField), both
   * are shown separated by a newline.
   */
  syntax: string
  /** Named parameters appearing in the syntax, keyed by the placeholder name. */
  params?: Record<string, PlaceholderParamSpec>
  /** Representative valid tokens. */
  examples: string[]
  /**
   * When present, this backend token maps to an RFM `::placeholder` node
   * whose `type` attribute equals this string.
   *
   * Cross-reference:
   * ```ts
   * emailRfmSpec.nodes['placeholder'].attrs['type'].allowedValues
   * ```
   */
  rfmPlaceholderType?: string
  /**
   * `true` when this token can appear nested inside the value of another token
   * (e.g. `[CustomField:...]` inside a `[RemoteContent:...]` URL or a
   * `[Date:[CustomField:...]::format]` type argument).
   */
  nestable?: boolean
}

/** Top-level machine-readable placeholder specification exported from @rule/rcml. */
export interface PlaceholderSpec {
  /** Spec format version. */
  version: string
  /**
   * All supported backend token types, keyed by the token's type identifier
   * (the part before the first `:`, or the full name for parameterless tokens).
   */
  tokens: Record<string, PlaceholderTokenSpec>
}

// ---------------------------------------------------------------------------
// Token metadata
// ---------------------------------------------------------------------------

const TOKENS: Record<string, PlaceholderTokenSpec> = {
  CustomField: {
    description:
      'Inserts the value of a subscriber custom field using `group.field` dot notation. An optional maximum-length suffix truncates the resolved value and appends `…` if it exceeds the limit.',
    syntax: '[CustomField:<group>.<field>]\n[CustomField:<group>.<field>::<maxLength>]',
    params: {
      group: {
        required: true,
        description: 'Custom field group name (e.g. `Order`, `Subscriber`).',
        format: 'Alphanumeric identifier',
      },
      field: {
        required: true,
        description: 'Custom field name within the group (e.g. `CreatedAt`, `FullName`).',
        format: 'Alphanumeric identifier',
      },
      maxLength: {
        required: false,
        description:
          'Maximum number of characters to include. If the resolved value is longer, it is truncated and `…` is appended.',
        format: 'Positive integer',
      },
    },
    examples: [
      '[CustomField:Order.CreatedAt]',
      '[CustomField:Order.Total::20]',
      '[CustomField:Subscriber.FullName]',
    ],
    rfmPlaceholderType: 'CustomField',
    nestable: true,
  },

  Subscriber: {
    description: 'Inserts a standard subscriber profile field.',
    syntax: '[Subscriber:<field>]',
    params: {
      field: {
        required: true,
        description: 'Subscriber profile field name.',
        allowedValues: ['email', 'phone_number', 'language'],
      },
    },
    examples: [
      '[Subscriber:email]',
      '[Subscriber:phone_number]',
      '[Subscriber:language]',
    ],
    rfmPlaceholderType: 'Subscriber',
    nestable: true,
  },

  User: {
    description: 'Inserts a field from the sender (Rule.io account / user) profile.',
    syntax: '[User:<field>]',
    params: {
      field: {
        required: true,
        description: 'User profile field name.',
        allowedValues: ['CompanyName', 'Street', 'Zip', 'City', 'EmailAddress'],
      },
    },
    examples: [
      '[User:CompanyName]',
      '[User:EmailAddress]',
      '[User:City]',
    ],
    rfmPlaceholderType: 'User',
    nestable: true,
  },

  Date: {
    description:
      'Inserts a formatted date value. The date can be relative to today (`now`, `tomorrow`, etc.), a computed offset (`in-N-days`, `N-days-ago`), or read from a subscriber custom field. The format parameter controls the output format; defaults to `Y-m-d`.',
    syntax: '[Date:<type>::<format>]',
    params: {
      type: {
        required: true,
        description:
          'Date source. Use a literal keyword, an offset expression, or a custom-field reference to read a date stored in a subscriber field.',
        allowedValues: ['now', 'tomorrow', 'yesterday'],
        patterns: ['in-<count>-days', '<count>-days-ago', '[CustomField:<group>.<field>]'],
      },
      format: {
        required: false,
        description: 'PHP date format string. Defaults to `Y-m-d` when omitted.',
        allowedValues: ['Y-m-d', 'd.m.Y', 'm-d-Y', 'm/d/Y', 'd/m/Y'],
      },
    },
    examples: [
      '[Date:now::Y-m-d]',
      '[Date:tomorrow::d.m.Y]',
      '[Date:yesterday::m/d/Y]',
      '[Date:in-2-days::m-d-Y]',
      '[Date:3-days-ago::d/m/Y]',
      '[Date:[CustomField:Order.CreatedAt]::Y-m-d]',
    ],
    rfmPlaceholderType: 'Date',
  },

  RemoteContent: {
    description:
      'Fetches content from a remote URL at send time and inserts the response body. The URL may contain nested `[CustomField:...]`, `[Subscriber:...]`, and `[User:...]` tokens that are resolved before the request is made.',
    syntax: '[RemoteContent:<url>]',
    params: {
      url: {
        required: true,
        description:
          'The endpoint URL to fetch. May include nested placeholder tokens for per-subscriber URLs.',
        format: 'Absolute URL (http/https). Nested tokens use their standard bracket syntax.',
      },
    },
    examples: [
      '[RemoteContent:https://api.example.com/banner]',
      '[RemoteContent:https://api.example.com/offer?id=[CustomField:Order.Id]&email=[Subscriber:email]]',
    ],
    rfmPlaceholderType: 'RemoteContent',
  },

  LoopValue: {
    description:
      'Reads a value from the current iteration\'s data item. Only meaningful inside an `rc-loop` tag, where it acts as the accessor for data supplied by the loop\'s configured source.\n\n' +
      'Supported loop sources:\n' +
      '- **News feed URL** — a publicly accessible JSON array of page URLs; the renderer fetches Open Graph metadata (e.g. `title`, `description`, `image`, `url`) from each page and exposes those OG tag names as keys.\n' +
      '- **Remote content URL** — an endpoint that returns a JSON array of objects; property names of each object become the keys.\n' +
      '- **Custom field** — a subscriber custom field of JSON type, or a text field whose stored value is a JSON array of objects.\n\n' +
      'The `key` identifies the property or OG tag to read from the current item. The `index` is a 1-based position counting all column slots across all sections of the loop block — index `1` is the first slot, `2` the second, and so on. For example, a loop with two sections (2 columns + 3 columns) has 5 slots per iteration, so each source item supplies values at indices 1–5 regardless of which section a slot belongs to.',
    syntax: '[LoopValue:<key>.<index>]',
    params: {
      key: {
        required: true,
        description: 'Property name from the loop item (e.g. `title`, `price`, `content`).',
        format: 'Alphanumeric identifier',
      },
      index: {
        required: true,
        description: 'One-based positional index of the value within the property.',
        format: 'Positive integer (starting from 1)',
      },
    },
    examples: [
      '[LoopValue:title.1]',
      '[LoopValue:price.1]',
      '[LoopValue:sku.1]',
      '[LoopValue:content.2]',
    ],
  },

  Link: {
    description:
      'Inserts a system-managed link URL. Used as the `href` value of a `:link` mark or an anchor attribute. The renderer replaces this token with the appropriate tracked URL for the chosen link type.',
    syntax: '[Link:<type>]',
    params: {
      type: {
        required: true,
        description: 'The category of system link to generate.',
        allowedValues: ['Optin', 'Unsubscribe', 'WebBrowser', 'ShareLink', 'Signup'],
      },
    },
    examples: [
      '[Link:Unsubscribe]',
      '[Link:WebBrowser]',
      '[Link:Optin]',
    ],
  },

  RandomString: {
    description:
      'Inserts a unique random string generated at send time using PHP\'s `uniqid()`. Produces a different value for each recipient. Useful for cache-busting URLs or unique tracking identifiers.',
    syntax: '[RandomString]',
    examples: ['[RandomString]'],
  },

  Dispatcher: {
    description:
      'Inserts a property of the sending dispatcher (the campaign, automail, or transactional message that triggered the send).',
    syntax: '[Dispatcher:<field>]',
    params: {
      field: {
        required: true,
        description: 'Dispatcher property to insert.',
        allowedValues: ['id', 'name', 'type'],
      },
    },
    examples: [
      '[Dispatcher:id]',
      '[Dispatcher:name]',
      '[Dispatcher:type]',
    ],
  },

  PromoCode: {
    description:
      'Inserts a promo code from the specified promo-code group. Each recipient receives a unique code from the pool.',
    syntax: '[PromoCode:<group>]',
    params: {
      group: {
        required: true,
        description: 'Name of the promo-code group to draw from.',
        format: 'Alphanumeric identifier',
      },
    },
    examples: [
      '[PromoCode:summer-sale]',
      '[PromoCode:welcome]',
    ],
  },
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Machine-readable placeholder specification.
 *
 * @example
 * ```ts
 * import { placeholderSpec } from '@rule/rcml'
 *
 * // All token type names
 * Object.keys(placeholderSpec.tokens)
 * // → ['CustomField', 'Subscriber', 'User', 'Date', ...]
 *
 * // Cross-reference: which tokens map to RFM ::placeholder types?
 * Object.entries(placeholderSpec.tokens)
 *   .filter(([, t]) => t.rfmPlaceholderType !== undefined)
 *   .map(([k]) => k)
 * // → ['CustomField', 'Subscriber', 'User', 'Date', 'RemoteContent']
 *
 * // Allowed values for the Subscriber field parameter
 * placeholderSpec.tokens['Subscriber'].params?.['field'].allowedValues
 * // → ['email', 'phone_number', 'language']
 * ```
 * @public
 */
export const placeholderSpec: PlaceholderSpec = {
  version: '0.1.0',
  tokens: TOKENS,
}
