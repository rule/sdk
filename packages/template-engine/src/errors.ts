/**
 * Error surface for `@rule/template-engine`.
 *
 * @public
 */

import { makeCodeFrame } from './source/frame.js'
import type { SourceLoc } from './source/loc.js'

/**
 * Thrown by {@link compileTemplate} on any tokenisation, parse, or
 * evaluation failure.
 *
 * The `message` field carries a prefixed, caret-marked string of
 * the form `[sourcePath:]line:col: message\n<code frame>`, suitable
 * for showing directly in a terminal or log. The individual
 * components (`line`, `column`, `sourcePath`, `frame`) are also
 * exposed as own properties for programmatic consumers.
 *
 * @public
 */
export class TemplateCompileError extends Error {
  /** One-based line number of the offending token. */
  readonly line: number
  /** One-based column of the offending token within its line. */
  readonly column: number
  /** Optional source path passed to the compiler. Surfaces in the prefix. */
  readonly sourcePath?: string
  /** Pretty-printed code frame with a caret under the offending column. */
  readonly frame?: string

  /**
   * @param message - Short human-readable description of what went
   *   wrong. Becomes the tail of the thrown Error message.
   * @param loc - Location of the offending token; used both for the
   *   message prefix and to position the caret in the code frame.
   * @param source - Full template source — needed to render the
   *   frame's surrounding lines.
   * @param sourcePath - Optional file path. When provided, prefixes
   *   the message with `${sourcePath}:line:col:` (editor-clickable
   *   form).
   */
  constructor(
    message: string,
    loc: SourceLoc,
    source: string,
    sourcePath?: string,
  ) {
    const prefix = sourcePath !== undefined
      ? `${sourcePath}:${String(loc.line)}:${String(loc.column)}`
      : `${String(loc.line)}:${String(loc.column)}`
    const frame = makeCodeFrame(source, loc)

    super(`${prefix}: ${message}\n${frame}`)
    this.name = 'TemplateCompileError'
    this.line = loc.line
    this.column = loc.column
    this.frame = frame

    if (sourcePath !== undefined) this.sourcePath = sourcePath
  }
}
