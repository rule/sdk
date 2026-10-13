import { describe, expect, it } from 'vitest'

import { EmailThemeColorType, EmailThemeFontStyleType } from './theme-types.js'
import {
  DEFAULT_COLORS_MAP,
  DEFAULT_FALLBACK_FONT_FAMILIES_MAP,
  DEFAULT_FONT_STYLES_MAP,
  DEFAULT_FONT_STYLE_BASE,
  DEFAULT_LINKS_MAP,
  DEFAULT_MAIN_FONT_FAMILIES_MAP,
  DefaultFontFamily,
  getConfiguredSocialLinks,
  getFallbackFontFamily,
} from './theme-defaults.js'

describe('DEFAULT_COLORS_MAP', () => {
  it('has an entry for every colour slot', () => {
    const keys = Object.keys(DEFAULT_COLORS_MAP) as EmailThemeColorType[]

    expect(keys.sort()).toEqual(
      [
        EmailThemeColorType.Body,
        EmailThemeColorType.Primary,
        EmailThemeColorType.Secondary,
        EmailThemeColorType.Background,
      ].sort()
    )
  })

  it('every entry points at its own type', () => {
    for (const [type, entry] of Object.entries(DEFAULT_COLORS_MAP)) {
      expect(entry.type).toBe(type)
    }
  })
})

describe('DEFAULT_LINKS_MAP', () => {
  it('has an entry for every social slot', () => {
    expect(Object.keys(DEFAULT_LINKS_MAP).sort()).toEqual(
      ['facebook', 'instagram', 'linkedin', 'tiktok', 'web', 'x'].sort()
    )
  })

  it('every entry is an http(s) URL (parseable)', () => {
    for (const entry of Object.values(DEFAULT_LINKS_MAP)) {
      // Should not throw.
      const url = new URL(entry.url)

      expect(url.protocol).toMatch(/^https?:$/)
    }
  })
})

describe('DEFAULT_FONT_STYLES_MAP', () => {
  it('has an entry for every font-style slot', () => {
    expect(Object.keys(DEFAULT_FONT_STYLES_MAP).sort()).toEqual(
      [
        EmailThemeFontStyleType.Paragraph,
        EmailThemeFontStyleType.H1,
        EmailThemeFontStyleType.H2,
        EmailThemeFontStyleType.H3,
        EmailThemeFontStyleType.H4,
        EmailThemeFontStyleType.ButtonLabel,
      ].sort()
    )
  })

  it('every entry builds off DEFAULT_FONT_STYLE_BASE', () => {
    for (const entry of Object.values(DEFAULT_FONT_STYLES_MAP)) {
      expect(entry.fontFamily).toBe(DEFAULT_FONT_STYLE_BASE.fontFamily)
      expect(entry.lineHeight).toBe(DEFAULT_FONT_STYLE_BASE.lineHeight)
      expect(entry.letterSpacing).toBe(DEFAULT_FONT_STYLE_BASE.letterSpacing)
      expect(entry.textDecoration).toBe(DEFAULT_FONT_STYLE_BASE.textDecoration)
    }
  })

  it('heading slots have weight 700; paragraph stays at 400', () => {
    expect(DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H1].fontWeight).toBe('700')
    expect(DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.H4].fontWeight).toBe('700')
    expect(DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.Paragraph].fontWeight).toBe('400')
  })

  it('ButtonLabel has white text for contrast on the accent button', () => {
    expect(DEFAULT_FONT_STYLES_MAP[EmailThemeFontStyleType.ButtonLabel].color).toBe('#FFFFFF')
  })
})

