/**
 * `createEmailTemplate` — bundle the standard email-template render
 * pipeline into a single reusable factory.
 *
 * Captures four template-agnostic concerns:
 *
 * 1. Load the XML template + JSON copy at construction (via
 *    `loadTemplate` / `loadCopy` from `@rule/template-engine`).
 * 2. Merge the caller-supplied copy override into the default copy.
 * 3. Project theme-driven context fields into the compile context so
 *    the XML's structural guards can see them:
 *      - `logoUrl` ← `theme.images.logo?.url`
 *      - `socialLinks` ← `Object.values(theme.links)` (undefined when
 *        the theme has no social slots populated)
 * 4. Compile, parse to RCML, apply the theme.
 *
 * The only template-specific pieces are the file paths and the two
 * generics (`TCopy`, `TContext`). Vendor factories collapse to:
 *
 * ```ts
 * export function createAbandonedCartTemplate() {
 *   return createEmailTemplate<AbandonedCartCopy, AbandonedCartContext>({
 *     baseUrl: import.meta.url,
 *     templatePath: './abandoned-cart.xml',
 *     copyPath: './abandoned-cart-copy.json',
 *   })
 * }
 * ```
 *
 * @public
 */

import type { EmailTheme, RcmlDocument } from '@rule/rcml'
import { applyTheme, xmlToRcml } from '@rule/rcml'

import { compileTemplate } from './compile.js'
import { loadCopy } from './load-copy.js'
import { loadTemplate } from './load-template.js'
import type { TemplateRefSerializer } from './refs/types.js'

/**
 * Arguments to the renderer returned by {@link createEmailTemplate}.
 *
 * @public
 */
export interface EmailTemplateRenderArgs<TCopy, TContext> {
  /** Caller-supplied typed context (refs + optional sub-objects). */
  readonly context: TContext
  /**
   * Theme applied to the compiled RCML. Also projected into the
   * compile context: `theme.images.logo?.url` → `logoUrl`, and
   * `Object.values(theme.links)` → `socialLinks` (undefined when
   * empty).
   */
  readonly theme: EmailTheme
  /**
   * Partial override of the bundled default copy. Entries not
   * supplied fall back to the defaults loaded from the copy JSON.
   */
  readonly copy?: Partial<TCopy>
  /**
   * Optional custom `TemplateRef` serializer. Defaults to the RFM
   * serializer shipped with `@rule/template-engine`.
   */
  readonly serializer?: TemplateRefSerializer
}

/**
 * Opaque renderer bound to a specific XML template + JSON copy pair.
 *
 * @public
 */
export interface EmailTemplate<TCopy, TContext> {
  render(args: EmailTemplateRenderArgs<TCopy, TContext>): RcmlDocument
}

/**
 * Options for {@link createEmailTemplate}.
 *
 * @public
 */
export interface CreateEmailTemplateOptions {
  /** The calling module's `import.meta.url`. */
  readonly baseUrl: string
  /** Path to the XML template, resolved relative to `baseUrl`. */
  readonly templatePath: string
  /** Path to the JSON copy file, resolved relative to `baseUrl`. */
  readonly copyPath: string
}

/**
 * Build an {@link EmailTemplate} bound to an XML template + JSON copy
 * pair. The returned object's `render` method runs the full
 * compile → parse → apply-theme pipeline for each call.
 *
 * @public
 */
export function createEmailTemplate<TCopy, TContext>(
  opts: CreateEmailTemplateOptions,
): EmailTemplate<TCopy, TContext> {
  const template = loadTemplate(opts.baseUrl, opts.templatePath)
  const defaultCopy = loadCopy<TCopy>(opts.baseUrl, opts.copyPath)

  return {
    render({ context, theme, copy: copyOverride, serializer }) {
      const copy = { ...defaultCopy, ...copyOverride }
      const logoUrl = theme.images.logo?.url
      const themeSocials = Object.values(theme.links)
      const socialLinks = themeSocials.length > 0 ? themeSocials : undefined
      const { xml } = compileTemplate<TCopy, unknown>({
        template,
        copy,
        context: { ...(context as object), logoUrl, socialLinks },
        ...(serializer !== undefined ? { serializer } : {}),
      })

      return applyTheme(xmlToRcml(xml), theme)
    },
  }
}
