import { describe, expect, it } from 'vitest'

import type { RcmlBody, RcmlDocument, RcmlHead } from './rcml-types.js'
import { applyTheme } from './apply-theme.js'
import { createEmailTheme } from './create-theme.js'
import { getTheme } from './get-theme.js'
import {
  DEFAULT_COLORS_MAP,
  DEFAULT_FONT_STYLES_MAP,
  DEFAULT_LINKS_MAP,
} from './theme-defaults.js'
import {
  EmailThemeColorType,
  EmailThemeFontStyleType,
  EmailThemeImageType,
} from './theme-types.js'

// ──────────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────────

function bareDoc(): RcmlDocument {
  return {
    tagName: 'rcml',
    id: 'doc',
    children: [
      { tagName: 'rc-head', id: 'head', children: [] } as RcmlHead,
      { tagName: 'rc-body', id: 'body', children: [] } as unknown as RcmlBody,
    ],
  } as RcmlDocument
}

// ──────────────────────────────────────────────────────────────────────────
// Shape
// ──────────────────────────────────────────────────────────────────────────

describe('getTheme — shape', () => {
  it('returns a theme equal to createEmailTheme() when the doc has no theme', () => {
    expect(getTheme(bareDoc())).toEqual(createEmailTheme())
  })

  it('does not mutate the input document', () => {
    const doc = applyTheme(bareDoc(), createEmailTheme({ brandStyleId: 42 }))
    const snapshot = JSON.stringify(doc)

    getTheme(doc)

    expect(JSON.stringify(doc)).toBe(snapshot)
  })

  it('always returns a full theme (all default slots populated)', () => {
    const theme = getTheme(bareDoc())

    expect(theme.colors).toEqual(DEFAULT_COLORS_MAP)
    expect(theme.fontStyles).toEqual(DEFAULT_FONT_STYLES_MAP)
    expect(theme.fonts).toEqual([])
    expect(theme.images).toEqual({})
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Per-bucket extraction
// ──────────────────────────────────────────────────────────────────────────

describe('getTheme — brand style id', () => {
  it('reads rc-brand-style@id from the head', () => {
    const doc = applyTheme(bareDoc(), { brandStyleId: 99 })

    expect(getTheme(doc).brandStyleId).toBe(99)
  })

  it('returns undefined when the head lacks rc-brand-style', () => {
    expect(getTheme(bareDoc()).brandStyleId).toBeUndefined()
  })
})

describe('getTheme — colors', () => {
  it('reads the Primary slot from rc-button background-color', () => {
    const doc = applyTheme(bareDoc(), {
      colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
    })

    expect(getTheme(doc).colors[EmailThemeColorType.Primary]?.hex).toBe('#FF0000')
  })

  it('reads the Background slot from rc-body background-color', () => {
    const doc = applyTheme(bareDoc(), {
      colors: [{ type: EmailThemeColorType.Background, hex: '#112233' }],
    })

    expect(getTheme(doc).colors[EmailThemeColorType.Background]?.hex).toBe('#112233')
  })

  it('reads the Body slot from rc-section background-color', () => {
    const doc = applyTheme(bareDoc(), {
      colors: [{ type: EmailThemeColorType.Body, hex: '#445566' }],
    })

    expect(getTheme(doc).colors[EmailThemeColorType.Body]?.hex).toBe('#445566')
  })

  it('reads the Secondary slot from the rcml-brand-color class', () => {
    const doc = applyTheme(bareDoc(), {
      colors: [{ type: EmailThemeColorType.Secondary, hex: '#778899' }],
    })

    expect(getTheme(doc).colors[EmailThemeColorType.Secondary]?.hex).toBe('#778899')
  })

  it('unpatched slots keep the defaults', () => {
    const doc = applyTheme(bareDoc(), {
      colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
    })
    const theme = getTheme(doc)

    expect(theme.colors[EmailThemeColorType.Background]?.hex).toBe(
      DEFAULT_COLORS_MAP[EmailThemeColorType.Background].hex
    )
  })
})

describe('getTheme — images', () => {
  it('reads the Logo slot from the rcml-logo-style class src', () => {
    const doc = applyTheme(bareDoc(), {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })

    expect(getTheme(doc).images[EmailThemeImageType.Logo]?.url).toBe(
      'https://example.com/logo.png'
    )
  })

  it('returns an empty map when no logo class exists', () => {
    expect(getTheme(bareDoc()).images).toEqual({})
  })
})

describe('getTheme — links', () => {
  it('reads social links from rc-social elements', () => {
    const doc = applyTheme(bareDoc(), {
      links: [
        { type: 'facebook', url: 'https://fb.example/acme' },
        { type: 'instagram', url: 'https://ig.example/acme' },
      ],
    })
    const theme = getTheme(doc)

    expect(theme.links.facebook?.url).toBe('https://fb.example/acme')
    expect(theme.links.instagram?.url).toBe('https://ig.example/acme')
  })

  it('unpatched link slots keep the defaults', () => {
    const doc = applyTheme(bareDoc(), {
      links: [{ type: 'facebook', url: 'https://fb.example/acme' }],
    })
    const theme = getTheme(doc)

    // tiktok not in the patch → default URL retained.
    expect(theme.links.tiktok?.url).toBe(DEFAULT_LINKS_MAP.tiktok.url)
  })

  it('ignores rc-social-element entries with unknown name', () => {
    const doc = applyTheme(bareDoc(), {
      links: [{ type: 'facebook', url: 'https://fb.example/' }],
    })
    const social = (doc.children[0] as RcmlHead).children.find(
      (c) => c.tagName === 'rc-attributes'
    )! as { children: Array<{ tagName: string; children?: Array<unknown> }> }
    const socialBlock = social.children.find((c) => c.tagName === 'rc-social') as
      | { children: Array<{ tagName: string; attributes: { name: string; href: string } }> }
      | undefined

    // Inject an unknown-named element directly.
    socialBlock!.children.push({
      tagName: 'rc-social-element',
      attributes: { name: 'myspace', href: 'https://myspace.example/' },
    })

    const theme = getTheme(doc)

    expect(theme.links.facebook?.url).toBe('https://fb.example/')
    expect((theme.links as Record<string, unknown>).myspace).toBeUndefined()
  })
})

describe('getTheme — fonts', () => {
  it('reads rc-font children with url in order', () => {
    const doc = applyTheme(bareDoc(), {
      fonts: [
        { fontFamily: 'Merriweather', url: 'https://fonts.example/m.css' },
        { fontFamily: 'OpenSans', url: 'https://fonts.example/o.css' },
      ],
    })
    const theme = getTheme(doc)

    expect(theme.fonts).toHaveLength(2)
    expect(theme.fonts[0]!.fontFamily).toBe('Merriweather')
    expect(theme.fonts[0]!.url).toBe('https://fonts.example/m.css')
    expect(theme.fonts[1]!.fontFamily).toBe('OpenSans')
  })

  it('returns an empty array when no rc-font children exist', () => {
    expect(getTheme(bareDoc()).fonts).toEqual([])
  })
})

describe('getTheme — font styles', () => {
  it('reads a partial font-style class and fills missing fields with defaults', () => {
    const doc = applyTheme(bareDoc(), {
      fontStyles: [{ type: EmailThemeFontStyleType.H1, color: '#123456' }],
    })
    const h1 = getTheme(doc).fontStyles[EmailThemeFontStyleType.H1]

    expect(h1.color).toBe('#123456')
    expect(h1.fontSize).toBe(DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1].fontSize)
    expect(h1.fontWeight).toBe(
      DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1].fontWeight
    )
  })

  it('unpatched font-style types keep the defaults', () => {
    const doc = applyTheme(bareDoc(), {
      fontStyles: [{ type: EmailThemeFontStyleType.H1, color: '#123456' }],
    })
    const theme = getTheme(doc)

    expect(theme.fontStyles[EmailThemeFontStyleType.Paragraph]).toEqual(
      DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.Paragraph]
    )
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Unknown nodes
// ──────────────────────────────────────────────────────────────────────────

describe('getTheme — unknown nodes', () => {
  it('ignores rc-class entries whose name is not in the theme vocabulary', () => {
    const doc = applyTheme(bareDoc(), createEmailTheme())
    const attrs = (doc.children[0] as RcmlHead).children.find(
      (c) => c.tagName === 'rc-attributes'
    ) as unknown as { children: Array<Record<string, unknown>> }

    attrs.children.push({
      tagName: 'rc-class',
      id: 'custom',
      attributes: { name: 'my-custom', color: '#AABBCC' },
    })

    // getTheme should still equal the original theme.
    expect(getTheme(doc)).toEqual(createEmailTheme())
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Round-trip
// ──────────────────────────────────────────────────────────────────────────

describe('getTheme — round-trip with applyTheme', () => {
  it('default theme round-trips through a bare doc', () => {
    const seed = createEmailTheme()
    const extracted = getTheme(applyTheme(bareDoc(), seed))

    expect(extracted).toEqual(seed)
  })

  it('theme with custom colours and brand id round-trips', () => {
    const seed = createEmailTheme({
      brandStyleId: 77,
      colors: [
        { type: EmailThemeColorType.Primary, hex: '#AA0000' },
        { type: EmailThemeColorType.Secondary, hex: '#00BB00' },
        { type: EmailThemeColorType.Body, hex: '#FFFFFF' },
        { type: EmailThemeColorType.Background, hex: '#000000' },
      ],
    })
    const extracted = getTheme(applyTheme(bareDoc(), seed))

    expect(extracted).toEqual(seed)
  })

  it('theme with logo, links, fonts, and font-style overrides round-trips', () => {
    const seed = createEmailTheme({
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
      links: [
        { type: 'facebook', url: 'https://fb.example/acme' },
        { type: 'instagram', url: 'https://ig.example/acme' },
      ],
      fonts: [{ fontFamily: 'Merriweather', url: 'https://fonts.example/m.css' }],
      fontStyles: [
        { type: EmailThemeFontStyleType.H1, color: '#123456', fontSize: '40px' },
      ],
    })
    const extracted = getTheme(applyTheme(bareDoc(), seed))

    expect(extracted).toEqual(seed)
  })
})