describe('DefaultFontFamily enum + family maps', () => {
  it('DEFAULT_MAIN_FONT_FAMILIES_MAP and DEFAULT_FALLBACK_FONT_FAMILIES_MAP share keys', () => {
    expect(Object.keys(DEFAULT_MAIN_FONT_FAMILIES_MAP).sort()).toEqual(
      Object.keys(DEFAULT_FALLBACK_FONT_FAMILIES_MAP).sort()
    )
  })

  it('Helvetica maps to the Helvetica display family', () => {
    expect(DEFAULT_MAIN_FONT_FAMILIES_MAP[DefaultFontFamily.Helvetica]).toBe('Helvetica')
  })

  it('TrebuchetMS exposes the spaced display name', () => {
    expect(DEFAULT_MAIN_FONT_FAMILIES_MAP[DefaultFontFamily.TrebuchetMS]).toBe('Trebuchet MS')
  })
})

describe('getFallbackFontFamily', () => {
  it('returns sans-serif for sans-serif families', () => {
    expect(getFallbackFontFamily(DefaultFontFamily.Arial)).toBe('sans-serif')
    expect(getFallbackFontFamily(DefaultFontFamily.Helvetica)).toBe('sans-serif')
  })

  it('returns serif for serif families', () => {
    expect(getFallbackFontFamily(DefaultFontFamily.TimesNewRoman)).toBe('serif')
    expect(getFallbackFontFamily(DefaultFontFamily.Georgia)).toBe('serif')
  })

  it('returns monospace for CourierNew', () => {
    expect(getFallbackFontFamily(DefaultFontFamily.CourierNew)).toBe('monospace')
  })

  it('returns cursive for BrushScriptMT', () => {
    expect(getFallbackFontFamily(DefaultFontFamily.BrushScriptMT)).toBe('cursive')
  })

  it('falls back to sans-serif (Helvetica default) for unknown families', () => {
    expect(getFallbackFontFamily('Totally Fake Font')).toBe('sans-serif')
    expect(getFallbackFontFamily('')).toBe('sans-serif')
  })
})

describe('getConfiguredSocialLinks', () => {
  it('returns an empty array when every slot is at its default', () => {
    const result = getConfiguredSocialLinks(DEFAULT_LINKS_MAP)

    expect(result).toEqual([])
  })

  it('returns only the slots whose URL differs from the default', () => {
    const result = getConfiguredSocialLinks({
      ...DEFAULT_LINKS_MAP,
      facebook: { type: 'facebook', url: 'https://facebook.com/acme' },
      web: { type: 'web', url: 'https://acme.example/' },
    })

    expect(result).toEqual([
      { type: 'facebook', url: 'https://facebook.com/acme' },
      { type: 'web', url: 'https://acme.example/' },
    ])
  })

  it('returns a legacy "website" key (persisted theme) as the "web" slot instead of throwing', () => {
    const result = getConfiguredSocialLinks({
      website: { type: 'website', url: 'https://acme.example/' },
    } as unknown as Parameters<typeof getConfiguredSocialLinks>[0])

    expect(result).toEqual([{ type: 'web', url: 'https://acme.example/' }])
  })

  it('treats a legacy "website" link at the default URL as not configured', () => {
    const result = getConfiguredSocialLinks({
      website: { type: 'website', url: DEFAULT_LINKS_MAP.web.url },
    } as unknown as Parameters<typeof getConfiguredSocialLinks>[0])

    expect(result).toEqual([])
  })

  it('ignores an entry with an unknown type instead of throwing', () => {
    const result = getConfiguredSocialLinks({
      myspace: { type: 'myspace', url: 'https://myspace.example/acme' },
    } as unknown as Parameters<typeof getConfiguredSocialLinks>[0])

    expect(result).toEqual([])
  })

  it('skips slots that are absent from the map', () => {
    const result = getConfiguredSocialLinks({
      facebook: { type: 'facebook', url: 'https://facebook.com/acme' },
    })

    expect(result).toEqual([
      { type: 'facebook', url: 'https://facebook.com/acme' },
    ])
  })

  it('treats a URL that exactly matches the default as not configured (documented edge case)', () => {
    const result = getConfiguredSocialLinks({
      facebook: { type: 'facebook', url: DEFAULT_LINKS_MAP.facebook.url },
    })

    expect(result).toEqual([])
  })
})
