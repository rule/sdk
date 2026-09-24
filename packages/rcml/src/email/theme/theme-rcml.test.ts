import { describe, expect, it } from 'vitest'

import type {
  RcmlAttributes,
  RcmlBody,
  RcmlBrandStyle,
  RcmlClass,
  RcmlHead,
  RcmlSection,
  RcmlSocial,
  RcmlSocialElement,
} from '../rcml-types.js'
import { DEFAULT_FONT_STYLES_MAP } from '../theme-defaults.js'
import {
  EmailThemeColorType,
  EmailThemeFontStyleType,
  EmailThemeImageType,
} from '../theme-types.js'
import {
  type AnyAttrChild,
  CLASS_NAMES_BY_COLOR_TYPE_MAP,
  CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP,
  CLASS_NAMES_BY_IMAGE_TYPE_MAP,
  COLOR_TYPE_BY_CLASS_NAME_MAP,
  EmailThemeRcmlMapper,
  FONT_STYLE_TYPE_BY_CLASS_NAME_MAP,
  IMAGE_TYPE_BY_CLASS_NAME_MAP,
  createFontFamilyAttribute,
  extractBrandStyleIdFromHead,
  extractColorsFromAttributes,
  extractFontStylesFromAttributes,
  extractFontsFromHead,
  extractImagesFromAttributes,
  extractLinksFromAttributes,
  findAttributesInHead,
  overlayFontsInHead,
  parseFontFamilyAttribute,
  upsertBodyBackgroundColor,
  upsertSocialOverlay,
} from './theme-rcml.js'

// ──────────────────────────────────────────────────────────────────────────
// Class-name maps
// ──────────────────────────────────────────────────────────────────────────

describe('class-name maps', () => {
  it('only Secondary has a colour class', () => {
    expect(Object.keys(CLASS_NAMES_BY_COLOR_TYPE_MAP)).toEqual([EmailThemeColorType.Secondary])
  })

  it('Logo image maps to initial + main names', () => {
    expect(CLASS_NAMES_BY_IMAGE_TYPE_MAP[EmailThemeImageType.Logo]).toEqual({
      initial: 'rc-initial-logo',
      main: 'rcml-logo-style',
    })
  })

  it('every font-style type maps to rcml-{type}-style', () => {
    expect(CLASS_NAMES_BY_FONT_STYLE_TYPE_MAP).toEqual({
      [EmailThemeFontStyleType.Paragraph]: 'rcml-p-style',
      [EmailThemeFontStyleType.H1]: 'rcml-h1-style',
      [EmailThemeFontStyleType.H2]: 'rcml-h2-style',
      [EmailThemeFontStyleType.H3]: 'rcml-h3-style',
      [EmailThemeFontStyleType.H4]: 'rcml-h4-style',
      [EmailThemeFontStyleType.ButtonLabel]: 'rcml-label-style',
    })
  })
})

describe('reverse class-name maps', () => {
  it('mirror the forward color map', () => {
    expect(COLOR_TYPE_BY_CLASS_NAME_MAP).toEqual({
      'rcml-brand-color': EmailThemeColorType.Secondary,
    })
  })

  it('mirror the forward image main-name map', () => {
    expect(IMAGE_TYPE_BY_CLASS_NAME_MAP).toEqual({
      'rcml-logo-style': EmailThemeImageType.Logo,
    })
  })

  it('mirror the forward font-style map', () => {
    expect(FONT_STYLE_TYPE_BY_CLASS_NAME_MAP).toEqual({
      'rcml-p-style': EmailThemeFontStyleType.Paragraph,
      'rcml-h1-style': EmailThemeFontStyleType.H1,
      'rcml-h2-style': EmailThemeFontStyleType.H2,
      'rcml-h3-style': EmailThemeFontStyleType.H3,
      'rcml-h4-style': EmailThemeFontStyleType.H4,
      'rcml-label-style': EmailThemeFontStyleType.ButtonLabel,
    })
  })
})

// ──────────────────────────────────────────────────────────────────────────
// EmailThemeRcmlMapper
// ──────────────────────────────────────────────────────────────────────────

