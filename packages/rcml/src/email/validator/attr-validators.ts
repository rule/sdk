/**
 * Internal: RCML attribute-value Zod validators.
 *
 * These schemas are the source of truth for attribute-value formats. The
 * generated JSON Schema (see `./json-schema.ts`) leaves per-attribute value
 * constraints loose; rich validation happens here via
 * `./attr-value-validate.ts`, which looks up a Zod schema for each attribute
 * by its {@link RcmlAttributeValidatorsEnum} key in
 * {@link RCML_ATTR_VALIDATORS}.
 */

import { type ZodSchema, z } from 'zod'

/** CSS hex color (`#fff`, `#ffffff`) or the keyword `'transparent'`. */
const colorSchema = z.string().refine(
  (val) => /^#[0-9a-fA-F]{3}$/.test(val) || /^#[0-9a-fA-F]{6}$/.test(val) || val === 'transparent',
  {
    message:
      "The value must be a valid hexadecimal color code (e.g., '#fff', '#FFF', '#ff0000', '#FF0000') or the keyword 'transparent'.",
  },
)

/** Number followed by `%`, or `0`. */
const percentageSchema = z.string().regex(/^(0|\d+(\.\d+)?%)$/, {
  message: "The value must be a valid percentage (e.g., '0', '10%', '12.5%').",
})

/** Number followed by `px`, or `0`. */
const pxSchema = z.string().regex(/^(0|\d+(\.\d+)?px)$/, {
  message: "The value must be a valid unit in pixels (e.g., '0', '10px', '12.5px').",
})

/** Literal `'auto'`. */
const autoSchema = z.literal('auto')

/** Pixel length or the keyword `'auto'`. */
const pxOrAutoSchema = z.union([pxSchema, autoSchema], {
  errorMap: () => ({ message: "The value must be a valid unit in pixels or 'auto'." }),
})

/** Pixel length or percentage. */
const pxOrPercentageSchema = z.union([pxSchema, percentageSchema], {
  errorMap: () => ({ message: 'The value must be a valid unit in pixels or a percentage.' }),
})

/** 1- or 2-value tuple of pixel lengths or percentages (used by background-size etc). */
const pxOrPercentageTwoValueArraySchema = z.union([
  z.tuple([pxOrPercentageSchema]),
  z.tuple([pxOrPercentageSchema, pxOrPercentageSchema]),
])

/** 1- to 4-value tuple of pixel lengths (used by padding shorthand). */
const pxFourValueArraySchema = z.union([
  z.tuple([pxSchema]),
  z.tuple([pxSchema, pxSchema]),
  z.tuple([pxSchema, pxSchema, pxSchema]),
  z.tuple([pxSchema, pxSchema, pxSchema, pxSchema]),
])

/** 1- to 4-value tuple of pixel lengths or percentages (used by border-radius shorthand). */
const pxOrPercentageFourValueArraySchema = z.union([
  z.tuple([pxOrPercentageSchema]),
  z.tuple([pxOrPercentageSchema, pxOrPercentageSchema]),
  z.tuple([pxOrPercentageSchema, pxOrPercentageSchema, pxOrPercentageSchema]),
  z.tuple([pxOrPercentageSchema, pxOrPercentageSchema, pxOrPercentageSchema, pxOrPercentageSchema]),
])

/** Any string. */
const stringSchema = z.string()

/** Any finite number. */
const numberSchema = z.number()

/** A string or a number. */
const stringOrNumberSchema = z.union([z.string(), z.number()])

/** Horizontal alignment enum. */
const alignSchema = z.enum(['left', 'center', 'right'], {
  errorMap: () => ({ message: "The value must be 'left', 'center', or 'right'." }),
})

/** Plain boolean. */
const booleanSchema = z.boolean()

/** CSS `background-repeat` — tile or single. */
const backgroundRepeatSchema = z.enum(['repeat', 'no-repeat'], {
  errorMap: () => ({ message: "The value must be 'repeat' or 'no-repeat'." }),
})

/**
 * CSS `background-size` — one or two values (pixel/percent), or one of the
 * keywords `auto`, `cover`, `contain`. Transforms the raw string into an
 * array of tokens before validating.
 */
const backgroundSizeSchema = z
  .string()
  .transform((val) => val.split(' '))
  .refine(
    (value) => {
      if (value.length === 1 || value.length === 2) {
        return (
          pxOrPercentageTwoValueArraySchema.safeParse(value).success ||
          (value.length === 1 && ['auto', 'cover', 'contain'].includes(value[0] as string))
        )
      }

      return false
    },
    {
      message:
        "The value must be either one or two valid units in pixels or percentage, or 'auto', 'cover' or 'contain'.",
    },
  )

