import { z } from 'zod'

/**
 * Attribute schema for the `:link` text directive in SMS RFM.
 * `href` is accepted for backward compatibility — the URL is read from the directive
 * label first, with `href` as a fallback when the label is empty.
 * `track` and `shorten` are required boolean strings.
 *
 * @internal
 */
export const SmsLinkAttrsSchema = z
  .object({
    href: z.string().optional(),
    track: z.enum(['true', 'false']),
    shorten: z.enum(['true', 'false']),
  })
  .strict()
