/**
 * Internal: SMS RFM (SMS Rule Flavor Markdown) string → SmsContentJson conversion.
 *
 * SMS RFM is a markdown-directive-based format:
 *   - `:link[url]{track="true|false" shorten="true|false"}` → link node (canonical form; `href` attribute accepted but ignored for backward compat)
 *   - `::placeholder{type="..." original="..." name="..." value="..."}` → placeholder node
 *   - `[Type:Name]` → shorthand placeholder (backward-compatible, converted to `::placeholder{...}` before parsing)
 *   - `\\\n` (backslash + newline) or bare `\n` within a paragraph → embedded `\n` in message text
 *   - `\n\n` (double newline) → paragraph boundary, becomes `\n` in message text
 *   - Everything else → message node text
 *
 * @internal
 */

import type { Root, PhrasingContent, Paragraph } from 'mdast'
import type { TextDirective, LeafDirective } from 'mdast-util-directive'
import { parse } from '../../../email/content/parser/parse.js'
import { validate } from '../../../email/content/parser/validate.js'
import { preprocessMarkdown, ATOM_TOKEN_DELIMITER, ATOM_TOKEN_SEPARATOR, COLON_ESCAPE } from '../../../email/content/parser/preprocess.js'
import { formatErrors } from '../../../email/content/parser/format.js'
import { RcmlValidationError } from '../../../email/content/parser/parse.js'
import { smsRfmConfig } from '../flavors/sms-rfm.js'
import type {
  SmsContentJson,
  SmsLinkNode,
  SmsMessageNode,
  SmsPlaceholderNode,
  SmsPlaceholderType,
  SmsTopLevelNode,
} from '../json-validator/types.js'

// ─── Step 0: ::unsubscribe tokenization ────────────────────────────────────

/**
 * Matches `::unsubscribe` anywhere in the input, with optional surrounding whitespace.
 * Must run BEFORE `normalizeHardbreaks` so that the newline preceding the directive
 * is not converted to a markdown hard-break escape (`\\\n`), which would leave a stray
 * backslash in the preceding message text.
 */
const UNSUBSCRIBE_DIRECTIVE_RE = /::unsubscribe(?:\s*\{\s*\})?/g

/**
 * Replace `::unsubscribe` occurrences with a PUA token so that `normalizeHardbreaks`
 * and remark do not alter them.  `expandAtomTokens` decodes them back to the two
 * unsubscribe nodes.
 * @internal
 */
function tokenizeUnsubscribeDirective(input: string): string {
  const token = `${ATOM_TOKEN_DELIMITER}unsubscribe${ATOM_TOKEN_SEPARATOR}${ATOM_TOKEN_DELIMITER}`

  return input.replace(UNSUBSCRIBE_DIRECTIVE_RE, token)
}

// ─── Step 1a: protect :link[…] labels from shorthand expansion ───────────────

/**
 * PUA characters used to escape `[` and `]` inside `:link[…]` labels so that
 * `expandPlaceholderShorthand` does not rewrite `[CustomField:Name]` tokens
 * embedded in a URL, and remark does not interpret them as directives.
 * Decoded back to literal brackets in `convertLinkDirective`.
 */
const BRACKET_OPEN_ESCAPE = ''
const BRACKET_CLOSE_ESCAPE = ''

/**
 * Escape every `[` and `]` inside `:link[…]` label content with PUA chars so that
 * `[CustomField:Name]` tokens embedded in link URLs are not rewritten by
 * `expandPlaceholderShorthand` and are not misinterpreted as markdown directives.
 *
 * Uses a depth-tracking scan: after the opening `:link[`, every `[` increments
 * depth and every `]` decrements it. The outer `]` (depth reaches 0) is kept
 * as-is; all inner brackets are replaced with the PUA escapes.
 *
 * `convertLinkDirective` decodes them back to literal brackets.
 * @internal
 */