describe('EmailThemeRcmlMapper.resolveColorClassName', () => {
  it('returns "rcml-brand-color" for Secondary', () => {
    expect(
      EmailThemeRcmlMapper.resolveColorClassName(EmailThemeColorType.Secondary)
    ).toBe('rcml-brand-color')
  })

  it('returns undefined for colour types with no class (Body/Primary/Background)', () => {
    expect(
      EmailThemeRcmlMapper.resolveColorClassName(EmailThemeColorType.Body)
    ).toBeUndefined()
    expect(
      EmailThemeRcmlMapper.resolveColorClassName(EmailThemeColorType.Primary)
    ).toBeUndefined()
    expect(
      EmailThemeRcmlMapper.resolveColorClassName(EmailThemeColorType.Background)
    ).toBeUndefined()
  })
})

describe('EmailThemeRcmlMapper.resolveImageClassName', () => {
  it('returns the main class name by default', () => {
    expect(EmailThemeRcmlMapper.resolveImageClassName(EmailThemeImageType.Logo)).toBe(
      'rcml-logo-style'
    )
  })

  it('returns the initial class name when isInitial=true', () => {
    expect(
      EmailThemeRcmlMapper.resolveImageClassName(EmailThemeImageType.Logo, true)
    ).toBe('rc-initial-logo')
  })
})

describe('EmailThemeRcmlMapper.resolveFontStyleClassName', () => {
  it('returns rcml-{type}-style for known types', () => {
    expect(
      EmailThemeRcmlMapper.resolveFontStyleClassName(EmailThemeFontStyleType.H3)
    ).toBe('rcml-h3-style')
    expect(
      EmailThemeRcmlMapper.resolveFontStyleClassName(EmailThemeFontStyleType.ButtonLabel)
    ).toBe('rcml-label-style')
  })
})

describe('EmailThemeRcmlMapper.fontStyleToAttributes / attributesToFontStyle', () => {
  it('round-trips a default font-style losslessly', () => {
    const original = DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.Paragraph]
    const attrs = EmailThemeRcmlMapper.fontStyleToAttributes(original)
    const restored = EmailThemeRcmlMapper.attributesToFontStyle(
      EmailThemeFontStyleType.Paragraph,
      attrs
    )

    expect(restored).toEqual(original)
  })

  it('emits kebab-case attribute keys', () => {
    const attrs = EmailThemeRcmlMapper.fontStyleToAttributes(
      DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1]
    )

    expect(Object.keys(attrs).sort()).toEqual(
      [
        'color',
        'font-family',
        'font-size',
        'font-style',
        'font-weight',
        'letter-spacing',
        'line-height',
        'text-decoration',
      ].sort()
    )
  })
})

