/**
 * Internal: build-time issue codes + error class for the SMS document factory.
 */

import { SmsTagNamesEnum } from '../schema/index.js'

export const SmsDocumentBuildErrorCodes = {
  STRUCTURE_INVALID: 'STRUCTURE_INVALID',
  CONTENT_INVALID: 'CONTENT_INVALID',
  CONTENT_REQUIRED: 'CONTENT_REQUIRED',
  ID_INVALID: 'ID_INVALID',
} as const

export type SmsDocumentBuildErrorCode =
  (typeof SmsDocumentBuildErrorCodes)[keyof typeof SmsDocumentBuildErrorCodes]

export interface SmsDocumentBuildIssue {
  code: SmsDocumentBuildErrorCode
  path: string
  message: string
}

/**
 * Thrown by {@link createSmsDocument} when the supplied options violate the
 * SMS document schema (invalid content, missing content).
 */
export class SmsDocumentBuildError extends Error {
  readonly tagName: typeof SmsTagNamesEnum.Sms
  readonly issues: readonly SmsDocumentBuildIssue[]

  constructor(issues: readonly SmsDocumentBuildIssue[]) {
    const summary = issues.length === 1 ? issues[0]!.message : `${issues.length} issues`

    super(`Cannot build <${SmsTagNamesEnum.Sms}>: ${summary}`)
    this.name = 'SmsDocumentBuildError'
    this.tagName = SmsTagNamesEnum.Sms
    this.issues = issues
  }
}

/** Throw helper — builds the error only when `issues` is non-empty. */
export function throwIfSmsIssues(issues: readonly SmsDocumentBuildIssue[]): void {
  if (issues.length > 0) throw new SmsDocumentBuildError(issues)
}