function escapeLinkLabelBrackets(input: string): string {
  const result: string[] = []
  let i = 0

  while (i < input.length) {
    const linkStart = input.indexOf(':link[', i)

    if (linkStart === -1) {
      result.push(input.slice(i))
      break
    }

    result.push(input.slice(i, linkStart + 6)) // up to and including ':link['
    i = linkStart + 6

    let depth = 1

    while (i < input.length) {
      const ch = input[i]!

      if (ch === '[') {
        depth++
        result.push(BRACKET_OPEN_ESCAPE)
        i++
      } else if (ch === ']') {
        depth--

        if (depth === 0) {
          result.push(']') // outer closing bracket — keep unescaped for remark
          i++
          break
        } else {
          result.push(BRACKET_CLOSE_ESCAPE)
          i++
        }
      } else if (ch === ':') {
        // Escape colons so remark does not interpret partial segments (e.g. `CustomField:Order`)
        // as text directives. Decoded back to `:` in convertLinkDirective.
        result.push(COLON_ESCAPE)
        i++
      } else {
        result.push(ch)
        i++
      }
    }
  }

  return result.join('')
}
// ─── Step 1b: [Type:Name] shorthand expansion ─────────────────────────────────

/**
 * Matches `[Type:Name]` shorthand placeholders for the known SMS placeholder types only,
 * and only when NOT preceded by `="` (inside a directive attribute value).
 *
 * The negative lookbehind for `="` prevents `[CustomField:Name]` tokens inside
 * `original="..."` attribute values from being expanded a second time.
 * `:link[…]` label content is protected separately by `escapeLinkLabelBrackets`.
 */