/** Horizontal keyword for `background-position` (`left`/`right`/`center`). */
const backgroundPositionXKeywordSchema = z.enum(['left', 'right', 'center'], {
  errorMap: () => ({ message: "The value must be 'left' or 'right' for background position X." }),
})

/** Vertical keyword for `background-position` (`top`/`bottom`/`center`). */
const backgroundPositionYKeywordSchema = z.enum(['top', 'bottom', 'center'], {
  errorMap: () => ({ message: "The value must be 'top' or 'bottom' for background position Y." }),
})

/** Any background-position keyword — horizontal or vertical. */
const backgroundPositionKeywordSchema = z.union(
  [backgroundPositionXKeywordSchema, backgroundPositionYKeywordSchema],
  { errorMap: () => ({ message: "The value must be 'top', 'bottom', 'left', or 'right'." }) },
)

/** Valid 2-value `background-position` tuple (keyword/percent combinations). */
const backgroundPositionArraySchema = z.union([
  z.tuple([backgroundPositionKeywordSchema, backgroundPositionKeywordSchema]).refine(
    ([first, second]) => {
      if (first === 'center' && second === 'center') {
        return true
      }

      return first !== second
    },
    {
      message: 'The values cannot be both vertical (top, bottom) or both horizontal (left, right).',
    },
  ),
  z.tuple([percentageSchema, percentageSchema]),
  z
    .tuple([backgroundPositionKeywordSchema, percentageSchema])
    .refine(([first]) => ['left', 'right', 'center'].includes(first), {
      message: "The keyword must be 'left' or 'right', or 'center' when paired with a percentage.",
    }),
  z
    .tuple([percentageSchema, backgroundPositionKeywordSchema])
    .refine(([, second]) => ['top', 'bottom', 'center'].includes(second), {
      message: "The keyword must be 'top' or 'bottom', or 'center' when paired with a percentage.",
    }),
])

/** CSS `background-position` — space-separated 2-value string (`top center`, `50% 50%`, …). */
const backgroundPositionSchema = z
  .string()
  .transform((val: string) => val.split(' '))
  .refine((value) => backgroundPositionArraySchema.safeParse(value).success, {
    message: 'The value must be a valid 2-value syntax for background position.',
  })

/** Single-axis horizontal `background-position` value (keyword or percent). */
const backgroundPositionXSchema = z.union(
  [backgroundPositionXKeywordSchema, percentageSchema],
  {
    errorMap: () => ({
      message: "The value must be 'left', 'right', or a valid percentage for background position X.",
    }),
  },
)

/** Single-axis vertical `background-position` value (keyword or percent). */
const backgroundPositionYSchema = z.union(
  [backgroundPositionYKeywordSchema, percentageSchema],
  {
    errorMap: () => ({
      message: "The value must be 'top', 'bottom', or a valid percentage for background position Y.",
    }),
  },
)

/** CSS `border-style` keyword. */
const borderStyleSchema = z.enum(
  ['none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'],
  {
    errorMap: () => ({
      message:
        "The border style must be one of the following keywords: 'none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset'.",
    }),
  },
)

/** CSS global keywords accepted by `border`. */
const borderGlobalValuesSchema = z.enum(['inherit', 'initial', 'revert', 'revert-layer', 'unset'])

/** 2- or 3-value border tuple (width + style, optionally + color). */
const borderArraySchema = z.union([
  z.tuple([pxSchema, borderStyleSchema, colorSchema]),
  z.tuple([pxSchema, borderStyleSchema]),
])

/** Space-separated `border` shorthand (`1px solid #fff`, `2px dashed`, …). */
const borderShorthandSchema = z
  .string()
  .transform((val: string) => val.split(' '))
  .refine((value) => borderArraySchema.safeParse(value).success, {
    message:
      'The border shorthand property must be a valid combination of 2 to 3 values: border width, border style, and border color.',
  })

/**
 * CSS `border` — accepts the shorthand, a single width/style/color, or a
 * global CSS keyword (`inherit`, `initial`, `revert`, `revert-layer`, `unset`).
 */
const borderSchema = z.union(
  [borderShorthandSchema, pxSchema, borderStyleSchema, colorSchema, borderGlobalValuesSchema],
  {
    errorMap: () => ({
      message:
        "The border shorthand property must be a valid combination of 1 to 3 values: border width, border style, and border color, a single border width, border-color or border style, or a global value ('inherit', 'initial', 'revert', 'revert-layer', 'unset').",
    }),
  },
)

