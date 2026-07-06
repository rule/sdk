/**
 * `@rule/template-engine` — minimal XML template compiler.
 *
 * See `docs/template-syntax.md` for the v3 specification and
 * `docs/typed-template-refs.md` for the TemplateRef rationale.
 *
 * Primary export: {@link compileTemplate}, a pure synchronous compiler
 * that accepts `{ template, copy, context }` and returns `{ xml }`.
 * All compilation happens in-process; no filesystem or network access.
 *
 * Typed template references (`TemplateRef`, `customField`, `loopValue`)
 * let callers pass descriptors instead of pre-rendered placeholder
 * strings; the compiler serializes them at render time through the
 * supplied (or default) {@link TemplateRefSerializer}.
 *
 * @public
 */

export { compileTemplate } from './compile.js'
export { loadCopy } from './load-copy.js'
export { loadTemplate } from './load-template.js'
export { TemplateCompileError } from './errors.js'
export type {
  CompileTemplateOptions,
  CompileTemplateResult,
} from './types.js'
export { CustomFieldRef, LoopValueRef, TemplateRefBase } from './refs/types.js'
export type { TemplateRef, TemplateRefSerializer } from './refs/types.js'
export { customField, loopValue } from './refs/factories.js'
export {
  defaultTemplateRefSerializer,
  isTemplateRef,
  serializeRef,
} from './refs/serializer.js'
export {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
  type CreateEmailTemplateOptions,
} from './create-email-template.js'