const SHORTHAND_PLACEHOLDER_RE = /(?<!=")(\[(CustomField|Subscriber|User|RemoteContent|Date|Link):([^\]]+)\])/g

/**
 * Convert `[Type:Name]` shorthand tokens to `::placeholder{...}` directive syntax
 * so they are handled uniformly by the remark-directive pipeline.
 *
 * Colons in attribute values are escaped with COLON_ESCAPE to prevent
 * remark-directive from interpreting `:Name` sequences inside attribute values as inline
 * text directives. `convertLeafPlaceholder` decodes them back to `:`.
 *
 * @internal
 */
function expandPlaceholderShorthand(input: string): string {
  return input.replace(SHORTHAND_PLACEHOLDER_RE, (_, full: string, rawType: string, name: string) => {
    const escapedFull = full.replace(/:/g, COLON_ESCAPE)
    const escapedName = name.replace(/:/g, COLON_ESCAPE)

    return `::placeholder{type="${rawType}" original="${escapedFull}" name="${escapedName}" value=""}`
  })
}

// ─── Step 2: Convert bare \n (within a paragraph) to \\n (remark hard break) ─

/**
 * Convert lone `\n` (not part of `\n\n`) to `\\\n` so that remark produces
 * `break` (hardbreak) nodes rather than treating them as soft line wraps.
 *
 * Strategy: split on `\n\n` (paragraph boundaries), replace `\n` with `\\\n`
 * in each segment, then rejoin with `\n\n`.
 *
 * @internal
 */
function normalizeHardbreaks(input: string): string {
  const segments = input.split('\n\n')

  return segments.map((segment) => segment.replace(/\n/g, '\\\n')).join('\n\n')
}

// ─── Step 3: MDAST → SmsContentJson conversion ───────────────────────────────

interface ConvertCtx {
  nodes: SmsTopLevelNode[]
  buffer: string
}

function flushBuffer(ctx: ConvertCtx): void {
  if (ctx.buffer.length > 0) {
    ctx.nodes.push({ type: 'message', text: ctx.buffer })
    ctx.buffer = ''
  }
}

/** @internal */
function convertDoc(ast: Root): SmsContentJson {
  const ctx: ConvertCtx = { nodes: [], buffer: '' }

  for (let i = 0; i < ast.children.length; i++) {
    const block = ast.children[i]!

    // Paragraph boundaries become a single \n in the message text stream
    if (i > 0) {
      ctx.buffer += '\n'
    }

    if (block.type === 'paragraph') {
      for (const child of (block as Paragraph).children) {
        convertInlineNode(child, ctx)
      }
    } else if (block.type === 'leafDirective') {
      // A ::placeholder{...} or ::unsubscribe that ended up at block level
      // (not tokenized by preprocessMarkdown because it was the only thing on its line)
      const d = block as unknown as LeafDirective

      if (d.name === 'placeholder') {
        flushBuffer(ctx)
        ctx.nodes.push(convertLeafPlaceholder((d.attributes ?? {}) as Record<string, string | null | undefined>))
      } else if (d.name === 'unsubscribe') {
        flushBuffer(ctx)
        ctx.nodes.push(...convertUnsubscribeDirective())
      }
    }
  }

  flushBuffer(ctx)

  return { type: 'sms', content: ctx.nodes }
}

/**
 * Convert a single MDAST phrasing content node, mutating `ctx` in place.
 * @internal
 */
function convertInlineNode(node: PhrasingContent, ctx: ConvertCtx): void {
  const type = node.type as string

  switch (type) {
    case 'text': {
      const textNode = node as unknown as { type: string; value: string }

      if (textNode.value.includes(ATOM_TOKEN_DELIMITER)) {
        expandAtomTokens(textNode.value, ctx)
      } else if (textNode.value.length > 0) {
        ctx.buffer += textNode.value
      }

      break
    }

    case 'break': {
      ctx.buffer += '\n'
      break
    }

    case 'textDirective': {
      const d = node as unknown as TextDirective

      if (d.name === 'link') {
        flushBuffer(ctx)
        ctx.nodes.push(convertLinkDirective(d))
      }

      break
    }

    case 'leafDirective': {
      const d = node as unknown as LeafDirective

      if (d.name === 'placeholder') {
        flushBuffer(ctx)
        ctx.nodes.push(convertLeafPlaceholder((d.attributes ?? {}) as Record<string, string | null | undefined>))
      } else if (d.name === 'unsubscribe') {
        flushBuffer(ctx)
        ctx.nodes.push(...convertUnsubscribeDirective())
      }

      break
    }
  }
}

/**
 * Convert a `:link[url]{track shorten}` textDirective into an `SmsLinkNode`.
 * The URL is read from the label (node children text). `href` is accepted but
 * ignored — kept for backward compat with content serialised before this change.
 * @internal
 */
function convertLinkDirective(node: TextDirective): SmsLinkNode {
  const raw = (node.attributes ?? {}) as Record<string, string | null | undefined>

  // Read URL from the label (first child text node), fall back to href.
  // Decode PUA-escaped brackets back to [ and ] (introduced by escapeLinkLabelBrackets).
  const labelText = node.children
    .map((c) => ('value' in c ? (c as { value: string }).value : ''))
    .join('')
    .replace(new RegExp(BRACKET_OPEN_ESCAPE, 'g'), '[')
    .replace(new RegExp(BRACKET_CLOSE_ESCAPE, 'g'), ']')
    .replace(new RegExp(COLON_ESCAPE, 'g'), ':')
  const url = labelText || raw['href'] || ''

  if (!url) {
    throw new RcmlValidationError([], ':link directive has no URL — provide a non-empty label: :link[https://…]{…}')
  }

  return {
    type: 'link',
    text: url,
    attrs: {
      track: raw['track'] !== 'false',
      shorten: raw['shorten'] !== 'false',
    },
  }
}

/**
 * Expand `::unsubscribe` into the two-node unsubscribe footer pair.
 * @internal
 */
function convertUnsubscribeDirective(): [SmsMessageNode, SmsPlaceholderNode] {
  return [
    { type: 'message', text: '[Subscriber:unsubscribe_text]', attrs: { 'is-unsubscribe': true } },
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

/** @internal */
function convertLeafPlaceholder(raw: Record<string, string | null | undefined>): SmsPlaceholderNode {
  const get = (key: string): string | undefined => {
    const v = raw[key]

    return v == null || v === '' ? undefined : v
  }

  // Decode COLON_ESCAPE back to ':' for values that went through expandPlaceholderShorthand
  const decodeColons = (s: string): string => s.replace(new RegExp(COLON_ESCAPE, 'g'), ':')

  const node: SmsPlaceholderNode = {
    type: 'placeholder',
    attrs: {
      type: (raw['type'] ?? 'Subscriber') as SmsPlaceholderType,
      original: decodeColons(raw['original'] ?? ''),
      name: decodeColons(raw['name'] ?? ''),
      value: coerceAttrValue(raw['value']),
    },
  }

  const maxLength = get('max-length')

  if (maxLength !== undefined) {
    node.attrs['max-length'] = maxLength
  }

  return node
}

// ─── PUA atom token expansion ─────────────────────────────────────────────────

/**
 * Expand PUA-tokenized inline atoms (produced by `preprocessMarkdown`) inside
 * a plain text string, appending text to the buffer and flushing for placeholders.
 * @internal
 */
function expandAtomTokens(text: string, ctx: ConvertCtx): void {
  const parts = text.split(ATOM_TOKEN_DELIMITER)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i] ?? ''

    if (i % 2 === 0) {
      if (part.length > 0) {
        ctx.buffer += part
      }
    } else {
      // Token: "name{ATOM_TOKEN_SEPARATOR}rawAttrs"
      const sepIdx = part.indexOf(ATOM_TOKEN_SEPARATOR)
      const name = sepIdx >= 0 ? part.slice(0, sepIdx) : part
      const attrsStr = sepIdx >= 0 ? part.slice(sepIdx + 1) : ''

      if (name === 'placeholder') {
        const rawAttrs = parseTokenAttrs(attrsStr)

        flushBuffer(ctx)
        ctx.nodes.push(convertLeafPlaceholder(rawAttrs))
      } else if (name === 'unsubscribe') {
        flushBuffer(ctx)
        ctx.nodes.push(...convertUnsubscribeDirective())
      }
    }
  }
}

/** Parse `key="val"` pairs from a PUA token attr string. @internal */
function parseTokenAttrs(attrsStr: string): Record<string, string | undefined> {
  const decoded = attrsStr.replace(new RegExp(COLON_ESCAPE, 'g'), ':')
  const result: Record<string, string | undefined> = {}
  // Match key="val" allowing \" escapes inside quoted values, or bare non-whitespace tokens.
  const re = /([\w-]+)=(?:"((?:[^"\\]|\\.)*)"|(\S+))/g
  let m: RegExpExecArray | null

  while ((m = re.exec(decoded)) !== null) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const raw = m[2] !== undefined ? m[2] : m[3]
    // Unescape \" → " and \\ → \ for quoted values

    result[m[1] as string] = m[2] !== undefined ? raw!.replace(/\\"/g, '"').replace(/\\\\/g, '\\') : raw
  }

  return result
}

