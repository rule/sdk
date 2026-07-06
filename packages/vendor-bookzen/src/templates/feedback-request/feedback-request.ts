/**
 * Feedback-request template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 * Works for post-stay, post-purchase, or any review request.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

export interface FeedbackRequestTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  /** URL the CTA button links to (typically the feedback form). */
  feedbackUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

export interface FeedbackRequestTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly message: string
  readonly ctaButton: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type FeedbackRequestRenderOptions =
  EmailTemplateRenderArgs<FeedbackRequestTemplateCopy, FeedbackRequestTemplateContext>

export type FeedbackRequestTemplate =
  EmailTemplate<FeedbackRequestTemplateCopy, FeedbackRequestTemplateContext>

export function createFeedbackRequestTemplate(): FeedbackRequestTemplate {
  return createEmailTemplate<FeedbackRequestTemplateCopy, FeedbackRequestTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './feedback-request.xml',
    copyPath: './feedback-request-copy.json',
  })
}
