import { z } from 'zod'

/**
 * Attribute schema for the `::placeholder` leaf directive in SMS RFM.
 *
 * @internal
 */
export const SmsPlaceholderAttrsSchema = z
  .object({
    type: z.enum(['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date', 'Link']),
    original: z.string(),
    name: z.string().min(1, { message: '::placeholder name must not be empty' }),
    value: z.string().optional(),
    'max-length': z.string().optional(),
  })
  .strict()
