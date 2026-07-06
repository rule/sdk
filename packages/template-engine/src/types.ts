/**
 * Public type surface for `@rule/template-engine` v3.
 *
 * See `docs/template-syntax.md` for the full syntax specification.
 *
 * @public
 */

import type { TemplateRefSerializer } from './refs/types.js'

/**
 * Options accepted by {@link compileTemplate}.
 *
 * The compiler is pure and synchronous: it never reads from disk or
 * the network. Callers assemble the full compilation context up front
 * and pass it in.
 *
 * @public
 */
export interface CompileTemplateOptions<
  TCopy = Record<string, unknown>,
  TContext = Record<string, unknown>,
> {
  /**
   * Raw template source — XML with `<?copy?>` PIs for localized text,
   * `@{expr}` bindings inside attribute values, and `<?if?>` / `<?for?>`
   * Processing-Instruction control-flow blocks (v3). No root element
   * required; the source may contain a sequence of sibling elements
   * and directives.
   */
  readonly template: string

  /**
   * Resolved message tree. Nested objects whose leaves are strings.
   * Leaf strings may contain `{{paramName}}` placeholders that get
   * substituted by the params supplied to a particular
   * `<?copy key p1=expr …?>` PI.
   */
  readonly copy: TCopy

  /**
   * Context referenced by `@{…}` attribute bindings, by condition
   * expressions (`<?if user.premium?>`), and by `<?copy?>` param
   * values. Top-level keys of this object become the outermost scope
   * frame — no prefix needed to reference them. `<?for?>` loop
   * variables shadow same-named keys (standard lexical scoping).
   * Plain serialisable object — no functions, classes, promises,
   * getters or proxies.
   */
  readonly context: TContext

  /**
   * Optional custom serializer for `TemplateRef` values encountered
   * at a renderable position (`<?copy?>` param, `@{…}` binding). If
   * omitted, the default serializer emits Rule.io RFM placeholder
   * strings (`defaultTemplateRefSerializer`).
   */
  readonly serializer?: TemplateRefSerializer
}

/**
 * Result of a successful {@link compileTemplate} call.
 *
 * @public
 */
export interface CompileTemplateResult {
  /** The compiled XML string. */
  readonly xml: string
}
