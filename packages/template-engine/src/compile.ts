/**
 * Top-level orchestrator for `@rule/template-engine`.
 *
 * Invokes the compile phases from spec §9:
 * 1. tokenise template
 * 2. parse template AST
 * 3. parse expression AST (interleaved with 2 via the expression sub-parser)
 * 4. evaluate structural directives (`<?if?>` / `<?for?>`)
 * 5. resolve `<?copy?>` directives
 * 6. resolve `@{…}` attribute bindings
 * 7. serialise XML
 *
 * Everything runs synchronously against caller-supplied inputs; no
 * I/O, no global state, no async work.
 *
 * @public
 */

import type { EvalScope } from './expression/evaluator.js'
import { defaultTemplateRefSerializer } from './refs/serializer.js'
import { evaluate } from './template/evaluator.js'
import { tokeniseTemplate } from './template/lexer.js'
import { parseTemplate } from './template/parser.js'
import type {
  CompileTemplateOptions,
  CompileTemplateResult,
} from './types.js'

/**
 * Compile an XML template with `<?if?>` / `<?for?>` control flow,
 * `<?copy?>` localized-text directives, and `@{…}` attribute
 * bindings against the supplied `copy` and `context`.
 *
 * See `docs/template-syntax.md` for the full v3 specification.
 *
 * @public
 */
export function compileTemplate<
  TCopy = Record<string, unknown>,
  TContext = Record<string, unknown>,
>(
  options: CompileTemplateOptions<TCopy, TContext>,
): CompileTemplateResult {
  const { template, copy, context } = options
  const serializer = options.serializer ?? defaultTemplateRefSerializer

  // Phase 1 — tokenise
  const tokens = tokeniseTemplate({ source: template })

  // Phases 2 + 3 — parse template AST (expression AST is built via
  // the expression sub-parser on demand for conditions, `<?copy?>`
  // param values, and `@{…}` binding bodies).
  const nodes = parseTemplate(tokens, { source: template })

  // Phases 4–7 — evaluate + serialise. The outermost scope frame is
  // `context` itself — unqualified expression paths (`user.premium`)
  // resolve against it directly, and `<?for?>` loop bindings push
  // inner frames that shadow keys with the same name.
  const rootScope = ((context ?? {}) as unknown) as EvalScope
  const xml = evaluate(nodes, [rootScope], {
    source: template,
    messages: copy,
    serializer,
  })

  return { xml }
}
