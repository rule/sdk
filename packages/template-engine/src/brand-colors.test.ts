import { describe, expect, it } from 'vitest'
import { createEmailTheme, EmailThemeColorType, EmailThemeFontStyleType } from '@rule/rcml'
import type { EmailTheme } from '@rule/rcml'

import { blendHex, getBrandColors } from './brand-colors.js'

describe('blendHex', () => {
  it('blends fg over bg at the given alpha', () => {
    expect(blendHex('#000000', '#FFFFFF', 0.5)).toBe('#808080')
    expect(blendHex('#0F0F1F', '#FFFFFF', 0.6)).toBe('#6F6F79')
    expect(blendHex('#0F0F1F', '#FFFFFF', 0.08)).toBe('#ECECED')
  })

  it('expands 3-digit hex and ignores case', () => {
    expect(blendHex('#000', '#fff', 0.5)).toBe('#808080')
  })

  it('ignores the alpha of 4- and 8-digit hex', () => {
    expect(blendHex('#000000CC', '#FFFFFF', 0.5)).toBe('#808080')
    expect(blendHex('#000C', '#FFFFFF', 0.5)).toBe('#808080')
  })

  it('returns fg unchanged when either input is not hex', () => {
    expect(blendHex('red', '#FFFFFF', 0.5)).toBe('red')
    expect(blendHex('#000000', 'transparent', 0.5)).toBe('#000000')
  })

  it('returns the fallback when given one and an input is not hex', () => {
    expect(blendHex('rgb(0,0,0)', '#FFFFFF', 0.5, '#FFFFFF')).toBe('#FFFFFF')
  })
})

describe('getBrandColors', () => {
  it('maps theme slots to Rule UI names', () => {
    const theme = createEmailTheme({
      brandStyleId: 1,
      colors: [
        { type: EmailThemeColorType.Primary, hex: '#FF0055' },
        { type: EmailThemeColorType.Secondary, hex: '#EEEEEE' },
        { type: EmailThemeColorType.Body, hex: '#111111' },
        { type: EmailThemeColorType.Background, hex: '#000000' },
      ],
      fontStyles: [{ type: EmailThemeFontStyleType.Paragraph, color: '#FAFAFA' }],
    })

    expect(getBrandColors(theme)).toEqual({
      primary: '#FF0055',
      secondary: '#EEEEEE',
      text: '#FAFAFA',
      background: '#111111',
      canvas: '#000000',
      muted: blendHex('#FAFAFA', '#111111', 0.6),
      hairline: blendHex('#FAFAFA', '#111111', 0.08),
    })
  })

  it('keeps muted readable and fades hairline out when text is not hex', () => {
    const theme = createEmailTheme({
      brandStyleId: 1,
      colors: [{ type: EmailThemeColorType.Body, hex: '#FFFFFF' }],
      fontStyles: [{ type: EmailThemeFontStyleType.Paragraph, color: 'rgb(17,17,17)' }],
    })
    const brand = getBrandColors(theme)

    expect(brand.muted).toBe('rgb(17,17,17)')
    expect(brand.hairline).toBe('#FFFFFF')
  })

  it('falls back to the default palette for unset slots', () => {
    const base = createEmailTheme({ brandStyleId: 1 })
    const theme: EmailTheme = { ...base, colors: {} }

    expect(getBrandColors(theme)).toEqual(getBrandColors(base))
    expect(getBrandColors(theme).canvas).toBe('#F3F3F3')
  })
})
