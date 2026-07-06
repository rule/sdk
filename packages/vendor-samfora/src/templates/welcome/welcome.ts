/**
 * Samfora welcome template factory.
 *
 * Thin wrapper over {@link createEmailTemplate} from `@rule/rcml`.
 * Sent when a new donor creates a Samfora account. Default copy is
 * Swedish; pass `copy: { ... }` at render time to localise.
 *
 * Vendor-prefixed in the public surface to avoid collision with
 * vendor-shopify's `createWelcomeTemplate`.
 */

import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
} from '@rule/template-engine'
import type { CustomFieldRef } from '@rule/template-engine'

export interface SamforaWelcomeTemplateContext {
  recipient: {
    firstName: CustomFieldRef
  }
  /** URL the CTA button links to. */
  websiteUrl: string
  footer: {
    fontSize: string
    textColor: string
  }
}

export interface SamforaWelcomeTemplateCopy {
  readonly preheader: string
  readonly greetingHeading: string
  readonly intro: string
  readonly listHeading: string
  readonly stepOne: string
  readonly stepTwo: string
  readonly stepThree: string
  readonly ctaButton: string
  readonly signOff: string
  readonly footerLinks: string
  readonly certifiedByRule: string
}

export type SamforaWelcomeRenderOptions =
  EmailTemplateRenderArgs<SamforaWelcomeTemplateCopy, SamforaWelcomeTemplateContext>

export type SamforaWelcomeTemplate =
  EmailTemplate<SamforaWelcomeTemplateCopy, SamforaWelcomeTemplateContext>

export function createSamforaWelcomeTemplate(): SamforaWelcomeTemplate {
  return createEmailTemplate<SamforaWelcomeTemplateCopy, SamforaWelcomeTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './welcome.xml',
    copyPath: './welcome-copy.json',
  })
}