// ─── Attr value coercion ──────────────────────────────────────────────────────

/**
 * Coerce a directive attribute value:
 * - Missing, null, or empty string → `null`
 * - Numeric string → number
 * - Everything else → string as-is
 */
function coerceAttrValue(raw: string | null | undefined): string | number | null {
  if (raw == null || raw === '') return null

  const n = Number(raw)

  if (raw.trim() !== '' && !Number.isNaN(n)) return n

  return raw
}

// ─── Public entry point ───────────────────────────────────────────────────────

/**
 * Parse an SMS RFM string into an {@link SmsContentJson} document.
 *
 * Accepts both:
 * - `:link[url]{track shorten}` directive syntax (`href` accepted for backward compat)
 * - `::placeholder{type original name value}` directive syntax
 * - `[Type:Name]` shorthand (backward-compatible)
 * - Bare `\n` within a paragraph (backward-compatible; becomes `\n` in message text)
 * - `\\\n` (backslash + newline; standard markdown hard break)
 *
 * Throws {@link RcmlValidationError} if the input contains unsupported constructs.
 *
 * @internal — called by the public `smsRfmToJson` wrapper.
 */
export function parseSmsRfm(input: string): SmsContentJson {
  if (input === '') {
    return { type: 'sms', content: [] }
  }

  // Step 0: tokenize ::unsubscribe before normalizeHardbreaks so the \n
  // that may precede it is not converted to a markdown hard-break escape.
  const unsubscribeTokenized = tokenizeUnsubscribeDirective(input)

  // Step 1a: escape brackets inside :link[…] labels so their content is not rewritten by shorthand expansion.
  const linkLabelsEscaped = escapeLinkLabelBrackets(unsubscribeTokenized)

  // Step 1b: expand [Type:Name] shorthand to ::placeholder{...} directive syntax
  const expanded = expandPlaceholderShorthand(linkLabelsEscaped)

  // Step 2: convert bare \n to \\\n so remark produces break nodes (preserves \n\n boundaries)
  const hardbreaksNormalized = normalizeHardbreaks(expanded)

  // Step 3: tokenize inline ::placeholder atoms so remark sees them as text
  const preprocessed = preprocessMarkdown(hardbreaksNormalized)

  // Step 4: parse with unified + remark-directive
  const { ast } = parse(preprocessed, { position: false })

  // Step 5: validate against SMS RFM flavor
  const validation = validate(ast, smsRfmConfig)

  if (!validation.valid) {
    throw new RcmlValidationError(validation.errors, formatErrors(validation) ?? 'Validation failed')
  }

  // Step 6: convert MDAST → SmsContentJson
  return convertDoc(ast)
}