/** Space-separated `border-radius` shorthand (1–4 pixel or percent values). */
const borderRadiusSchema = z
  .string()
  .transform((val: string) => val.split(' '))
  .refine((value) => pxOrPercentageFourValueArraySchema.safeParse(value).success, {
    message:
      'The border radius property must be a valid combination of 1 to 4 values, each of which must be a valid unit in pixels or percents.',
  })

/** Text direction (`ltr`/`rtl`). */
const directionSchema = z.enum(['ltr', 'rtl'], {
  errorMap: () => ({ message: "The value must be 'ltr' or 'rtl'." }),
})

/** String boolean flag used by `fluid-on-mobile`. */
const fluidOnMobileSchema = z.enum(['true', 'false'], {
  errorMap: () => ({ message: "The value must be 'true' or 'false'." }),
})

/** CSS `font-family` string (single or comma-separated with fallback). */
const fontFamilySchema = z.string().refine(
  (val) => !/^"('[a-zA-Z0-9\s-]+')(,\s*[a-zA-Z-]+)?"$/.test(val),
  {
    message:
      'The value must be a valid font-family string, delimited by a comma. The first font name can be in single quotes or without, and the second font name should be a valid fallback font name.',
  },
)

/** CSS `font-style` keyword. */
const fontStyleSchema = z.enum(['normal', 'italic', 'oblique'], {
  errorMap: () => ({ message: "The value must be 'normal', 'italic', or 'oblique'." }),
})

/** Numeric `font-weight` — `100` through `900` as strings. */
const fontWeightSchema = z.enum(
  ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  { errorMap: () => ({ message: 'The value must be a valid font weight value between 100 and 900.' }) },
)

/** Section `full-width` flag — `full-width` or `false`. */
const fullWidthSchema = z.enum(['full-width', 'false'], {
  errorMap: () => ({ message: "The value must be 'full-width' or 'false'." }),
})

/** Section `hide` flag — hide on desktop or on mobile. */
const hideSectionSchema = z.enum(['desktop', 'mobile'], {
  errorMap: () => ({ message: "The value must be 'desktop', 'mobile' or null." }),
})

/** CSS `letter-spacing` — pixel or em value, allows negative. */
const letterSpacingSchema = z.string().regex(/^(-?\d+(\.\d+)?(px|em))$/, {
  message: "The value must be a valid unit in pixels or ems (e.g., '-10px', '10em', '-12.5em').",
})

/** Space-separated `padding` shorthand (1–4 pixel values). */
const paddingSchema = z
  .string()
  .transform((val: string) => val.split(' '))
  .refine((value) => pxFourValueArraySchema.safeParse(value).success, {
    message:
      'The padding shorthand property must be a valid combination of 1 to 4 values, each of which must be a valid unit in pixels.',
  })

/** `rc-social` layout mode. */
const socialModeSchema = z.enum(['horizontal', 'vertical'], {
  errorMap: () => ({ message: "The value must be 'horizontal' or 'vertical'." }),
})

/** Coloring strategy for `rc-social-element` icons. */
const socialIconColorSchema = z.enum(['brand', 'black', 'white'], {
  errorMap: () => ({ message: "The value must be 'brand', 'black', or 'white'." }),
})

/** Shape of `rc-social-element` icons. */
const socialIconShapeSchema = z.enum(['original', 'circle', 'square'], {
  errorMap: () => ({ message: "The value must be 'original', 'circle' or 'square'." }),
})

/**
 * Which social network an `rc-social-element` represents. Matches Rule's
 * backend `SocialNetworkEnum` — note `'web'` (not `'website'`) for the
 * website slot.
 */
const socialNetworkSchema = z.enum(['facebook', 'instagram', 'linkedin', 'tiktok', 'x', 'web'], {
  errorMap: () => ({
    message: "The value must be 'facebook', 'instagram', 'linkedin', 'tiktok', 'x', or 'web'.",
  }),
})

/** CSS `table-layout` keyword. */
const tableLayoutSchema = z.enum(['auto', 'fixed'], {
  errorMap: () => ({ message: "The value must be 'auto' or 'fixed'." }),
})

/** HTML anchor `target`. */
const targetSchema = z.enum(['_blank', '_self', '_parent', '_top'])

