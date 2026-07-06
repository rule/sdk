/**
 * RCML tag NodeSpecs — validator-only subset with public metadata.
 *
 * Each entry declares the attributes a tag accepts (with a Zod validator per
 * attribute, see `../validator/attr-validators.ts`), whether the tag is a
 * leaf, its allowed child tags, and any child-count cap. Editor-runtime
 * concerns (rendering hooks, computed attributes, default-attr inheritance
 * via `rc-head` / `rc-class`) are intentionally out of scope — validation
 * here is syntactic only.
 *
 * Optional `description`, `category`, and `examples` fields provide
 * human-readable metadata consumed by the public `rcmlSpec` export.
 */

// Deep import avoids a module cycle: going through `../validator/index.js`
// would re-export `ajv-validate` → `json-schema` → back into this file.
import { RcmlAttributeValidatorsEnum as V } from '../validator/attr-validators.js'
import type { RcmlNodeSpec } from './types.js'
import { RcmlTagNamesEnum as T, type RcmlTagName } from './tag-names.js'

// ---------------------------------------------------------------------------
// Root + head
// ---------------------------------------------------------------------------

const rcmlSpec = {
  category: 'root',
  description: 'Root element of an RCML email document. Contains exactly one rc-head and one rc-body.',
  attrs: {},
  isLeaf: false,
  validChildTypes: [T.Head, T.Body],
} as const satisfies RcmlNodeSpec

const headSpec = {
  category: 'head',
  description: 'Document head — holds global configuration such as brand styles, fonts, attribute defaults, preview text, and named classes.',
  attrs: {},
  isLeaf: false,
  validChildTypes: [T.BrandStyle, T.Attributes, T.Preview, T.Class, T.PlainText, T.Font],
} as const satisfies RcmlNodeSpec

