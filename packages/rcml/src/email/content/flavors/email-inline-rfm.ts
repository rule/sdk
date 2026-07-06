import { type ZodType } from 'zod'

import { FontAttrsSchema } from '../schemas/font.js'
import { LinkAttrsSchema } from '../schemas/link.js'
import { PlaceholderAttrsSchema } from '../schemas/placeholder.js'
import { LoopValueAttrsSchema } from '../schemas/loop-value.js'
import type { FlavorConfig } from './types.js'

/**
 * Flavor configuration for Email Inline RFM content.
 *
 * A strict subset of Email RFM: only paragraphs, `:font`, `:link`,
 * `::placeholder`, `::loop-value`. No lists, hard breaks, or `:::align`.
 *
 * Used by label fields (button labels, etc.) inside the template in the editor.
 *
 * @internal
 */
export const emailInlineRfmConfig: FlavorConfig = {
  name: 'Email Inline RFM',

  allowedBlockNodes: new Set(),

  allowedTextDirectives: new Map<string, ZodType | null>([
    ['font', FontAttrsSchema],
    ['link', LinkAttrsSchema],
  ]),

  allowedLeafDirectives: new Map<string, ZodType | null>([
    ['placeholder', PlaceholderAttrsSchema],
    ['loop-value', LoopValueAttrsSchema],
  ]),

  allowedContainerDirectives: new Map<string, ZodType | null>(),

  singleParagraph: true,
}