describe('createFontFamilyAttribute / parseFontFamilyAttribute', () => {
  it('createFontFamilyAttribute builds a single-quoted pair', () => {
    expect(createFontFamilyAttribute('Arial', 'sans-serif')).toBe("'Arial', sans-serif")
  })

  it('parseFontFamilyAttribute round-trips a well-formed value', () => {
    expect(parseFontFamilyAttribute("'Helvetica Neue', sans-serif")).toEqual({
      mainFontFamily: 'Helvetica Neue',
      fallbackFontFamily: 'sans-serif',
    })
  })

  it('returns empty strings for malformed input', () => {
    expect(parseFontFamilyAttribute('Helvetica, sans-serif')).toEqual({
      mainFontFamily: '',
      fallbackFontFamily: '',
    })
  })

  it('returns empty strings for empty input', () => {
    expect(parseFontFamilyAttribute('')).toEqual({
      mainFontFamily: '',
      fallbackFontFamily: '',
    })
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Extractors
// ──────────────────────────────────────────────────────────────────────────

function headWithChildren(children: RcmlHead['children']): RcmlHead {
  return { tagName: 'rc-head', id: 'h', children } as RcmlHead
}

describe('findAttributesInHead', () => {
  it('returns the rc-attributes node when present', () => {
    const attrs = { tagName: 'rc-attributes', id: 'a', children: [] } as RcmlAttributes
    const head = headWithChildren([attrs])

    expect(findAttributesInHead(head)).toBe(attrs)
  })

  it('returns undefined when rc-attributes is missing', () => {
    expect(findAttributesInHead(headWithChildren([]))).toBeUndefined()
  })
})

describe('extractBrandStyleIdFromHead', () => {
  it('reads the id when rc-brand-style is present with a numeric id', () => {
    const brand = { tagName: 'rc-brand-style', id: 'b', attributes: { id: 42 } } as RcmlBrandStyle
    const head = headWithChildren([brand])

    expect(extractBrandStyleIdFromHead(head)).toBe(42)
  })

  it('returns undefined when rc-brand-style is absent', () => {
    expect(extractBrandStyleIdFromHead(headWithChildren([]))).toBeUndefined()
  })

  it('returns undefined when the id attribute is non-numeric', () => {
    const brand = {
      tagName: 'rc-brand-style',
      id: 'b',
      attributes: { id: 'not-a-number' as unknown as number },
    } as RcmlBrandStyle
    const head = headWithChildren([brand])

    expect(extractBrandStyleIdFromHead(head)).toBeUndefined()
  })
})

describe('extractColorsFromAttributes', () => {
  it('reads rc-body/rc-section/rc-button background-color plus the brand-color class', () => {
    const children = [
      { tagName: 'rc-body', id: 'b', attributes: { 'background-color': '#F3F3F3' } } as RcmlBody,
      { tagName: 'rc-section', id: 's', attributes: { 'background-color': '#FFFFFF' }, children: [] } as unknown as RcmlSection,
      { tagName: 'rc-button', id: 'u', attributes: { 'background-color': '#05CC87' } } as unknown as AnyAttrChild,
      {
        tagName: 'rc-class',
        id: 'bc',
        attributes: { name: 'rcml-brand-color', 'background-color': '#F6F8F9' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]
    const out = extractColorsFromAttributes(children)

    expect(out[EmailThemeColorType.Background]?.hex).toBe('#F3F3F3')
    expect(out[EmailThemeColorType.Body]?.hex).toBe('#FFFFFF')
    expect(out[EmailThemeColorType.Primary]?.hex).toBe('#05CC87')
    expect(out[EmailThemeColorType.Secondary]?.hex).toBe('#F6F8F9')
  })

  it('ignores rc-class entries whose name is unknown', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'x',
        attributes: { name: 'my-custom', 'background-color': '#ABCDEF' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractColorsFromAttributes(children)).toEqual({})
  })

  it('ignores rc-class entries without a name attribute', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'x',
        attributes: { 'background-color': '#ABCDEF' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractColorsFromAttributes(children)).toEqual({})
  })

  it('ignores rc-class entries whose name is not a string', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'x',
        attributes: { name: 42 as unknown as string, 'background-color': '#ABCDEF' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractColorsFromAttributes(children)).toEqual({})
  })

  it('ignores rc-body with a missing background-color', () => {
    const children = [
      { tagName: 'rc-body', id: 'b', attributes: {} } as unknown as RcmlBody,
    ] as AnyAttrChild[]

    expect(extractColorsFromAttributes(children)).toEqual({})
  })

  it('ignores rc-body with an empty background-color', () => {
    const children = [
      { tagName: 'rc-body', id: 'b', attributes: { 'background-color': '' } } as unknown as RcmlBody,
    ] as AnyAttrChild[]

    expect(extractColorsFromAttributes(children)).toEqual({})
  })

  it('ignores rc-body without any attributes object', () => {
    const children = [
      { tagName: 'rc-body', id: 'b' } as unknown as RcmlBody,
    ] as AnyAttrChild[]

    expect(extractColorsFromAttributes(children)).toEqual({})
  })

  it('ignores brand-color class when background-color is not a string', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'bc',
        attributes: { name: 'rcml-brand-color', 'background-color': 42 as unknown as string },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractColorsFromAttributes(children)).toEqual({})
  })
})

describe('extractImagesFromAttributes', () => {
  it('reads the logo src from the rcml-logo-style class', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'l',
        attributes: { name: 'rcml-logo-style', src: 'https://example.com/logo.png' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]
    const out = extractImagesFromAttributes(children)

    expect(out[EmailThemeImageType.Logo]?.url).toBe('https://example.com/logo.png')
  })

  it('skips the class when src is missing or empty', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'l',
        attributes: { name: 'rcml-logo-style' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractImagesFromAttributes(children)).toEqual({})
  })

  it('ignores rc-class entries without a name attribute', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'l',
        attributes: { src: 'https://example.com/logo.png' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractImagesFromAttributes(children)).toEqual({})
  })
})

