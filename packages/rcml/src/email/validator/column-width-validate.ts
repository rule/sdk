/**
 * Internal: cross-element column-width validation.
 *
 * When a container (an `rc-section` directly, or the `rc-group` inside it)
 * holds more than one `rc-column` and every column carries a percentage
 * `width`, this pass checks that the widths sum to 100 %. Single-column
 * containers are left untouched. Columns with a missing or non-percentage
 * width (e.g. `200px`) are skipped — those values are individually valid
 * per the published schema (`validator: V.PxOrPercentage`, width is
 * optional for single-column). Only when all columns in a multi-column
 * container are percentage-valued is the sum enforced.
 *
 * `rc-group` is a non-responsive wrapper: its columns visually belong to
 * the same section row (they just don't stack on mobile), so the
 * width-sum invariant applies inside it exactly as it does directly
 * under `rc-section`. The SDK currently permits at most one `rc-group`
 * per section (see `createSectionElement`); this file validates that
 * group as a single independent container.
 */

import {
  EmailTemplateErrorCodes,
  type EmailTemplateValidationIssue,
} from '../validate-email-template.js'

const PCT_RE = /^(\d+(?:\.\d+)?)%$/

/**
 * Walk `doc` and emit `ATTR_INVALID_VALUE` issues for any multi-column
 * section where all columns carry percentage widths that do not sum to 100 %.
 * Columns with absent or non-percentage widths are not flagged here — those
 * are covered by the AJV structural pass and the per-attribute Zod pass.
 *
 * @param doc - Any value (expected to be an {@link import('../rcml-types.js').RcmlDocument}-shaped tree).
 * @returns A list of `ATTR_INVALID_VALUE` issues (empty on success).
 */
export function validateColumnWidths(doc: unknown): EmailTemplateValidationIssue[] {
  const issues: EmailTemplateValidationIssue[] = []

  visitNode(doc, '', issues)

  return issues
}

function visitNode(node: unknown, path: string, issues: EmailTemplateValidationIssue[]): void {
  if (!isObj(node)) return

  if (node.tagName === 'rc-section') {
    const children: unknown[] = Array.isArray(node.children) ? node.children : []

    // Container 1: columns directly under the section.
    const directColumns: unknown[] = children.filter(
      (c) => isObj(c) && c.tagName === 'rc-column',
    )

    checkAndReport(directColumns, `${path}/children`, 'section', issues)

    // Container 2: columns inside an rc-group (SDK allows <=1 group per
    // section). If a group is present, its columns form an independent
    // container with the same width-sum invariant.
    children.forEach((c, i) => {
      if (!isObj(c) || c.tagName !== 'rc-group') return

      const groupChildren: unknown[] = Array.isArray(c.children) ? c.children : []
      const groupColumns: unknown[] = groupChildren.filter(
        (gc) => isObj(gc) && gc.tagName === 'rc-column',
      )

      checkAndReport(
        groupColumns,
        `${path}/children/${String(i)}/children`,
        'rc-group',
        issues,
      )
    })
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child: unknown, i: number) => {
      visitNode(child, `${path}/children/${i}`, issues)
    })
  }
}

function checkAndReport(
  columns: unknown[],
  containerPath: string,
  containerName: 'section' | 'rc-group',
  issues: EmailTemplateValidationIssue[],
): void {
  if (columns.length <= 1) return

  let sum = 0
  let allPercentage = true

  for (const col of columns) {
    const width =
      isObj(col) && isObj(col.attributes) ? (col.attributes.width as unknown) : undefined
    const m = typeof width === 'string' ? PCT_RE.exec(width) : null

    if (!m) {
      allPercentage = false
      break
    }

    sum += parseFloat(m[1])
  }

  if (allPercentage && Math.abs(sum - 100) > 0.5) {
    const displaySum = parseFloat(sum.toFixed(2))

    issues.push({
      path: containerPath,
      code: EmailTemplateErrorCodes.ATTR_INVALID_VALUE,
      message: `Column widths in this ${containerName} sum to ${displaySum}% but must sum to 100%.`,
    })
  }
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}
