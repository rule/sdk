import { describe, expect, it } from 'vitest'

import type { EmailThemeSocialLink } from './theme-types.js'
import { createEmailTheme } from './create-theme.js'
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

describe('createEmailTheme — defaults', () => {
  it('seeds every field from theme-defaults when called with no argument', () => {
    const theme = createEmailTheme()

    expect(theme.brandStyleId).toBeUndefined()
    expect(theme.colors).toEqual(DEFAULT_COLORS_MAP)
    expect(theme.links).toEqual(DEFAULT_LINKS_MAP)
    expect(theme.images).toEqual({})
    expect(theme.fonts).toEqual([])
    expect(theme.fontStyles).toEqual(DEFAULT_FONT_STYLES_MAP)
  })

  it('returns a deep copy of the defaults (mutating the output never leaks)', () => {
    const a = createEmailTheme()
    const b = createEmailTheme()

    expect(a.colors).not.toBe(b.colors)
    expect(a.fontStyles).not.toBe(b.fontStyles)
    expect(a.fontStyles[EmailThemeFontStyleType.H1]).not.toBe(
      b.fontStyles[EmailThemeFontStyleType.H1]
    )
  })

  it('is not === to a previously-built theme but is structurally equal', () => {
    const a = createEmailTheme()
    const b = createEmailTheme()

    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })

  it('round-trips through JSON.stringify', () => {
    const theme = createEmailTheme()
    const restored = JSON.parse(JSON.stringify(theme)) as ReturnType<typeof createEmailTheme>

    expect(restored).toEqual(theme)
  })
})

describe('createEmailTheme — individual overrides', () => {
  it('applies brandStyleId', () => {
    const theme = createEmailTheme({ brandStyleId: 42 })

    expect(theme.brandStyleId).toBe(42)
  })

  it('applies colors with reset-then-overlay semantics', () => {
    const theme = createEmailTheme({
      colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
    })

    expect(theme.colors[EmailThemeColorType.Primary]?.hex).toBe('#FF0000')
    // Unspecified slot still at default.
    expect(theme.colors[EmailThemeColorType.Background]?.hex).toBe(
      DEFAULT_COLORS_MAP[EmailThemeColorType.Background].hex
    )
  })

  it('applies links with reset-then-overlay semantics', () => {
    const theme = createEmailTheme({
      links: [{ type: 'facebook', url: 'https://fb.example/acme' }],
    })

    expect(theme.links.facebook?.url).toBe('https://fb.example/acme')
    // Unspecified slot still at default (not cleared).
    expect(theme.links.instagram?.url).toBe(DEFAULT_LINKS_MAP.instagram.url)
  })

  it('treats a legacy "website" link as the "web" slot', () => {
    const theme = createEmailTheme({
      links: [{ type: 'website', url: 'https://acme.example/' }] as unknown as EmailThemeSocialLink[],
    })

    expect(theme.links.web?.url).toBe('https://acme.example/')
    expect(Object.keys(theme.links)).not.toContain('website')
  })

  it('applies images via full replace', () => {
    const theme = createEmailTheme({
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })

    expect(theme.images[EmailThemeImageType.Logo]?.url).toBe('https://example.com/logo.png')
  })

  it('applies fonts via full replace', () => {
    const theme = createEmailTheme({
      fonts: [{ fontFamily: 'Merriweather', url: 'https://fonts.example/m.css' }],
    })

    expect(theme.fonts).toEqual([
      { fontFamily: 'Merriweather', url: 'https://fonts.example/m.css' },
    ])
  })

  it('applies fontStyles with partial-merge per slot', () => {
    const theme = createEmailTheme({
      fontStyles: [{ type: EmailThemeFontStyleType.H1, color: '#112233' }],
    })
    const h1 = theme.fontStyles[EmailThemeFontStyleType.H1]

    expect(h1.color).toBe('#112233')
    // Other fields retain the H1 defaults (size 36px, weight 700).
    expect(h1.fontSize).toBe(DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1].fontSize)
    expect(h1.fontWeight).toBe(
      DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1].fontWeight
    )
  })
})

describe('createEmailTheme — overrides combinations', () => {
  it('applies every bucket at once', () => {
    const theme = createEmailTheme({
      brandStyleId: 7,
      colors: [{ type: EmailThemeColorType.Primary, hex: '#0000FF' }],
      links: [{ type: 'x', url: 'https://x.example/acme' }],
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
      fonts: [{ fontFamily: 'Merriweather', url: 'https://fonts.example/m.css' }],
      fontStyles: [{ type: EmailThemeFontStyleType.Paragraph, fontSize: '18px' }],
    })

    expect(theme.brandStyleId).toBe(7)
    expect(theme.colors[EmailThemeColorType.Primary]?.hex).toBe('#0000FF')
    expect(theme.links.x?.url).toBe('https://x.example/acme')
    expect(theme.images[EmailThemeImageType.Logo]?.url).toBe('https://example.com/logo.png')
    expect(theme.fonts).toHaveLength(1)
    expect(theme.fontStyles[EmailThemeFontStyleType.Paragraph].fontSize).toBe('18px')
  })

  it('ignores unknown color types silently', () => {
    const theme = createEmailTheme({
      colors: [
        { type: 'not-a-real-type' as unknown as EmailThemeColorType, hex: '#000000' },
        { type: EmailThemeColorType.Secondary, hex: '#ABCDEF' },
      ],
    })

    expect(theme.colors[EmailThemeColorType.Secondary]?.hex).toBe('#ABCDEF')
  })

  it('empty override arrays act as "reset to defaults" (for reset buckets)', () => {
    const theme = createEmailTheme({ colors: [], links: [] })

    // Reset buckets: defaults retained.
    expect(theme.colors).toEqual(DEFAULT_COLORS_MAP)
    expect(theme.links).toEqual(DEFAULT_LINKS_MAP)
  })

  it('empty override arrays clear the collection (for replace buckets)', () => {
    const theme = createEmailTheme({ images: [], fonts: [] })

    // Replace buckets: cleared.
    expect(theme.images).toEqual({})
    expect(theme.fonts).toEqual([])
  })
})

describe('createEmailTheme — purity', () => {
  it('two successive calls do not share state', () => {
    const a = createEmailTheme({ brandStyleId: 1 })
    const b = createEmailTheme({ brandStyleId: 2 })

    expect(a.brandStyleId).toBe(1)
    expect(b.brandStyleId).toBe(2)
  })

  it('mutating the overrides argument after the call does not affect the theme', () => {
    const colors = [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }]
    const theme = createEmailTheme({ colors })

    colors[0]!.hex = '#000000'

    // The theme kept its own copy.
    expect(theme.colors[EmailThemeColorType.Primary]?.hex).toBe('#FF0000')
  })
})