describe('extractFontStylesFromAttributes', () => {
  it('reads a partial rcml-h1-style class and merges with defaults', () => {
    const h1Attrs = {
      name: 'rcml-h1-style',
      color: '#123456',
      'font-size': '40px',
    }
    const children = [
      { tagName: 'rc-class', id: 'c', attributes: h1Attrs } as unknown as RcmlClass,
    ] as AnyAttrChild[]
    const out = extractFontStylesFromAttributes(children)
    const h1 = out[EmailThemeFontStyleType.H1]

    expect(h1?.color).toBe('#123456')
    expect(h1?.fontSize).toBe('40px')
    // Missing fields filled from H1 defaults.
    expect(h1?.fontWeight).toBe(
      DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1].fontWeight
    )
  })

  it('fills font-size and color from defaults when missing', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'c',
        attributes: { name: 'rcml-h1-style', 'font-weight': '900' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]
    const out = extractFontStylesFromAttributes(children)
    const h1 = out[EmailThemeFontStyleType.H1]
    const defaults = DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1]

    expect(h1?.fontWeight).toBe('900')
    expect(h1?.fontSize).toBe(defaults.fontSize)
    expect(h1?.color).toBe(defaults.color)
  })

  it('treats an rc-class with no attributes as fully-default', () => {
    const children = [
      { tagName: 'rc-class', id: 'c' } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractFontStylesFromAttributes(children)).toEqual({})
  })

  it('ignores rc-class entries without a name attribute', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'c',
        attributes: { color: '#123456' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractFontStylesFromAttributes(children)).toEqual({})
  })

  it('ignores rc-class entries whose name is not a string', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'c',
        attributes: { name: 99 as unknown as string, color: '#123456' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractFontStylesFromAttributes(children)).toEqual({})
  })

  it('ignores rc-class entries whose name does not match a font-style slot', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'c',
        attributes: { name: 'rcml-not-a-font-style', color: '#123456' },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]

    expect(extractFontStylesFromAttributes(children)).toEqual({})
  })

  it('treats a non-string color as missing and falls back to default', () => {
    const children = [
      {
        tagName: 'rc-class',
        id: 'c',
        attributes: { name: 'rcml-h1-style', color: 123 as unknown as string },
      } as unknown as RcmlClass,
    ] as AnyAttrChild[]
    const out = extractFontStylesFromAttributes(children)
    const h1 = out[EmailThemeFontStyleType.H1]
    const defaults = DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1]

    expect(h1?.color).toBe(defaults.color)
  })
})

describe('extractLinksFromAttributes', () => {
  it('reads known link types from rc-social children', () => {
    const social = {
      tagName: 'rc-social',
      id: 'so',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'fb',
          attributes: { name: 'facebook', href: 'https://fb.example/' },
        } as unknown as RcmlSocialElement,
      ],
    } as unknown as RcmlSocial
    const out = extractLinksFromAttributes([social as unknown as AnyAttrChild])

    expect(out.facebook?.url).toBe('https://fb.example/')
  })

  it('returns an empty map when rc-social is absent', () => {
    expect(extractLinksFromAttributes([])).toEqual({})
  })

  it('ignores rc-social-element entries with unknown names', () => {
    const social = {
      tagName: 'rc-social',
      id: 'so',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'my',
          attributes: { name: 'myspace', href: 'https://myspace.example/' },
        } as unknown as RcmlSocialElement,
      ],
    } as unknown as RcmlSocial

    expect(extractLinksFromAttributes([social as unknown as AnyAttrChild])).toEqual({})
  })

  it('ignores elements missing a name or href', () => {
    const social = {
      tagName: 'rc-social',
      id: 'so',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'no-name',
          attributes: { href: 'https://x.example/' },
        } as unknown as RcmlSocialElement,
        {
          tagName: 'rc-social-element',
          id: 'no-href',
          attributes: { name: 'facebook' },
        } as unknown as RcmlSocialElement,
      ],
    } as unknown as RcmlSocial

    expect(extractLinksFromAttributes([social as unknown as AnyAttrChild])).toEqual({})
  })

  it('first entry wins for duplicate names', () => {
    const social = {
      tagName: 'rc-social',
      id: 'so',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'fb1',
          attributes: { name: 'facebook', href: 'https://first.example/' },
        } as unknown as RcmlSocialElement,
        {
          tagName: 'rc-social-element',
          id: 'fb2',
          attributes: { name: 'facebook', href: 'https://second.example/' },
        } as unknown as RcmlSocialElement,
      ],
    } as unknown as RcmlSocial

    expect(
      extractLinksFromAttributes([social as unknown as AnyAttrChild]).facebook?.url
    ).toBe('https://first.example/')
  })

  it('maps name="web" (the correct RCML value) to the website slot', () => {
    const social = {
      tagName: 'rc-social',
      id: 'so',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'web',
          attributes: { name: 'web', href: 'https://acme.example/' },
        } as unknown as RcmlSocialElement,
      ],
    } as unknown as RcmlSocial

    expect(
      extractLinksFromAttributes([social as unknown as AnyAttrChild]).website
    ).toEqual({ type: 'website', url: 'https://acme.example/' })
  })

  it('also maps the legacy name="website" value to the website slot (reads documents written before this fix)', () => {
    const social = {
      tagName: 'rc-social',
      id: 'so',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'legacy',
          attributes: { name: 'website', href: 'https://acme.example/' },
        } as unknown as RcmlSocialElement,
      ],
    } as unknown as RcmlSocial

    expect(
      extractLinksFromAttributes([social as unknown as AnyAttrChild]).website
    ).toEqual({ type: 'website', url: 'https://acme.example/' })
  })
})

