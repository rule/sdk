import { z } from 'zod'

/**
 * Attribute schema for the `:link` text directive in SMS RFM.
 * `href` is required; `track` and `shorten` are required boolean strings.
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