/** CSS `text-align` — includes `justify` unlike horizontal {@link alignSchema}. */
const textAlignSchema = z.enum(['left', 'center', 'right', 'justify'], {
  errorMap: () => ({ message: "The value must be 'left', 'center', 'right', or 'justify'." }),
})

/** CSS `text-decoration` keyword. */
const textDecorationSchema = z.enum(['none', 'underline', 'overline', 'line-through'], {
  errorMap: () => ({
    message: "The value must be 'none', 'underline', 'overline' or 'line-through'.",
  }),
})

/** CSS `text-transform` keyword. */
const textTransformSchema = z.enum(['capitalize', 'uppercase', 'lowercase'], {
  errorMap: () => ({ message: "The value must be 'capitalize', 'uppercase' or 'lowercase'." }),
})

/** CSS `vertical-align` keyword used by RCML. */
const verticalAlignSchema = z.enum(['top', 'middle', 'bottom'], {
  errorMap: () => ({ message: "The value must be 'top', 'middle', or 'bottom'." }),
})

/** Positive integer (accepts either a numeric string or a JS number). */
const positiveNumberSchema = z.union([
  z.string().regex(/^[1-9]\d*$/, {
    message: 'The string must contain only positive numbers.',
  }),
  z.number().positive({ message: 'The number must be positive.' }),
])

/** Allowed types for `<rc-case case-type="…">`. */
const caseTypeSchema = z.enum(['default', 'segment', 'tag', 'custom-field'], {
  errorMap: () => ({ message: "The value must be 'default', 'segment', 'tag' or 'custom-field'." }),
})

/** Allowed conditions for `<rc-case case-condition="…">` (eq/ne). */
const caseConditionSchema = z.enum(['eq', 'ne'], {
  errorMap: () => ({ message: "The value must be 'eq' or 'ne'." }),
})

/** Allowed types for `<rc-loop loop-type="…">`. */
const loopTypeSchema = z.enum(['news-feed', 'remote-content', 'custom-field', 'xml-doc'], {
  errorMap: () => ({
    message: "The value must be 'news-feed', 'remote-content', 'custom-field' or 'xml-doc'.",
  }),
})

/**
 * Keys referenced by NodeSpec `attrs` entries (see `../schema/specs.ts`).
 * Each member maps to a Zod schema in {@link RCML_ATTR_VALIDATORS}.
 *
 * Marked `export` because schema specs import this enum to tag attribute
 * validators; re-exported from `./index.ts` as an internal-folder API.
 */
export enum RcmlAttributeValidatorsEnum {
  Align = 'align',
  BackgroundPosition = 'backgroundPosition',
  BackgroundPositionX = 'backgroundPositionX',
  BackgroundPositionY = 'backgroundPositionY',
  BackgroundRepeat = 'backgroundRepeat',
  BackgroundSize = 'backgroundSize',
  Boolean = 'boolean',
  Border = 'border',
  BorderStyle = 'borderStyle',
  BorderRadius = 'borderRadius',
  Color = 'color',
  Direction = 'direction',
  FluidOnMobile = 'fluidOnMobile',
  FontFamily = 'fontFamily',
  FontStyle = 'fontStyle',
  FontWeight = 'fontWeight',
  FullWidth = 'fullWidth',
  HideSection = 'hideSection',
  LetterSpacing = 'letterSpacing',
  Padding = 'padding',
  Percentage = 'percentage',
  PositiveNumber = 'positiveNumber',
  Px = 'px',
  PxOrAuto = 'pxOrAuto',
  PxOrPercentage = 'pxOrPercentage',
  SocialMode = 'socialMode',
  SocialIconColor = 'socialIconColor',
  SocialIconShape = 'socialIconShape',
  SocialNetwork = 'socialNetwork',
  String = 'string',
  TableLayout = 'tableLayout',
  Target = 'target',
  TextAlign = 'textAlign',
  TextDecoration = 'textDecoration',
  TextTransform = 'textTransform',
  Url = 'url',
  VerticalAlign = 'verticalAlign',
  CaseType = 'caseType',
  CaseProperty = 'caseProperty',
  CaseCondition = 'caseCondition',
  CaseValue = 'caseValue',
  CaseActive = 'caseActive',
  LoopType = 'loopType',
  LoopValue = 'loopValue',
  LoopMaxIterations = 'loopMaxIterations',
}