describe('extractFontsFromHead', () => {
  it('reads rc-font children, unwrapping single-quoted names', () => {
    const head = headWithChildren([
      {
        tagName: 'rc-font',
        id: 'f',
        attributes: { name: "'Merriweather'", href: 'https://fonts.example/m.css' },
      },
    ] as unknown as RcmlHead['children'])

    expect(extractFontsFromHead(head)).toEqual([
      { fontFamily: 'Merriweather', url: 'https://fonts.example/m.css' },
    ])
  })

  it('handles a name without quotes', () => {
    const head = headWithChildren([
      {
        tagName: 'rc-font',
        id: 'f',
        attributes: { name: 'SystemFont' },
      },
    ] as unknown as RcmlHead['children'])

    expect(extractFontsFromHead(head)).toEqual([{ fontFamily: 'SystemFont' }])
  })

  it('returns [] when no rc-font children are present', () => {
    expect(extractFontsFromHead(headWithChildren([]))).toEqual([])
  })

  it('skips rc-font nodes with a missing or empty name', () => {
    const head = headWithChildren([
      {
        tagName: 'rc-font',
        id: 'f1',
        attributes: { href: 'https://fonts.example/x.css' },
      },
      {
        tagName: 'rc-font',
        id: 'f2',
        attributes: { name: '', href: 'https://fonts.example/y.css' },
      },
    ] as unknown as RcmlHead['children'])

    expect(extractFontsFromHead(head)).toEqual([])
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Upsert helpers — direct unit coverage for edge cases the public
// orchestrator does not exercise.
// ──────────────────────────────────────────────────────────────────────────

describe('upsertBodyBackgroundColor', () => {
  it('updates in place when the rc-body exists without an attributes object', () => {
    const children = [
      { tagName: 'rc-body', id: 'b' } as unknown as AnyAttrChild,
    ]

    upsertBodyBackgroundColor(children, '#112233')

    expect(
      (children[0] as RcmlBody).attributes
    ).toEqual({ 'background-color': '#112233' })
  })
})

describe('upsertSocialOverlay', () => {
  it('is a no-op when called with an empty link list', () => {
    const children: AnyAttrChild[] = []

    upsertSocialOverlay(children, [])

    expect(children).toEqual([])
  })

  it('dedups existing elements sharing the same name (first wins)', () => {
    const children = [
      {
        tagName: 'rc-social',
        id: 'so',
        children: [
          {
            tagName: 'rc-social-element',
            id: 'fb1',
            attributes: { name: 'facebook', href: 'https://first.example/' },
          },
          {
            tagName: 'rc-social-element',
            id: 'fb2',
            attributes: { name: 'facebook', href: 'https://dup.example/' },
          },
        ],
      } as unknown as AnyAttrChild,
    ]

    upsertSocialOverlay(children, [
      { type: 'facebook', url: 'https://new.example/' },
    ])

    const social = children[0] as unknown as RcmlSocial

    expect(social.children.length).toBe(1)
    expect(
      (social.children[0] as RcmlSocialElement).attributes.href
    ).toBe('https://new.example/')
    expect((social.children[0] as RcmlSocialElement).id).toBe('fb1')
  })

  it('skips pre-existing elements with a non-string name', () => {
    const children = [
      {
        tagName: 'rc-social',
        id: 'so',
        children: [
          {
            tagName: 'rc-social-element',
            id: 'bad',
            attributes: { href: 'https://orphan.example/' },
          },
        ],
      } as unknown as AnyAttrChild,
    ]

    upsertSocialOverlay(children, [
      { type: 'facebook', url: 'https://new.example/' },
    ])

    const social = children[0] as unknown as RcmlSocial

    // Original orphan element kept, new facebook element appended.
    expect(social.children.length).toBe(2)
    expect(
      (social.children[1] as RcmlSocialElement).attributes.href
    ).toBe('https://new.example/')
  })

  it('updates an existing element that has no attributes object', () => {
    const children = [
      {
        tagName: 'rc-social',
        id: 'so',
        children: [
          {
            tagName: 'rc-social-element',
            id: 'fb',
            attributes: { name: 'facebook' },
          },
        ],
      } as unknown as AnyAttrChild,
    ]

    upsertSocialOverlay(children, [
      { type: 'facebook', url: 'https://fb.example/' },
    ])

    const social = children[0] as unknown as RcmlSocial

    expect(
      (social.children[0] as RcmlSocialElement).attributes.href
    ).toBe('https://fb.example/')
  })

  it('writes name="web" for the website slot, not the theme bucket key "website"', () => {
    const children: AnyAttrChild[] = []

    upsertSocialOverlay(children, [
      { type: 'website', url: 'https://acme.example/' },
    ])

    const social = children[0] as unknown as RcmlSocial

    expect((social.children[0] as RcmlSocialElement).attributes.name).toBe('web')
  })

  it('heals a pre-existing legacy name="website" element to "web" on re-apply, even when the href is unchanged', () => {
    const children = [
      {
        tagName: 'rc-social',
        id: 'so',
        children: [
          {
            tagName: 'rc-social-element',
            id: 'legacy',
            attributes: { name: 'website', href: 'https://acme.example/' },
          },
        ],
      } as unknown as AnyAttrChild,
    ]

    upsertSocialOverlay(children, [
      { type: 'website', url: 'https://acme.example/' },
    ])

    const social = children[0] as unknown as RcmlSocial

    expect(social.children.length).toBe(1)
    expect((social.children[0] as RcmlSocialElement).attributes.name).toBe('web')
    expect((social.children[0] as RcmlSocialElement).id).toBe('legacy')
  })
})

describe('overlayFontsInHead', () => {
  it('returns children unchanged when every font lacks a url', () => {
    const headChildren = [
      { tagName: 'rc-attributes', id: 'a', children: [] },
    ] as unknown as RcmlHead['children']

    const out = overlayFontsInHead(headChildren, [{ fontFamily: 'System' }])

    expect(out).toBe(headChildren)
  })

  it('leaves an existing rc-font with no name attribute alone and appends the new one', () => {
    const headChildren = [
      {
        tagName: 'rc-font',
        id: 'orphan',
        attributes: { href: 'https://fonts.example/orphan.css' },
      },
    ] as unknown as RcmlHead['children']

    const out = overlayFontsInHead(headChildren, [
      { fontFamily: 'Arial', url: 'https://fonts.example/arial.css' },
    ])

    expect(out.length).toBe(2)
    expect(out[1]).toMatchObject({
      tagName: 'rc-font',
      attributes: { name: "'Arial'" },
    })
  })

  it('updates an existing rc-font that has no attributes object', () => {
    const headChildren = [
      {
        tagName: 'rc-font',
        id: 'orphan',
      },
    ] as unknown as RcmlHead['children']

    // A font with an empty fontFamily matches the orphan (whose family key
    // defaults to ''), exercising the `existing.attributes ?? {}` fallback.
    const out = overlayFontsInHead(headChildren, [
      { fontFamily: '', url: 'https://fonts.example/x.css' },
    ])

    expect(out.length).toBe(1)
    expect((out[0] as unknown as { attributes?: { name: string; href: string } }).attributes).toEqual({
      name: "''",
      href: 'https://fonts.example/x.css',
    })
  })

  it('does not re-quote a fontFamily that is already single-quoted', () => {
    const headChildren = [] as unknown as RcmlHead['children']

    const out = overlayFontsInHead(headChildren, [
      { fontFamily: "'Arial'", url: 'https://fonts.example/arial.css' },
    ])

    expect(out.length).toBe(1)
    expect((out[0] as unknown as { attributes?: { name: string } }).attributes?.name).toBe(
      "'Arial'"
    )
  })
})
