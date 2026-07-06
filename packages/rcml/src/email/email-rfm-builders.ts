/**
 * String builders for Email RFM leaf-directives.
 *
 * Each helper returns an Email RFM source string — the wire format that the
 * templates compiler passes through as literal text, and that the downstream
 * RFM parser later understands as a directive node.
 *
 * Intended consumption: build atom strings once per render, pass them into
 * `compileTemplate`'s `data` object, reference from copy entries via a
 * single `{{slot}}` substitution. Keeps copy readable — e.g.
 * `'Hi {{firstNameCustomField}}!'` instead of a full `::placeholder{…}`
 * atom inlined into the message body.
 *
 * These builders produce raw strings; no validation happens here. The
 * downstream Email RFM parser (see `./email-rfm-to-json.ts`) validates directive shapes
 * when the compiled XML is parsed to RCML.
 *
 * @public
 */

/**
 * Build a `::placeholder{type="CustomField" …}` directive string.
 *
 * The atom's `name=` attribute is `group.name` joined with a dot; the
 * `original=` attribute follows the canonical `[CustomField:<id>]` form.
 */
export function createCustomField(opts: {
  group: string
  name: string
  id: number
}): string {
  const fullName = opts.group ? `${opts.group}.${opts.name}` : opts.name

  return `::placeholder{type="CustomField" name="${fullName}" value="${opts.id}" original="[CustomField:${opts.id}]"}`
}

/**
 * Build a `::loop-value{…}` directive string.
 *
 * `original=` follows the canonical `[LoopValue:<key>]` form. `index=`
 * defaults to `key` when omitted — matches every existing usage.
 */
export function createLoopValue(opts: {
  key: string
  index?: string
}): string {
  const index = opts.index ?? opts.key;

  return `::loop-value{original="[LoopValue:${opts.key}]" value="${opts.key}" index="${index}"}`;
}

/**
 * Build a `:link[label]{…}` inline directive string.
 *
 * `label` may itself be another atom string (e.g. the output of
 * {@link createFont}) to support nested composition like font-inside-link.
 */
export function createLink(opts: {
  label: string
  href: string
  target?: string
  noTracked?: boolean
}): string {
  const attrs: string[] = [`href="${opts.href}"`];

  if (opts.target !== undefined) attrs.push(`target="${opts.target}"`);

  if (opts.noTracked) attrs.push(`no-tracked="true"`);

  return `:link[${opts.label}]{${attrs.join(' ')}}`;
}

/**
 * Build a `:font[content]{…}` inline directive string.
 *
 * Style options map to their kebab-cased Email RFM attribute names
 * (`fontSize` → `font-size`, `textDecoration` → `text-decoration`, etc.).
 * `content` may itself be another atom string for nested composition.
 */
export function createFont(opts: {
  content: string
  fontSize?: string
  color?: string
  textDecoration?: string
  fontFamily?: string
  fontWeight?: string
  fontStyle?: string
  letterSpacing?: string
  lineHeight?: string
  textTransform?: string
}): string {
  const attrs: string[] = []

  if (opts.fontSize !== undefined) attrs.push(`font-size="${opts.fontSize}"`);

  if (opts.color !== undefined) attrs.push(`color="${opts.color}"`);

  if (opts.textDecoration !== undefined) attrs.push(`text-decoration="${opts.textDecoration}"`);

  if (opts.fontFamily !== undefined) attrs.push(`font-family="${opts.fontFamily}"`);

  if (opts.fontWeight !== undefined) attrs.push(`font-weight="${opts.fontWeight}"`);

  if (opts.fontStyle !== undefined) attrs.push(`font-style="${opts.fontStyle}"`);

  if (opts.letterSpacing !== undefined) attrs.push(`letter-spacing="${opts.letterSpacing}"`);

  if (opts.lineHeight !== undefined) attrs.push(`line-height="${opts.lineHeight}"`);

  if (opts.textTransform !== undefined) attrs.push(`text-transform="${opts.textTransform}"`);

  return `:font[${opts.content}]{${attrs.join(' ')}}`;
}