const brandStyleSpec = {
  category: 'head',
  description: 'References a saved brand style by ID, applying its colour palette, fonts, and spacing defaults to the entire document.',
  attrs: {
    id: {
      validator: V.PositiveNumber,
      description: 'Numeric ID of the brand style to apply.',
      examples: ['42'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const fontSpec = {
  category: 'head',
  description: 'Declares a custom web font to embed via @font-face so it is available to all content nodes in the email.',
  attrs: {
    name: {
      validator: V.String,
      description: 'Font family name used to reference the font in style attributes.',
      examples: ['Inter', 'Playfair Display'],
    },
    href: {
      validator: V.Url,
      description: 'URL of the font stylesheet (e.g. Google Fonts CSS URL).',
      examples: ['https://fonts.googleapis.com/css2?family=Inter:wght@400;700'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const attributesSpec = {
  category: 'head',
  description: 'Defines attribute defaults that are applied to matching content nodes throughout the document, reducing repetitive inline styling.',
  attrs: {},
  isLeaf: false,
  validChildTypes: [T.Body, T.Section, T.Button, T.Heading, T.Text, T.Social, T.Class],
} as const satisfies RcmlNodeSpec

const previewSpec = {
  category: 'head',
  description: 'Plain-text preview/preheader shown in email client inbox lists before the message is opened. Content is the text node inside this element.',
  attrs: {},
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const classSpec = {
  category: 'head',
  description: 'Named reusable style class. Content nodes reference it via the rc-class attribute to inherit its styles.',
  attrs: {
    name: {
      validator: V.String,
      description: 'Identifier used to reference this class from rc-class attributes.',
      examples: ['primary-button', 'body-text'],
    },
    'background-color': {
      validator: V.Color,
      description: 'Background colour applied to matching nodes.',
      examples: ['#ffffff', '#1a1a2e'],
    },
    color: {
      validator: V.Color,
      description: 'Text colour applied to matching nodes.',
      examples: ['#333333', '#ffffff'],
    },
    'font-family': {
      validator: V.FontFamily,
      description: 'Font family string, comma-separated with a generic fallback.',
      examples: ['Inter, sans-serif', "'Playfair Display', serif"],
    },
    'font-size': {
      validator: V.Px,
      description: 'Font size in pixels.',
      examples: ['14px', '16px', '24px'],
    },
    'font-style': {
      validator: V.FontStyle,
      description: 'CSS font-style keyword.',
      examples: ['normal', 'italic'],
    },
    'font-weight': {
      validator: V.FontWeight,
      description: 'Numeric font weight (100–900).',
      examples: ['400', '700'],
    },
    'letter-spacing': {
      validator: V.LetterSpacing,
      description: 'Space between characters, in px or em. Negative values allowed.',
      examples: ['0.5px', '-0.5px', '0.05em'],
    },
    'line-height': {
      validator: V.PxOrPercentage,
      description: 'Line height in pixels or as a percentage of the font size.',
      examples: ['24px', '150%'],
    },
    'text-decoration': {
      validator: V.TextDecoration,
      description: 'CSS text-decoration keyword.',
      examples: ['none', 'underline'],
    },
    'text-transform': {
      validator: V.TextTransform,
      description: 'CSS text-transform keyword.',
      examples: ['uppercase', 'capitalize'],
    },
    src: {
      validator: V.String,
      description: 'Default image source URL for image-type nodes that reference this class.',
      examples: ['https://cdn.example.com/logo.png'],
    },
    width: {
      validator: V.Px,
      description: 'Default width for nodes that reference this class.',
      examples: ['200px'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const plainTextSpec = {
  category: 'head',
  description: 'Plain-text version of the email body shown in clients that cannot render HTML. Content is the text node inside this element.',
  attrs: {},
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const rawSpec = {
  category: 'head',
  description: 'Injects raw HTML directly into the compiled output without escaping. Use sparingly — the content bypasses all RCML validation.',
  attrs: {},
  isLeaf: true,
} as const satisfies RcmlNodeSpec

// ---------------------------------------------------------------------------
// Body / structural
// ---------------------------------------------------------------------------

const bodySpec = {
  category: 'layout',
  description: 'Top-level email body container. Sets the overall background colour and maximum content width.',
  attrs: {
    'background-color': {
      validator: V.Color,
      description: 'Background colour rendered behind all sections.',
      examples: ['#f4f4f4', '#ffffff'],
    },
    width: {
      validator: V.Px,
      default: '600px',
      description: 'Maximum width of the email content area. 600px is the standard safe width for email clients.',
      examples: ['600px', '640px'],
    },
  },
  isLeaf: false,
  validChildTypes: [T.Section, T.Loop, T.Switch, T.Wrapper],
} as const satisfies RcmlNodeSpec

const sectionSpec = {
  category: 'layout',
  description: 'Full-width horizontal band that holds one or more columns. The primary building block for email layout rows. Maximum 20 columns.',
  attrs: {
    'background-color': {
      validator: V.Color,
      description: 'Solid background colour for the section.',
      examples: ['#ffffff', '#1a1a2e'],
    },
    'background-url': {
      validator: V.Url,
      description: 'URL of a background image displayed behind the section content.',
      examples: ['https://cdn.example.com/bg.jpg'],
    },
    'background-repeat': {
      validator: V.BackgroundRepeat,
      default: 'repeat',
      description: 'CSS background-repeat behaviour.',
      examples: ['repeat', 'no-repeat'],
    },
    'background-size': {
      validator: V.BackgroundSize,
      default: 'auto',
      description: 'CSS background-size — keyword or one/two dimension values.',
      examples: ['auto', 'cover', 'contain', '100% 50%'],
    },
    'background-position': {
      validator: V.BackgroundPosition,
      default: 'top center',
      description: 'CSS background-position as two space-separated values.',
      examples: ['top center', 'center center', '50% 50%'],
    },
    'background-position-x': {
      validator: V.BackgroundPositionX,
      description: 'Horizontal component of background-position (overrides background-position).',
      examples: ['left', 'center', 'right', '50%'],
    },
    'background-position-y': {
      validator: V.BackgroundPositionY,
      description: 'Vertical component of background-position (overrides background-position).',
      examples: ['top', 'center', 'bottom', '20%'],
    },
    border: {
      validator: V.Border,
      default: 'none',
      description: 'CSS border shorthand applied to all four sides.',
      examples: ['none', '1px solid #dddddd', '2px dashed #ff0000'],
    },
    'border-bottom': {
      validator: V.Border,
      description: 'CSS border shorthand applied to the bottom side only.',
      examples: ['1px solid #dddddd'],
    },
    'border-left': {
      validator: V.Border,
      description: 'CSS border shorthand applied to the left side only.',
      examples: ['1px solid #dddddd'],
    },
    'border-right': {
      validator: V.Border,
      description: 'CSS border shorthand applied to the right side only.',
      examples: ['1px solid #dddddd'],
    },
    'border-top': {
      validator: V.Border,
      description: 'CSS border shorthand applied to the top side only.',
      examples: ['1px solid #dddddd'],
    },
    'border-radius': {
      validator: V.BorderRadius,
      description: 'CSS border-radius shorthand (1–4 values in px or %).',
      examples: ['8px', '4px 8px', '50%'],
    },
    'css-class': {
      validator: V.String,
      description: 'One or more HTML class names applied to the rendered element for custom CSS targeting.',
      examples: ['promo-section', 'hero featured'],
    },
    direction: {
      validator: V.Direction,
      default: 'ltr',
      description: 'Text and layout direction.',
      examples: ['ltr', 'rtl'],
    },
    'full-width': {
      validator: V.FullWidth,
      description: "Set to 'full-width' to make the section bleed edge-to-edge beyond the body width constraint.",
      examples: ['full-width', 'false'],
    },
    hide: {
      validator: V.HideSection,
      description: "Hide this section on a specific device type. 'desktop' hides on desktop clients; 'mobile' hides on mobile clients.",
      examples: ['desktop', 'mobile'],
    },
    padding: {
      validator: V.Padding,
      default: '20px 0',
      description: 'CSS padding shorthand (1–4 pixel values). Controls space between the section border and its columns.',
      examples: ['20px 0', '20px 24px', '10px 0 20px 0'],
    },
    'padding-top': {
      validator: V.Px,
      description: 'Top padding in pixels. Overrides the top value of the padding shorthand.',
      examples: ['10px', '20px'],
    },
    'padding-bottom': {
      validator: V.Px,
      description: 'Bottom padding in pixels. Overrides the bottom value of the padding shorthand.',
      examples: ['10px', '20px'],
    },
    'padding-left': {
      validator: V.Px,
      description: 'Left padding in pixels. Overrides the left value of the padding shorthand.',
      examples: ['0px', '24px'],
    },
    'padding-right': {
      validator: V.Px,
      description: 'Right padding in pixels. Overrides the right value of the padding shorthand.',
      examples: ['0px', '24px'],
    },
    'padding-on-mobile': {
      validator: V.Padding,
      description: 'Padding override applied only on mobile viewports.',
      examples: ['10px 0', '8px 16px'],
    },
    'text-align': {
      validator: V.TextAlign,
      default: 'center',
      description: 'Default text alignment inherited by inline content within the section.',
      examples: ['left', 'center', 'right'],
    },
    'text-padding': {
      validator: V.Padding,
      default: '4px 4px 4px 0',
      description: 'Padding applied around inline text nodes within the section.',
      examples: ['4px 4px 4px 0', '0'],
    },
  },
  isLeaf: false,
  validChildTypes: [T.Column],
  maxChildCount: 20,
} as const satisfies RcmlNodeSpec

const VALID_COLUMN_CHILDREN: readonly RcmlTagName[] = Object.values(T).filter(
  (tag) =>
    ![
      T.Rcml,
      T.Head,
      T.BrandStyle,
      T.Attributes,
      T.Preview,
      T.Body,
      T.Section,
      T.Column,
      T.SocialElement,
      T.Class,
      T.Switch,
      T.Case,
    ].includes(tag as T),
) as readonly RcmlTagName[]

const columnSpec = {
  category: 'layout',
  description: 'Vertical cell inside a section. Columns sit side-by-side; their combined widths fill the section. Holds any content elements.',
  attrs: {
    'background-color': {
      validator: V.Color,
      description: 'Solid background colour for the column.',
      examples: ['#ffffff', 'transparent'],
    },
    border: {
      validator: V.Border,
      description: 'CSS border shorthand applied to all four sides of the column.',
      examples: ['1px solid #dddddd', 'none'],
    },
    'border-bottom': {
      validator: V.Border,
      description: 'CSS border shorthand for the bottom side of the column.',
      examples: ['1px solid #dddddd'],
    },
    'border-left': {
      validator: V.Border,
      description: 'CSS border shorthand for the left side of the column.',
      examples: ['1px solid #dddddd'],
    },
    'border-right': {
      validator: V.Border,
      description: 'CSS border shorthand for the right side of the column.',
      examples: ['1px solid #dddddd'],
    },
    'border-top': {
      validator: V.Border,
      description: 'CSS border shorthand for the top side of the column.',
      examples: ['1px solid #dddddd'],
    },
    'border-radius': {
      validator: V.BorderRadius,
      description: 'CSS border-radius shorthand (1–4 values in px or %).',
      examples: ['8px', '4px 8px'],
    },
    'css-class': {
      validator: V.String,
      description: 'One or more HTML class names for custom CSS targeting.',
      examples: ['sidebar', 'main-column'],
    },
    direction: {
      validator: V.Direction,
      default: 'ltr',
      description: 'Text and layout direction for content inside this column.',
      examples: ['ltr', 'rtl'],
    },
    'inner-background-color': {
      validator: V.Color,
      description: 'Background colour applied to the inner content area (inside the column padding).',
      examples: ['#f9f9f9'],
    },
    'inner-border': {
      validator: V.Border,
      description: 'CSS border shorthand applied to the inner content area.',
      examples: ['1px solid #eeeeee'],
    },
    'inner-border-bottom': {
      validator: V.Border,
      description: 'Bottom border for the inner content area.',
      examples: ['1px solid #eeeeee'],
    },
    'inner-border-left': {
      validator: V.Border,
      description: 'Left border for the inner content area.',
      examples: ['1px solid #eeeeee'],
    },
    'inner-border-right': {
      validator: V.Border,
      description: 'Right border for the inner content area.',
      examples: ['1px solid #eeeeee'],
    },
    'inner-border-top': {
      validator: V.Border,
      description: 'Top border for the inner content area.',
      examples: ['1px solid #eeeeee'],
    },
    'inner-border-radius': {
      validator: V.BorderRadius,
      description: 'Border-radius for the inner content area.',
      examples: ['4px'],
    },
    padding: {
      validator: V.Padding,
      description: 'CSS padding shorthand (1–4 values in px or %). Space between the column edge and its content.',
      examples: ['0px', '16px', '0 16px 16px'],
    },
    'padding-top': {
      validator: V.PxOrPercentage,
      description: 'Top padding. Overrides the top value of the padding shorthand.',
      examples: ['16px', '5%'],
    },
    'padding-bottom': {
      validator: V.PxOrPercentage,
      description: 'Bottom padding. Overrides the bottom value of the padding shorthand.',
      examples: ['16px', '5%'],
    },
    'padding-left': {
      validator: V.PxOrPercentage,
      description: 'Left padding. Overrides the left value of the padding shorthand.',
      examples: ['16px', '5%'],
    },
    'padding-right': {
      validator: V.PxOrPercentage,
      description: 'Right padding. Overrides the right value of the padding shorthand.',
      examples: ['16px', '5%'],
    },
    'padding-on-mobile': {
      validator: V.Padding,
      description: 'Padding override applied only on mobile viewports.',
      examples: ['8px', '8px 16px'],
    },
    'vertical-align': {
      validator: V.VerticalAlign,
      default: 'top',
      description: 'Vertical alignment of the column content within the row.',
      examples: ['top', 'middle', 'bottom'],
    },
    width: {
      validator: V.PxOrPercentage,
      description: 'Column width. When omitted, columns share the available width equally.',
      examples: ['200px', '50%', '33%'],
    },
  },
  isLeaf: false,
  validChildTypes: VALID_COLUMN_CHILDREN,
} as const satisfies RcmlNodeSpec

const wrapperSpec = {
  category: 'layout',
  description: 'Groups multiple sections under a shared background image or colour. Useful for hero areas that span several rows.',
  attrs: {
    'background-color': {
      validator: V.Color,
      description: 'Solid background colour applied to all wrapped sections.',
      examples: ['#f4f4f4'],
    },
    'background-url': {
      validator: V.Url,
      description: 'URL of a background image displayed behind all wrapped sections.',
      examples: ['https://cdn.example.com/bg.jpg'],
    },
    'background-repeat': {
      validator: V.BackgroundRepeat,
      default: 'repeat',
      description: 'CSS background-repeat behaviour.',
      examples: ['repeat', 'no-repeat'],
    },
    'background-size': {
      validator: V.BackgroundSize,
      default: 'auto',
      description: 'CSS background-size keyword or dimension values.',
      examples: ['auto', 'cover', 'contain'],
    },
    'background-position': {
      validator: V.BackgroundPosition,
      default: 'top center',
      description: 'CSS background-position as two space-separated values.',
      examples: ['top center', 'center center', '50% 50%'],
    },
    'background-position-x': {
      validator: V.BackgroundPositionX,
      description: 'Horizontal background-position component.',
      examples: ['left', 'center', 'right', '50%'],
    },
    'background-position-y': {
      validator: V.BackgroundPositionY,
      description: 'Vertical background-position component.',
      examples: ['top', 'center', 'bottom', '20%'],
    },
    border: {
      validator: V.Border,
      default: 'none',
      description: 'CSS border shorthand applied around the entire wrapper.',
      examples: ['none', '1px solid #dddddd'],
    },
    'border-bottom': {
      validator: V.Border,
      description: 'Bottom border of the wrapper.',
      examples: ['1px solid #dddddd'],
    },
    'border-left': {
      validator: V.Border,
      description: 'Left border of the wrapper.',
      examples: ['1px solid #dddddd'],
    },
    'border-right': {
      validator: V.Border,
      description: 'Right border of the wrapper.',
      examples: ['1px solid #dddddd'],
    },
    'border-top': {
      validator: V.Border,
      description: 'Top border of the wrapper.',
      examples: ['1px solid #dddddd'],
    },
    'border-radius': {
      validator: V.BorderRadius,
      description: 'CSS border-radius shorthand (1–4 values in px or %).',
      examples: ['8px', '4px 8px'],
    },
    'full-width': {
      validator: V.FullWidth,
      description: "Set to 'full-width' to make the wrapper bleed edge-to-edge.",
      examples: ['full-width', 'false'],
    },
    padding: {
      validator: V.Padding,
      default: '20px 0',
      description: 'Padding inside the wrapper, outside of the contained sections.',
      examples: ['20px 0', '40px 24px'],
    },
    'padding-top': {
      validator: V.Px,
      description: 'Top padding in pixels.',
      examples: ['20px'],
    },
    'padding-bottom': {
      validator: V.Px,
      description: 'Bottom padding in pixels.',
      examples: ['20px'],
    },
    'padding-left': {
      validator: V.Px,
      description: 'Left padding in pixels.',
      examples: ['0px', '24px'],
    },
    'padding-right': {
      validator: V.Px,
      description: 'Right padding in pixels.',
      examples: ['0px', '24px'],
    },
    'padding-on-mobile': {
      validator: V.Padding,
      description: 'Padding override applied only on mobile viewports.',
      examples: ['10px 0'],
    },
  },
  isLeaf: false,
  validChildTypes: [T.Switch, T.Section],
} as const satisfies RcmlNodeSpec

const groupSpec = {
  category: 'layout',
  description: 'Groups columns inside a section to control how they stack on mobile. Columns inside a group remain side-by-side on mobile when other columns stack.',
  attrs: {},
  isLeaf: false,
  validChildTypes: [T.Column],
} as const satisfies RcmlNodeSpec

// ---------------------------------------------------------------------------
// Control flow
// ---------------------------------------------------------------------------

const switchSpec = {
  category: 'control-flow',
  description: 'Conditional branching container. Renders the first matching rc-case child based on subscriber data, or the default case if none match.',
  attrs: {},
  isLeaf: false,
  validChildTypes: [T.Case],
} as const satisfies RcmlNodeSpec

const caseSpec = {
  category: 'control-flow',
  description: "A single branch within an rc-switch. Rendered when its condition matches the subscriber's data. Use case-type='default' for the fallback branch.",
  attrs: {
    'case-type': {
      validator: V.CaseType,
      description: "Kind of subscriber data to match against. 'default' renders when no other case matches.",
      examples: ['default', 'segment', 'tag', 'custom-field'],
    },
    'case-property': {
      validator: V.CaseProperty,
      description: 'Numeric ID of the segment, tag, or custom field to evaluate.',
      examples: ['12', '99'],
    },
    'case-condition': {
      validator: V.CaseCondition,
      description: "Comparison operator. 'eq' matches when the property equals case-value; 'ne' matches when it does not.",
      examples: ['eq', 'ne'],
    },
    'case-value': {
      validator: V.CaseValue,
      description: 'Value to compare against the subscriber property.',
      examples: ['premium', '1', 'true'],
    },
    'case-active': {
      validator: V.CaseActive,
      description: 'When true, this branch is selected in editor preview mode regardless of conditions.',
      examples: [],
    },
  },
  isLeaf: false,
  validChildTypes: [T.Section],
} as const satisfies RcmlNodeSpec

const loopSpec = {
  category: 'control-flow',
  description: 'Repeating section driven by a data feed (news feed, remote content, custom fields, or XML). Renders its child section once per item in the feed.',
  attrs: {
    'loop-type': {
      validator: V.LoopType,
      description: 'Data source type for the loop.',
      examples: ['news-feed', 'remote-content', 'custom-field', 'xml-doc'],
    },
    'loop-value': {
      validator: V.LoopValue,
      description: 'ID or URL of the data source (feed ID, remote content URL, custom-field ID, or XML document path).',
      examples: ['42', 'https://feeds.example.com/posts.xml'],
    },
    'loop-max-iterations': {
      validator: V.LoopMaxIterations,
      description: 'Maximum number of items to render. Prevents runaway loops on large feeds.',
      examples: ['5', '10'],
    },
  },
  isLeaf: false,
  validChildTypes: [T.Section],
} as const satisfies RcmlNodeSpec

// ---------------------------------------------------------------------------
// Content leaves
// ---------------------------------------------------------------------------

const textSpec = {
  category: 'content',
  description: 'Rich-text paragraph block. The content is a full RFM document — supports paragraphs, bullet/ordered lists, hard breaks, alignment blocks, inline marks, links, and dynamic placeholders. Renders as an HTML table cell. Theme font and colour styling is applied via the rc-class attribute (default: "rcml-p-style"); applyTheme sets this automatically on unstyled nodes.',
  attrs: {
    align: {
      validator: V.TextAlign,
      default: 'left',
      description: 'Horizontal text alignment.',
      examples: ['left', 'center', 'right', 'justify'],
    },
    color: {
      validator: V.Color,
      description: 'Default text colour for the block.',
      examples: ['#333333', '#ffffff'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing table cell.',
      examples: ['#f9f9f9'],
    },
    'css-class': {
      validator: V.String,
      description: 'HTML class names applied to the rendered element.',
      examples: ['body-text'],
    },
    'rc-class': {
      validator: V.String,
      description: 'Name of an rc-class defined in rc-head whose styles are inherited by this node. applyTheme automatically sets this to "rcml-p-style" (the theme paragraph style) on nodes that have no class. Override only when applying a different named style.',
      examples: ['rcml-p-style'],
    },
    'font-family': {
      validator: V.FontFamily,
      description: 'Default font family for the text block.',
      examples: ['Inter, sans-serif'],
    },
    'font-size': {
      validator: V.Px,
      description: 'Default font size in pixels.',
      examples: ['14px', '16px'],
    },
    'font-style': {
      validator: V.FontStyle,
      description: 'CSS font-style keyword.',
      examples: ['normal', 'italic'],
    },
    'font-weight': {
      validator: V.FontWeight,
      description: 'Numeric font weight (100–900).',
      examples: ['400', '700'],
    },
    height: {
      validator: V.PxOrPercentage,
      description: 'Fixed height of the text cell.',
      examples: ['200px', '50%'],
    },
    'letter-spacing': {
      validator: V.LetterSpacing,
      description: 'Space between characters in px or em.',
      examples: ['0.5px', '0.05em'],
    },
    'line-height': {
      validator: V.PxOrPercentage,
      description: 'Line height in pixels or percentage.',
      examples: ['24px', '150%'],
    },
    padding: {
      validator: V.Padding,
      default: '0 0 20px 0',
      description: 'CSS padding shorthand (1–4 pixel values). Adds space around the text block.',
      examples: ['0 0 20px 0', '16px'],
    },
    'padding-top': {
      validator: V.PxOrPercentage,
      description: 'Top padding.',
      examples: ['16px'],
    },
    'padding-bottom': {
      validator: V.PxOrPercentage,
      description: 'Bottom padding.',
      examples: ['20px'],
    },
    'padding-left': {
      validator: V.PxOrPercentage,
      description: 'Left padding.',
      examples: ['0px', '16px'],
    },
    'padding-right': {
      validator: V.PxOrPercentage,
      description: 'Right padding.',
      examples: ['0px', '16px'],
    },
    'padding-on-mobile': {
      validator: V.Padding,
      description: 'Padding override applied only on mobile viewports.',
      examples: ['8px 16px'],
    },
    'text-decoration': {
      validator: V.TextDecoration,
      description: 'CSS text-decoration keyword.',
      examples: ['none', 'underline'],
    },
    'text-transform': {
      validator: V.TextTransform,
      description: 'CSS text-transform keyword.',
      examples: ['none', 'uppercase', 'capitalize'],
    },
    'vertical-align': {
      validator: V.VerticalAlign,
      description: 'Vertical alignment of the text within its cell.',
      examples: ['top', 'middle', 'bottom'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const headingSpec = {
  category: 'content',
  description: 'Heading block. Supports the same full RFM feature set as rc-text. Visually prominent text rendered as an HTML table cell. There is no level attribute — heading level semantics (H1–H4) are expressed through the rc-class attribute: use "rcml-h1-style", "rcml-h2-style", "rcml-h3-style", or "rcml-h4-style" to inherit the corresponding theme style. applyTheme defaults to "rcml-h1-style" on nodes that have no rc-class.',
  attrs: {
    align: {
      validator: V.TextAlign,
      default: 'left',
      description: 'Horizontal text alignment.',
      examples: ['left', 'center', 'right'],
    },
    'background-color': {
      validator: V.Color,
      description: 'Background colour of the heading cell.',
      examples: ['#ffffff'],
    },
    color: {
      validator: V.Color,
      description: 'Heading text colour.',
      examples: ['#111111', '#333333'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing table cell.',
      examples: ['#f9f9f9'],
    },
    'css-class': {
      validator: V.String,
      description: 'HTML class names applied to the rendered element.',
      examples: ['section-heading'],
    },
    'rc-class': {
      validator: V.String,
      description: 'Name of an rc-class defined in rc-head whose styles are inherited by this heading. applyTheme automatically sets this to "rcml-h1-style" (the theme H1 style) on nodes that have no class. Use other heading styles by setting the class explicitly.',
      examples: ['rcml-h1-style', 'rcml-h2-style', 'rcml-h3-style', 'rcml-h4-style'],
    },
    'font-family': {
      validator: V.FontFamily,
      description: 'Font family for the heading.',
      examples: ["'Playfair Display', serif"],
    },
    'font-size': {
      validator: V.Px,
      description: 'Font size in pixels.',
      examples: ['24px', '32px'],
    },
    'font-style': {
      validator: V.FontStyle,
      description: 'CSS font-style keyword.',
      examples: ['normal', 'italic'],
    },
    'font-weight': {
      validator: V.FontWeight,
      description: 'Numeric font weight (100–900).',
      examples: ['700', '800'],
    },
    height: {
      validator: V.PxOrPercentage,
      description: 'Fixed cell height.',
      examples: ['80px'],
    },
    'letter-spacing': {
      validator: V.LetterSpacing,
      description: 'Space between characters in px or em.',
      examples: ['0.5px', '-0.5px'],
    },
    'line-height': {
      validator: V.PxOrPercentage,
      description: 'Line height in pixels or percentage.',
      examples: ['36px', '120%'],
    },
    padding: {
      validator: V.Padding,
      default: '0 0 20px 0',
      description: 'CSS padding shorthand around the heading.',
      examples: ['0 0 20px 0', '0 0 12px 0'],
    },
    'padding-top': {
      validator: V.PxOrPercentage,
      description: 'Top padding.',
      examples: ['16px'],
    },
    'padding-bottom': {
      validator: V.PxOrPercentage,
      description: 'Bottom padding.',
      examples: ['20px'],
    },
    'padding-left': {
      validator: V.PxOrPercentage,
      description: 'Left padding.',
      examples: ['0px'],
    },
    'padding-right': {
      validator: V.PxOrPercentage,
      description: 'Right padding.',
      examples: ['0px'],
    },
    'padding-on-mobile': {
      validator: V.Padding,
      description: 'Padding override on mobile.',
      examples: ['0 0 12px 0'],
    },
    'text-decoration': {
      validator: V.TextDecoration,
      description: 'CSS text-decoration keyword.',
      examples: ['none', 'underline'],
    },
    'text-transform': {
      validator: V.TextTransform,
      description: 'CSS text-transform keyword.',
      examples: ['uppercase', 'capitalize'],
    },
    'vertical-align': {
      validator: V.VerticalAlign,
      description: 'Vertical alignment within the cell.',
      examples: ['top', 'middle'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const buttonSpec = {
  category: 'content',
  description: 'Clickable call-to-action button. The label is an Inline RFM document (single paragraph — no lists or alignment blocks). Renders as a styled anchor tag inside a table cell. Theme label font styling is applied via the rc-class attribute (default: "rcml-label-style"); applyTheme sets this automatically on unstyled nodes.',
  attrs: {
    align: {
      validator: V.Align,
      default: 'center',
      description: 'Horizontal alignment of the button within its cell.',
      examples: ['left', 'center', 'right'],
    },
    'background-color': {
      validator: V.Color,
      description: 'Background fill colour of the button.',
      examples: ['#007bff', '#28a745'],
    },
    border: {
      validator: V.Border,
      default: 'none',
      description: 'CSS border shorthand for all four sides of the button.',
      examples: ['none', '2px solid #007bff'],
    },
    'border-bottom': {
      validator: V.Border,
      description: 'Bottom border of the button.',
      examples: ['2px solid #0056b3'],
    },
    'border-left': {
      validator: V.Border,
      description: 'Left border of the button.',
      examples: ['1px solid #dddddd'],
    },
    'border-right': {
      validator: V.Border,
      description: 'Right border of the button.',
      examples: ['1px solid #dddddd'],
    },
    'border-top': {
      validator: V.Border,
      description: 'Top border of the button.',
      examples: ['1px solid #dddddd'],
    },
    'border-radius': {
      validator: V.BorderRadius,
      default: '8px',
      description: 'Rounded corners of the button.',
      examples: ['8px', '4px', '24px', '50%'],
    },
    color: {
      validator: V.Color,
      description: 'Label text colour.',
      examples: ['#ffffff', '#000000'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing table cell.',
      examples: ['#f9f9f9'],
    },
    'css-class': {
      validator: V.String,
      description: 'HTML class names for custom CSS targeting.',
      examples: ['cta-button'],
    },
    'rc-class': {
      validator: V.String,
      description: 'Name of an rc-class defined in rc-head whose styles are inherited by this button. applyTheme automatically sets this to "rcml-label-style" (the theme button-label style) on nodes that have no class. Override only when applying a different named style.',
      examples: ['rcml-label-style'],
    },
    'font-family': {
      validator: V.FontFamily,
      description: 'Font family of the button label.',
      examples: ['Inter, sans-serif'],
    },
    'font-size': {
      validator: V.Px,
      description: 'Font size of the button label.',
      examples: ['14px', '16px'],
    },
    'font-style': {
      validator: V.FontStyle,
      description: 'CSS font-style for the button label.',
      examples: ['normal', 'italic'],
    },
    'font-weight': {
      validator: V.FontWeight,
      description: 'Font weight of the button label.',
      examples: ['600', '700'],
    },
    height: {
      validator: V.PxOrPercentage,
      description: 'Fixed height of the button.',
      examples: ['44px'],
    },
    href: {
      validator: V.Url,
      description: "Destination URL when the button is clicked. Use `[Link:<type>]` for system-managed links (e.g. `[Link:Unsubscribe]`, `[Link:WebBrowser]`) or any absolute URL. May contain placeholder tokens such as `[CustomField:...]` for per-recipient links.",
      examples: ['https://example.com/offer', '[Link:Unsubscribe]'],
    },
    'inner-padding': {
      validator: V.Padding,
      default: '10px 16px',
      description: 'Padding inside the button between its border and label text.',
      examples: ['10px 16px', '12px 24px'],
    },
    'letter-spacing': {
      validator: V.LetterSpacing,
      description: 'Character spacing of the label.',
      examples: ['0.5px', '1px'],
    },
    'line-height': {
      validator: V.PxOrPercentage,
      description: 'Line height of the label text.',
      examples: ['20px', '150%'],
    },
    name: {
      validator: V.String,
      description: 'Tracking name for the button used in analytics and link tracking.',
      examples: ['hero-cta', 'checkout-button'],
    },
    padding: {
      validator: V.Padding,
      default: '0 0 20px 0',
      description: 'Outer padding around the button cell.',
      examples: ['0 0 20px 0', '8px 0'],
    },
    'padding-top': {
      validator: V.PxOrPercentage,
      description: 'Top outer padding.',
      examples: ['8px'],
    },
    'padding-bottom': {
      validator: V.PxOrPercentage,
      description: 'Bottom outer padding.',
      examples: ['20px'],
    },
    'padding-left': {
      validator: V.PxOrPercentage,
      description: 'Left outer padding.',
      examples: ['0px'],
    },
    'padding-right': {
      validator: V.PxOrPercentage,
      description: 'Right outer padding.',
      examples: ['0px'],
    },
    'padding-on-mobile': {
      validator: V.Padding,
      description: 'Outer padding override on mobile.',
      examples: ['0 0 12px 0'],
    },
    rel: {
      validator: V.String,
      description: 'HTML rel attribute on the anchor tag (e.g. noopener, sponsored).',
      examples: ['noopener noreferrer', 'sponsored'],
    },
    target: {
      validator: V.Target,
      description: 'HTML anchor target attribute.',
      examples: ['_blank', '_self'],
    },
    'text-align': {
      validator: V.Align,
      default: 'center',
      description: 'Alignment of the label text inside the button.',
      examples: ['left', 'center', 'right'],
    },
    'text-decoration': {
      validator: V.TextDecoration,
      description: 'CSS text-decoration for the label.',
      examples: ['none', 'underline'],
    },
    'text-transform': {
      validator: V.TextTransform,
      description: 'CSS text-transform for the label.',
      examples: ['uppercase', 'capitalize'],
    },
    title: {
      validator: V.String,
      description: 'HTML title attribute — tooltip shown on hover.',
      examples: ['Click to shop'],
    },
    'vertical-align': {
      validator: V.VerticalAlign,
      default: 'middle',
      description: 'Vertical alignment of the button within its cell.',
      examples: ['top', 'middle', 'bottom'],
    },
    width: {
      validator: V.PxOrPercentage,
      description: 'Fixed width of the button. When omitted the button sizes to its label.',
      examples: ['200px', '100%'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const imageSpec = {
  category: 'content',
  description: 'Responsive image block. Renders an <img> tag inside a table cell with optional link wrapping.',
  attrs: {
    align: {
      validator: V.Align,
      default: 'center',
      description: 'Horizontal alignment of the image within its cell.',
      examples: ['left', 'center', 'right'],
    },
    'align-on-mobile': {
      validator: V.Align,
      description: 'Horizontal alignment override on mobile.',
      examples: ['center'],
    },
    alt: {
      validator: V.String,
      default: '',
      description: 'Alt text for accessibility and clients that block images.',
      examples: ['Our spring collection banner'],
    },
    border: {
      validator: V.Border,
      description: 'CSS border shorthand around the image.',
      examples: ['1px solid #dddddd', 'none'],
    },
    'border-bottom': { validator: V.Border, description: 'Bottom border of the image.', examples: ['1px solid #dddddd'] },
    'border-left': { validator: V.Border, description: 'Left border of the image.', examples: ['1px solid #dddddd'] },
    'border-right': { validator: V.Border, description: 'Right border of the image.', examples: ['1px solid #dddddd'] },
    'border-top': { validator: V.Border, description: 'Top border of the image.', examples: ['1px solid #dddddd'] },
    'border-radius': {
      validator: V.BorderRadius,
      description: 'Rounded corners on the image.',
      examples: ['8px', '50%'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing table cell.',
      examples: ['#ffffff'],
    },
    'css-class': {
      validator: V.String,
      description: 'HTML class names on the rendered element.',
      examples: ['hero-image'],
    },
    'fluid-on-mobile': {
      validator: V.FluidOnMobile,
      description: "Set to 'true' to make the image stretch full-width on mobile viewports.",
      examples: ['true', 'false'],
    },
    'font-size': {
      validator: V.Px,
      default: '14px',
      description: 'Font size used for the alt-text fallback display.',
      examples: ['14px'],
    },
    height: {
      validator: V.PxOrAuto,
      default: 'auto',
      description: 'Image height. Use auto to maintain aspect ratio.',
      examples: ['auto', '200px'],
    },
    href: {
      validator: V.Url,
      description: "URL to navigate to when the image is clicked. Use `[Link:<type>]` for system-managed links (e.g. `[Link:Unsubscribe]`, `[Link:WebBrowser]`) or any absolute URL. May contain placeholder tokens such as `[CustomField:...]` for per-recipient links.",
      examples: ['https://example.com', '[Link:WebBrowser]'],
    },
    'max-height': {
      validator: V.PxOrPercentage,
      description: 'Maximum image height.',
      examples: ['300px', '100%'],
    },
    name: {
      validator: V.String,
      description: 'Tracking name for analytics.',
      examples: ['hero-banner'],
    },
    padding: {
      validator: V.Padding,
      default: '0 0 20px',
      description: 'Outer padding around the image cell.',
      examples: ['0 0 20px', '16px'],
    },
    'padding-top': { validator: V.PxOrPercentage, description: 'Top outer padding.', examples: ['16px'] },
    'padding-bottom': { validator: V.PxOrPercentage, description: 'Bottom outer padding.', examples: ['20px'] },
    'padding-left': { validator: V.PxOrPercentage, description: 'Left outer padding.', examples: ['0px'] },
    'padding-right': { validator: V.PxOrPercentage, description: 'Right outer padding.', examples: ['0px'] },
    'padding-on-mobile': { validator: V.Padding, description: 'Padding override on mobile.', examples: ['8px 0'] },
    rel: {
      validator: V.String,
      description: 'HTML rel attribute on the wrapping anchor tag.',
      examples: ['noopener noreferrer'],
    },
    src: {
      validator: V.Url,
      description: 'URL of the image file.',
      examples: ['https://cdn.example.com/banner.jpg'],
    },
    target: {
      validator: V.Target,
      default: '_blank',
      description: 'HTML anchor target when href is set.',
      examples: ['_blank', '_self'],
    },
    title: {
      validator: V.String,
      description: 'HTML title attribute — tooltip on hover.',
      examples: ['Spring Collection'],
    },
    width: {
      validator: V.Px,
      description: 'Rendered image width in pixels. Omit to use natural width.',
      examples: ['600px', '300px'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const logoSpec = {
  category: 'content',
  description: 'Brand logo image. Functionally identical to rc-image but semantically distinct — the editor treats it as the document logo and wires it to the brand theme. Theme logo URL and sizing are applied via the rc-class attribute (default: "rcml-logo-style"); applyTheme sets this automatically on unstyled nodes and also patches the src attribute with the brand logo URL.',
  attrs: {
    align: {
      validator: V.Align,
      default: 'center',
      description: 'Horizontal alignment of the logo.',
      examples: ['left', 'center', 'right'],
    },
    'align-on-mobile': {
      validator: V.Align,
      description: 'Alignment override on mobile.',
      examples: ['center'],
    },
    alt: {
      validator: V.String,
      default: '',
      description: 'Alt text for the logo image.',
      examples: ['Acme Inc. logo'],
    },
    border: { validator: V.Border, description: 'Border around the logo.', examples: ['none'] },
    'border-bottom': { validator: V.Border, description: 'Bottom border.', examples: ['1px solid #dddddd'] },
    'border-left': { validator: V.Border, description: 'Left border.', examples: ['1px solid #dddddd'] },
    'border-right': { validator: V.Border, description: 'Right border.', examples: ['1px solid #dddddd'] },
    'border-top': { validator: V.Border, description: 'Top border.', examples: ['1px solid #dddddd'] },
    'border-radius': {
      validator: V.BorderRadius,
      description: 'Rounded corners on the logo.',
      examples: ['4px', '50%'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing cell.',
      examples: ['#ffffff'],
    },
    'css-class': {
      validator: V.String,
      description: 'HTML class names for custom targeting.',
      examples: ['brand-logo'],
    },
    'fluid-on-mobile': {
      validator: V.Boolean,
      description: 'When true the logo stretches full-width on mobile.',
      examples: [],
    },
    'font-size': {
      validator: V.Px,
      default: '14px',
      description: 'Font size for the alt-text fallback.',
      examples: ['14px'],
    },
    height: {
      validator: V.PxOrAuto,
      default: 'auto',
      description: 'Logo height. Defaults to auto to maintain aspect ratio.',
      examples: ['auto', '48px'],
    },
    href: {
      validator: V.Url,
      description: "URL to navigate to when the logo is clicked. Use `[Link:<type>]` for system-managed links or any absolute URL. May contain placeholder tokens such as `[CustomField:...]`.",
      examples: ['https://example.com'],
    },
    'max-height': { validator: V.PxOrPercentage, description: 'Maximum logo height.', examples: ['80px'] },
    name: { validator: V.String, description: 'Tracking name.', examples: ['brand-logo'] },
    padding: {
      validator: V.Padding,
      default: '0 0 20px',
      description: 'Outer padding around the logo cell.',
      examples: ['0 0 20px', '16px 0'],
    },
    'padding-top': { validator: V.PxOrPercentage, description: 'Top outer padding.', examples: ['16px'] },
    'padding-bottom': { validator: V.PxOrPercentage, description: 'Bottom outer padding.', examples: ['20px'] },
    'padding-left': { validator: V.PxOrPercentage, description: 'Left outer padding.', examples: ['0px'] },
    'padding-right': { validator: V.PxOrPercentage, description: 'Right outer padding.', examples: ['0px'] },
    'padding-on-mobile': { validator: V.Padding, description: 'Padding override on mobile.', examples: ['8px 0'] },
    rel: { validator: V.String, description: 'HTML rel attribute on the anchor.', examples: ['noopener noreferrer'] },
    src: {
      validator: V.Url,
      description: 'URL of the logo image file.',
      examples: ['https://cdn.example.com/logo.svg'],
    },
    target: {
      validator: V.Target,
      default: '_blank',
      description: 'HTML anchor target when href is set.',
      examples: ['_blank', '_self'],
    },
    title: { validator: V.String, description: 'Tooltip on hover.', examples: ['Acme Inc.'] },
    width: {
      validator: V.Px,
      default: '96px',
      description: 'Logo width in pixels.',
      examples: ['96px', '140px'],
    },
    'rc-class': {
      validator: V.String,
      description: 'Name of an rc-class defined in rc-head whose styles are inherited by this logo. applyTheme automatically sets this to "rcml-logo-style" (the theme logo style) on nodes that have no class, and also applies the brand logo URL. Override only when applying a different named style.',
      examples: ['rcml-logo-style'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const videoSpec = {
  category: 'content',
  description: 'Video thumbnail block. Renders a static preview image (from src) with a play-button overlay that links to the video URL. Full video playback is not supported in most email clients.',
  attrs: {
    align: {
      validator: V.Align,
      default: 'center',
      description: 'Horizontal alignment of the video thumbnail.',
      examples: ['left', 'center', 'right'],
    },
    'align-on-mobile': { validator: V.Align, description: 'Alignment override on mobile.', examples: ['center'] },
    alt: {
      validator: V.String,
      default: '',
      description: 'Alt text for the thumbnail image.',
      examples: ['Watch our product demo'],
    },
    border: { validator: V.Border, description: 'Border around the thumbnail.', examples: ['none'] },
    'border-bottom': { validator: V.Border, description: 'Bottom border.', examples: ['1px solid #dddddd'] },
    'border-left': { validator: V.Border, description: 'Left border.', examples: ['1px solid #dddddd'] },
    'border-right': { validator: V.Border, description: 'Right border.', examples: ['1px solid #dddddd'] },
    'border-top': { validator: V.Border, description: 'Top border.', examples: ['1px solid #dddddd'] },
    'border-radius': { validator: V.BorderRadius, description: 'Rounded corners on the thumbnail.', examples: ['8px'] },
    'button-url': {
      validator: V.Url,
      description: 'URL of the video to open when the play button is clicked.',
      examples: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing cell.',
      examples: ['#000000'],
    },
    'css-class': { validator: V.String, description: 'HTML class names.', examples: ['video-block'] },
    'fluid-on-mobile': {
      validator: V.Boolean,
      description: 'Stretch the thumbnail to full width on mobile.',
      examples: [],
    },
    'font-size': {
      validator: V.Px,
      default: '14px',
      description: 'Font size for the alt-text fallback.',
      examples: ['14px'],
    },
    height: {
      validator: V.PxOrAuto,
      default: 'auto',
      description: 'Thumbnail height.',
      examples: ['auto', '338px'],
    },
    href: {
      validator: V.Url,
      description: "URL to navigate to when the thumbnail (not the play button) is clicked. May contain placeholder tokens such as `[Link:<type>]` or `[CustomField:...]`.",
      examples: ['https://example.com'],
    },
    'max-height': { validator: V.PxOrPercentage, description: 'Maximum thumbnail height.', examples: ['400px'] },
    name: { validator: V.String, description: 'Tracking name.', examples: ['product-demo-video'] },
    padding: {
      validator: V.Padding,
      default: '0 0 20px',
      description: 'Outer padding around the video cell.',
      examples: ['0 0 20px'],
    },
    'padding-top': { validator: V.PxOrPercentage, description: 'Top outer padding.', examples: ['16px'] },
    'padding-bottom': { validator: V.PxOrPercentage, description: 'Bottom outer padding.', examples: ['20px'] },
    'padding-left': { validator: V.PxOrPercentage, description: 'Left outer padding.', examples: ['0px'] },
    'padding-right': { validator: V.PxOrPercentage, description: 'Right outer padding.', examples: ['0px'] },
    'padding-on-mobile': { validator: V.Padding, description: 'Padding override on mobile.', examples: ['8px 0'] },
    rel: { validator: V.String, description: 'HTML rel attribute on the anchor.', examples: ['noopener noreferrer'] },
    src: {
      validator: V.Url,
      description: 'URL of the thumbnail image displayed as the video preview.',
      examples: ['https://cdn.example.com/video-thumb.jpg'],
    },
    target: {
      validator: V.Target,
      default: '_blank',
      description: 'HTML anchor target.',
      examples: ['_blank'],
    },
    title: { validator: V.String, description: 'Tooltip on hover.', examples: ['Play video'] },
    width: {
      validator: V.Px,
      description: 'Thumbnail width in pixels.',
      examples: ['560px'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const spacerSpec = {
  category: 'content',
  description: 'Invisible vertical spacer block. Use to add controlled whitespace between content elements without relying on padding.',
  attrs: {
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the spacer cell (normally transparent).',
      examples: ['transparent'],
    },
    'css-class': { validator: V.String, description: 'HTML class names.', examples: ['spacer'] },
    height: {
      validator: V.PxOrPercentage,
      default: '32px',
      description: 'Height of the spacer.',
      examples: ['16px', '32px', '48px'],
    },
    padding: { validator: V.Padding, description: 'Padding inside the spacer cell.', examples: ['0'] },
    'padding-top': { validator: V.PxOrPercentage, description: 'Top padding.', examples: ['0px'] },
    'padding-bottom': { validator: V.PxOrPercentage, description: 'Bottom padding.', examples: ['0px'] },
    'padding-left': { validator: V.PxOrPercentage, description: 'Left padding.', examples: ['0px'] },
    'padding-right': { validator: V.PxOrPercentage, description: 'Right padding.', examples: ['0px'] },
    'padding-on-mobile': { validator: V.Padding, description: 'Padding override on mobile.', examples: ['0'] },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const dividerSpec = {
  category: 'content',
  description: 'Horizontal rule rendered as a thin border line. Useful for visually separating sections of content.',
  attrs: {
    align: {
      validator: V.Align,
      default: 'center',
      description: 'Horizontal alignment of the divider line.',
      examples: ['left', 'center', 'right'],
    },
    'border-color': {
      validator: V.Color,
      default: '#000000',
      description: 'Colour of the divider line.',
      examples: ['#dddddd', '#cccccc'],
    },
    'border-style': {
      validator: V.BorderStyle,
      default: 'solid',
      description: 'CSS border-style of the divider.',
      examples: ['solid', 'dashed', 'dotted'],
    },
    'border-width': {
      validator: V.Px,
      default: '1px',
      description: 'Thickness of the divider line.',
      examples: ['1px', '2px'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing cell.',
      examples: ['#ffffff'],
    },
    'css-class': { validator: V.String, description: 'HTML class names.', examples: ['divider'] },
    padding: {
      validator: V.Padding,
      default: '20px 0',
      description: 'Space above and below the divider.',
      examples: ['20px 0', '32px 0'],
    },
    'padding-top': { validator: V.PxOrPercentage, description: 'Top padding.', examples: ['20px'] },
    'padding-bottom': { validator: V.PxOrPercentage, description: 'Bottom padding.', examples: ['20px'] },
    'padding-left': { validator: V.PxOrPercentage, description: 'Left padding.', examples: ['0px'] },
    'padding-right': { validator: V.PxOrPercentage, description: 'Right padding.', examples: ['0px'] },
    'padding-on-mobile': { validator: V.Padding, description: 'Padding override on mobile.', examples: ['12px 0'] },
    width: {
      validator: V.PxOrPercentage,
      default: '100%',
      description: 'Width of the divider line.',
      examples: ['100%', '80%', '200px'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

const socialSpec = {
  category: 'content',
  description: 'Social media links container. Holds rc-social-element children representing individual social profiles. Can be laid out horizontally or vertically.',
  attrs: {
    align: {
      validator: V.Align,
      default: 'center',
      description: 'Horizontal alignment of the social links group.',
      examples: ['left', 'center', 'right'],
    },
    'border-radius': {
      validator: V.BorderRadius,
      default: '3px',
      description: 'Default border-radius applied to social icons.',
      examples: ['3px', '50%'],
    },
    color: {
      validator: V.Color,
      default: '#333333',
      description: 'Default text colour for social link labels.',
      examples: ['#333333', '#666666'],
    },
    'container-background-color': {
      validator: V.Color,
      description: 'Background colour of the containing cell.',
      examples: ['#ffffff'],
    },
    'css-class': { validator: V.String, description: 'HTML class names.', examples: ['social-bar'] },
    'font-family': {
      validator: V.FontFamily,
      default: 'Helvetica, sans-serif',
      description: 'Font family for social link labels.',
      examples: ['Inter, sans-serif', 'Helvetica, sans-serif'],
    },
    'font-size': {
      validator: V.Px,
      default: '13px',
      description: 'Font size for social link labels.',
      examples: ['13px', '14px'],
    },
    'font-style': { validator: V.FontStyle, description: 'Font style for labels.', examples: ['normal'] },
    'font-weight': {
      validator: V.FontWeight,
      default: '400',
      description: 'Font weight for labels.',
      examples: ['400', '600'],
    },
    'icon-size': {
      validator: V.PxOrPercentage,
      default: '20px',
      description: 'Default icon size applied to all social elements.',
      examples: ['20px', '32px'],
    },
    'icon-height': {
      validator: V.PxOrPercentage,
      description: 'Default icon height when different from width.',
      examples: ['20px'],
    },
    'icon-padding': {
      validator: V.Padding,
      description: 'Default padding around each social icon.',
      examples: ['4px'],
    },
    'inner-padding': {
      validator: V.Padding,
      default: '4px',
      description: 'Padding between icon and label text.',
      examples: ['4px', '0 4px'],
    },
    'line-height': {
      validator: V.PxOrPercentage,
      default: '120%',
      description: 'Line height for social link labels.',
      examples: ['120%', '20px'],
    },
    mode: {
      validator: V.SocialMode,
      default: 'horizontal',
      description: 'Layout direction for the social links.',
      examples: ['horizontal', 'vertical'],
    },
    padding: {
      validator: V.Padding,
      default: '0 0 20px 0',
      description: 'Outer padding around the social block.',
      examples: ['0 0 20px 0', '16px 0'],
    },
    'padding-top': { validator: V.PxOrPercentage, description: 'Top outer padding.', examples: ['16px'] },
    'padding-bottom': { validator: V.PxOrPercentage, description: 'Bottom outer padding.', examples: ['20px'] },
    'padding-left': { validator: V.PxOrPercentage, description: 'Left outer padding.', examples: ['0px'] },
    'padding-right': { validator: V.PxOrPercentage, description: 'Right outer padding.', examples: ['0px'] },
    'padding-on-mobile': { validator: V.Padding, description: 'Padding override on mobile.', examples: ['8px 0'] },
    'table-layout': {
      validator: V.TableLayout,
      description: 'CSS table-layout for the social icons table.',
      examples: ['auto', 'fixed'],
    },
    'text-decoration': {
      validator: V.TextDecoration,
      default: 'none',
      description: 'Text decoration for social link labels.',
      examples: ['none', 'underline'],
    },
    'text-padding': {
      validator: V.Padding,
      description: 'Padding around each social link label text.',
      examples: ['4px 4px 4px 0'],
    },
    'vertical-align': {
      validator: V.VerticalAlign,
      description: 'Vertical alignment of the icons within the row.',
      examples: ['top', 'middle'],
    },
  },
  isLeaf: false,
  validChildTypes: [T.SocialElement],
} as const satisfies RcmlNodeSpec

const socialElementSpec = {
  category: 'content',
  description: 'A single social media link inside an rc-social container. Displays a platform icon (optionally with a text label) that links to a social profile URL.',
  attrs: {
    align: {
      validator: V.Align,
      default: 'left',
      description: 'Alignment of this social link within the row.',
      examples: ['left', 'center'],
    },
    alt: {
      validator: V.String,
      default: '',
      description: 'Alt text for the platform icon.',
      examples: ['Follow us on Twitter', 'Facebook'],
    },
    'background-color': {
      validator: V.Color,
      description: 'Background fill behind the icon (for circle/square shapes).',
      examples: ['#1DA1F2', '#3b5998'],
    },
    'border-radius': {
      validator: V.BorderRadius,
      default: '3px',
      description: 'Border-radius of the icon shape.',
      examples: ['3px', '50%'],
    },
    color: {
      validator: V.Color,
      default: '#333333',
      description: 'Text colour for the link label.',
      examples: ['#333333'],
    },
    'font-family': {
      validator: V.FontFamily,
      default: 'Helvetica, sans-serif',
      description: 'Font family for the link label.',
      examples: ['Inter, sans-serif'],
    },
    'font-size': {
      validator: V.Px,
      default: '13px',
      description: 'Font size for the link label.',
      examples: ['13px', '14px'],
    },
    'font-style': { validator: V.FontStyle, description: 'Font style for the label.', examples: ['normal'] },
    'font-weight': {
      validator: V.FontWeight,
      default: '400',
      description: 'Font weight for the label.',
      examples: ['400'],
    },
    href: {
      validator: V.Url,
      description: "URL of the social profile page. Typically a direct social media URL; may contain placeholder tokens (e.g. `[CustomField:...]`) for per-subscriber personalisation.",
      examples: ['https://twitter.com/rulecom', 'https://facebook.com/rulecom'],
    },
    'icon-height': { validator: V.PxOrPercentage, description: 'Icon height when different from icon-size.', examples: ['20px'] },
    'icon-padding': { validator: V.Padding, description: 'Padding around the icon.', examples: ['4px'] },
    'icon-color': {
      validator: V.SocialIconColor,
      default: 'brand',
      description: "Icon colour theme. 'brand' uses the platform's official colour; 'black' and 'white' produce monochrome variants.",
      examples: ['brand', 'black', 'white'],
    },
    'icon-shape': {
      validator: V.SocialIconShape,
      default: 'original',
      description: "Shape of the icon container. 'original' uses the icon's natural shape; 'circle' and 'square' clip to those shapes.",
      examples: ['original', 'circle', 'square'],
    },
    'icon-size': {
      validator: V.PxOrPercentage,
      description: 'Size of the icon. Overrides the parent rc-social icon-size.',
      examples: ['20px', '32px'],
    },
    'line-height': {
      validator: V.PxOrPercentage,
      default: '120%',
      description: 'Line height for the link label.',
      examples: ['120%'],
    },
    name: {
      validator: V.String,
      description: 'Platform name used as the link label text (e.g. "Twitter", "Facebook").',
      examples: ['Twitter', 'Facebook', 'Instagram'],
    },
    padding: {
      validator: V.Padding,
      default: '4px',
      description: 'Padding around the entire social element.',
      examples: ['4px', '0 8px'],
    },
    'padding-top': { validator: V.PxOrPercentage, description: 'Top padding.', examples: ['4px'] },
    'padding-bottom': { validator: V.PxOrPercentage, description: 'Bottom padding.', examples: ['4px'] },
    'padding-left': { validator: V.PxOrPercentage, description: 'Left padding.', examples: ['4px'] },
    'padding-right': { validator: V.PxOrPercentage, description: 'Right padding.', examples: ['4px'] },
    rel: { validator: V.String, description: 'HTML rel attribute on the anchor.', examples: ['noopener noreferrer'] },
    src: {
      validator: V.Url,
      description: 'URL of a custom icon image. When omitted the built-in platform icon is used.',
      examples: ['https://cdn.example.com/icons/twitter.png'],
    },
    target: {
      validator: V.Target,
      default: '_blank',
      description: 'HTML anchor target.',
      examples: ['_blank'],
    },
    'text-decoration': {
      validator: V.TextDecoration,
      default: 'none',
      description: 'Text decoration for the label.',
      examples: ['none'],
    },
    'text-padding': {
      validator: V.Padding,
      default: '4px 4px 4px 0',
      description: 'Padding around the label text.',
      examples: ['4px 4px 4px 0'],
    },
    title: { validator: V.String, description: 'Tooltip on hover.', examples: ['Follow us on Twitter'] },
    'vertical-align': {
      validator: V.VerticalAlign,
      default: 'middle',
      description: 'Vertical alignment within the row.',
      examples: ['middle', 'top'],
    },
  },
  isLeaf: true,
} as const satisfies RcmlNodeSpec

// ---------------------------------------------------------------------------
// Aggregate
// ---------------------------------------------------------------------------

export const RCML_SCHEMA_SPEC = {
  [T.Rcml]: rcmlSpec,
  [T.Head]: headSpec,
  [T.BrandStyle]: brandStyleSpec,
  [T.Font]: fontSpec,
  [T.Attributes]: attributesSpec,
  [T.Preview]: previewSpec,
  [T.Class]: classSpec,
  [T.PlainText]: plainTextSpec,
  [T.Raw]: rawSpec,
  [T.Body]: bodySpec,
  [T.Section]: sectionSpec,
  [T.Column]: columnSpec,
  [T.Wrapper]: wrapperSpec,
  [T.Group]: groupSpec,
  [T.Switch]: switchSpec,
  [T.Case]: caseSpec,
  [T.Loop]: loopSpec,
  [T.Text]: textSpec,
  [T.Heading]: headingSpec,
  [T.Button]: buttonSpec,
  [T.Image]: imageSpec,
  [T.Logo]: logoSpec,
  [T.Video]: videoSpec,
  [T.Spacer]: spacerSpec,
  [T.Divider]: dividerSpec,
  [T.Social]: socialSpec,
  [T.SocialElement]: socialElementSpec,
} as const satisfies Readonly<Record<RcmlTagName, RcmlNodeSpec>>