/**
 * Dense map from {@link RcmlAttributeValidatorsEnum} to the Zod schema that
 * validates an attribute value of that class. `./attr-value-validate.ts`
 * indexes into this map via the validator key on each NodeSpec attr entry.
 *
 * Uses `satisfies` (not a `: Record<...>` annotation) so the per-entry Zod
 * schema types survive — consumers can do `z.input<typeof
 * RCML_ATTR_VALIDATORS[V]>` to derive the precise attribute-value type.
 */
export const RCML_ATTR_VALIDATORS = {
  [RcmlAttributeValidatorsEnum.Align]: alignSchema,
  [RcmlAttributeValidatorsEnum.BackgroundPosition]: backgroundPositionSchema,
  [RcmlAttributeValidatorsEnum.BackgroundPositionX]: backgroundPositionXSchema,
  [RcmlAttributeValidatorsEnum.BackgroundPositionY]: backgroundPositionYSchema,
  [RcmlAttributeValidatorsEnum.BackgroundRepeat]: backgroundRepeatSchema,
  [RcmlAttributeValidatorsEnum.BackgroundSize]: backgroundSizeSchema,
  [RcmlAttributeValidatorsEnum.Boolean]: booleanSchema,
  [RcmlAttributeValidatorsEnum.Border]: borderSchema,
  [RcmlAttributeValidatorsEnum.BorderStyle]: borderStyleSchema,
  [RcmlAttributeValidatorsEnum.BorderRadius]: borderRadiusSchema,
  [RcmlAttributeValidatorsEnum.Color]: colorSchema,
  [RcmlAttributeValidatorsEnum.Direction]: directionSchema,
  [RcmlAttributeValidatorsEnum.FluidOnMobile]: fluidOnMobileSchema,
  [RcmlAttributeValidatorsEnum.FontFamily]: fontFamilySchema,
  [RcmlAttributeValidatorsEnum.FontStyle]: fontStyleSchema,
  [RcmlAttributeValidatorsEnum.FontWeight]: fontWeightSchema,
  [RcmlAttributeValidatorsEnum.FullWidth]: fullWidthSchema,
  [RcmlAttributeValidatorsEnum.HideSection]: hideSectionSchema,
  [RcmlAttributeValidatorsEnum.LetterSpacing]: letterSpacingSchema,
  [RcmlAttributeValidatorsEnum.Padding]: paddingSchema,
  [RcmlAttributeValidatorsEnum.Percentage]: percentageSchema,
  [RcmlAttributeValidatorsEnum.PositiveNumber]: positiveNumberSchema,
  [RcmlAttributeValidatorsEnum.Px]: pxSchema,
  [RcmlAttributeValidatorsEnum.PxOrAuto]: pxOrAutoSchema,
  [RcmlAttributeValidatorsEnum.PxOrPercentage]: pxOrPercentageSchema,
  [RcmlAttributeValidatorsEnum.SocialMode]: socialModeSchema,
  [RcmlAttributeValidatorsEnum.SocialIconColor]: socialIconColorSchema,
  [RcmlAttributeValidatorsEnum.SocialIconShape]: socialIconShapeSchema,
  [RcmlAttributeValidatorsEnum.SocialNetwork]: socialNetworkSchema,
  [RcmlAttributeValidatorsEnum.String]: stringSchema,
  [RcmlAttributeValidatorsEnum.TableLayout]: tableLayoutSchema,
  [RcmlAttributeValidatorsEnum.Target]: targetSchema,
  [RcmlAttributeValidatorsEnum.TextAlign]: textAlignSchema,
  [RcmlAttributeValidatorsEnum.TextDecoration]: textDecorationSchema,
  [RcmlAttributeValidatorsEnum.TextTransform]: textTransformSchema,
  [RcmlAttributeValidatorsEnum.Url]: stringSchema,
  [RcmlAttributeValidatorsEnum.VerticalAlign]: verticalAlignSchema,
  [RcmlAttributeValidatorsEnum.CaseType]: caseTypeSchema,
  [RcmlAttributeValidatorsEnum.CaseProperty]: numberSchema,
  [RcmlAttributeValidatorsEnum.CaseCondition]: caseConditionSchema,
  [RcmlAttributeValidatorsEnum.CaseValue]: stringOrNumberSchema,
  [RcmlAttributeValidatorsEnum.CaseActive]: booleanSchema,
  [RcmlAttributeValidatorsEnum.LoopType]: loopTypeSchema,
  [RcmlAttributeValidatorsEnum.LoopValue]: stringOrNumberSchema,
  [RcmlAttributeValidatorsEnum.LoopMaxIterations]: positiveNumberSchema,
} satisfies Record<RcmlAttributeValidatorsEnum, ZodSchema>
