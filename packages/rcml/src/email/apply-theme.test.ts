import { describe, expect, it } from 'vitest'

import type {
  RcmlAttributes,
  RcmlBody,
  RcmlBrandStyle,
  RcmlClass,
  RcmlDocument,
  RcmlFont,
  RcmlHead,
  RcmlSocial,
  RcmlSocialElement,
} from './rcml-types.js'
import { createEmailTheme } from './create-theme.js'
import {
  EmailThemeColorType,
  EmailThemeFontStyleType,
  EmailThemeImageType,
} from './theme-types.js'
import { applyTheme, EmailThemeApplyError } from './apply-theme.js'
import { safeValidateEmailTemplate } from './validate-email-template.js'

// ──────────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────────

function minimalDoc(): RcmlDocument {
  return {
    tagName: 'rcml',
    id: 'doc-1',
    children: [
      {
        tagName: 'rc-head',
        id: 'head-1',
        children: [
          { tagName: 'rc-brand-style', id: 'brand-1', attributes: { id: 0 } },
          { tagName: 'rc-attributes', id: 'attrs-1', children: [] },
        ],
      } as RcmlHead,
      {
        tagName: 'rc-body',
        id: 'body-1',
        children: [],
      } as unknown as RcmlBody,
    ],
  } as RcmlDocument
}

function docWithoutTheme(): RcmlDocument {
  // An rc-head that has none of the theme-controlled children yet.
  return {
    tagName: 'rcml',
    id: 'doc-bare',
    children: [
      {
        tagName: 'rc-head',
        id: 'head-bare',
        children: [],
      } as RcmlHead,
      {
        tagName: 'rc-body',
        id: 'body-bare',
        children: [],
      } as unknown as RcmlBody,
    ],
  } as RcmlDocument
}

function getHead(doc: RcmlDocument): RcmlHead {
  return doc.children[0]
}

function getAttrsNode(doc: RcmlDocument): RcmlAttributes {
  const head = getHead(doc)
  const node = head.children.find((c) => c.tagName === 'rc-attributes') as
    | RcmlAttributes
    | undefined

  expect(node).toBeDefined()

  return node!
}

function findAttrChild<T extends { tagName: string }>(
  doc: RcmlDocument,
  tagName: string,
  predicate: (child: T) => boolean = () => true
): T | undefined {
  const head = getHead(doc)
  const attrs = head.children.find((c) => c.tagName === 'rc-attributes') as
    | RcmlAttributes
    | undefined

  if (!attrs) return undefined

  return (attrs.children as unknown as T[]).find(
    (c) => (c as unknown as { tagName: string }).tagName === tagName && predicate(c)
  )
}

function countAttrChildren(doc: RcmlDocument, tagName: string): number {
  const attrs = getAttrsNode(doc)

  return (attrs.children as unknown as Array<{ tagName: string }>).filter(
    (c) => c.tagName === tagName
  ).length
}

function headFontCount(doc: RcmlDocument): number {
  return getHead(doc).children.filter(
    (c) => (c as { tagName: string }).tagName === 'rc-font'
  ).length
}

// ──────────────────────────────────────────────────────────────────────────
// Full-theme application
// ──────────────────────────────────────────────────────────────────────────

describe('applyTheme — full EmailTheme', () => {
  it('populates every head node from defaults on a minimal doc', () => {
    const doc = applyTheme(minimalDoc(), createEmailTheme())

    expect(findAttrChild<RcmlBody>(doc, 'rc-body')?.attributes?.['background-color']).toBe('#F3F3F3')
    expect(findAttrChild(doc, 'rc-section')).toBeDefined()
    expect(findAttrChild(doc, 'rc-button')).toBeDefined()
    expect(findAttrChild<RcmlSocial>(doc, 'rc-social')?.children).toHaveLength(6)
    // Six font-style classes + one brand-color class
    expect(countAttrChildren(doc, 'rc-class')).toBe(7)
  })

  it('updates rc-brand-style id', () => {
    const doc = applyTheme(minimalDoc(), createEmailTheme({ brandStyleId: 77 }))
    const brand = getHead(doc).children.find(
      (c): c is RcmlBrandStyle => c.tagName === 'rc-brand-style'
    )

    expect(brand?.attributes.id).toBe(77)
  })

  it('creates rc-brand-style when the head lacks one', () => {
    const doc = applyTheme(docWithoutTheme(), createEmailTheme({ brandStyleId: 5 }))
    const brand = getHead(doc).children.find(
      (c): c is RcmlBrandStyle => c.tagName === 'rc-brand-style'
    )

    expect(brand?.attributes.id).toBe(5)
  })

  it('does not mutate the input document', () => {
    const before = minimalDoc()
    const snapshot = JSON.stringify(before)

    applyTheme(before, createEmailTheme({ brandStyleId: 42 }))

    expect(JSON.stringify(before)).toBe(snapshot)
  })

  it('preserves ids on existing nodes and mints new ids on inserted ones', () => {
    const doc = minimalDoc()
    const attrs = getAttrsNode(doc)

    ;(attrs.children as unknown as Array<unknown>).push({
      tagName: 'rc-body',
      id: 'preserved-id',
      attributes: { 'background-color': '#000000' },
    })

    const result = applyTheme(doc, createEmailTheme())
    const body = findAttrChild<{ tagName: 'rc-body'; id: string; attributes: Record<string, string> }>(
      result,
      'rc-body'
    )

    expect(body?.id).toBe('preserved-id')
    expect(body?.attributes['background-color']).toBe('#F3F3F3')
  })

  it('a fully-populated EmailTheme and the equivalent patch shape produce the same doc', () => {
    const theme = createEmailTheme({
      brandStyleId: 9,
      colors: [{ type: EmailThemeColorType.Primary, hex: '#ABCDEF' }],
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const viaTheme = applyTheme(minimalDoc(), theme)
    const viaPatch = applyTheme(minimalDoc(), {
      brandStyleId: 9,
      colors: [
        { type: EmailThemeColorType.Body, hex: '#FFFFFF' },
        { type: EmailThemeColorType.Primary, hex: '#ABCDEF' },
        { type: EmailThemeColorType.Secondary, hex: '#F6F8F9' },
        { type: EmailThemeColorType.Background, hex: '#F3F3F3' },
      ],
      links: [
        { type: 'facebook', url: 'https://www.facebook.com/' },
        { type: 'instagram', url: 'https://www.instagram.com/' },
        { type: 'linkedin', url: 'https://www.linkedin.com/' },
        { type: 'tiktok', url: 'https://www.tiktok.com/' },
        { type: 'x', url: 'https://x.com/' },
        { type: 'website', url: 'https://www.example.com/' },
      ],
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
      fonts: [],
      fontStyles: [
        { type: EmailThemeFontStyleType.Paragraph },
        { type: EmailThemeFontStyleType.H1 },
        { type: EmailThemeFontStyleType.H2 },
        { type: EmailThemeFontStyleType.H3 },
        { type: EmailThemeFontStyleType.H4 },
        { type: EmailThemeFontStyleType.ButtonLabel },
      ],
    })

    // Strip the non-deterministic ids before comparing structure.
    const strip = (d: RcmlDocument): string =>
      JSON.stringify(d, (key, value) => (key === 'id' ? undefined : (value as unknown)))

    expect(strip(viaTheme)).toBe(strip(viaPatch))
  })

  it('rejects unsafe logo URLs with EmailThemeApplyError', () => {
    const theme = createEmailTheme({
      images: [{ type: EmailThemeImageType.Logo, url: 'javascript:alert(1)' }],
    })

    expect(() => applyTheme(minimalDoc(), theme)).toThrow(EmailThemeApplyError)
  })

  it('rejects unsafe social hrefs with EmailThemeApplyError', () => {
    const theme = createEmailTheme({
      links: [{ type: 'facebook', url: 'javascript:alert(1)' }],
    })

    expect(() => applyTheme(minimalDoc(), theme)).toThrow(EmailThemeApplyError)
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Patch-mode application
// ──────────────────────────────────────────────────────────────────────────

describe('applyTheme — partial patch', () => {
  it('only colors patch → only colour-related nodes are touched', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const beforeFontCount = headFontCount(themed)
    const beforeSocial = JSON.stringify(findAttrChild<RcmlSocial>(themed, 'rc-social'))

    const patched = applyTheme(themed, {
      colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
    })

    expect(findAttrChild<{ tagName: string; attributes: Record<string, string> }>(patched, 'rc-button')?.attributes['background-color']).toBe('#FF0000')
    expect(headFontCount(patched)).toBe(beforeFontCount)
    expect(JSON.stringify(findAttrChild<RcmlSocial>(patched, 'rc-social'))).toBe(beforeSocial)
    // Background colour patch is absent, so rc-body keeps its prior bg.
    expect(findAttrChild<RcmlBody>(patched, 'rc-body')?.attributes?.['background-color']).toBe('#F3F3F3')
  })

  it('only fonts patch → only rc-font children in rc-head change', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const beforeAttrs = JSON.stringify(getAttrsNode(themed))

    const patched = applyTheme(themed, {
      fonts: [{ fontFamily: 'Merriweather', url: 'https://fonts.example/m.css' }],
    })

    expect(headFontCount(patched)).toBe(1)
    expect(JSON.stringify(getAttrsNode(patched))).toBe(beforeAttrs)
  })

  it('only brandStyleId patch → only rc-brand-style updates', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const beforeAttrs = JSON.stringify(getAttrsNode(themed))
    const beforeFontCount = headFontCount(themed)

    const patched = applyTheme(themed, { brandStyleId: 999 })
    const brand = getHead(patched).children.find(
      (c): c is RcmlBrandStyle => c.tagName === 'rc-brand-style'
    )

    expect(brand?.attributes.id).toBe(999)
    expect(JSON.stringify(getAttrsNode(patched))).toBe(beforeAttrs)
    expect(headFontCount(patched)).toBe(beforeFontCount)
  })

  it('empty patch is a no-op (returns an equal but not === doc)', () => {
    const before = applyTheme(minimalDoc(), createEmailTheme())
    const after = applyTheme(before, {})

    expect(after).not.toBe(before)
    expect(JSON.stringify(after)).toBe(JSON.stringify(before))
  })

  it('links: [] is a no-op (overlay semantics)', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const before = JSON.stringify(themed)
    const patched = applyTheme(themed, { links: [] })

    expect(JSON.stringify(patched)).toBe(before)
  })

  it('images: [] is a no-op (overlay semantics)', () => {
    const themed = applyTheme(minimalDoc(), {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const before = JSON.stringify(themed)
    const patched = applyTheme(themed, { images: [] })

    expect(JSON.stringify(patched)).toBe(before)
  })

  it('partial colors patch updates only the sub-slots in the patch', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const brandColorBefore = findAttrChild<RcmlClass>(
      themed,
      'rc-class',
      (c) => (c.attributes as Record<string, unknown>).name === 'rcml-brand-color'
    )

    expect(brandColorBefore).toBeDefined()

    const patched = applyTheme(themed, {
      colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
    })

    // Primary changed
    expect(findAttrChild<{ tagName: string; attributes: Record<string, string> }>(patched, 'rc-button')?.attributes['background-color']).toBe('#FF0000')
    // Secondary slot not in the patch → brand-color class untouched.
    const brandColorClass = findAttrChild<RcmlClass>(
      patched,
      'rc-class',
      (c) => (c.attributes as Record<string, unknown>).name === 'rcml-brand-color'
    )

    expect(brandColorClass?.id).toBe(brandColorBefore?.id)
  })

  it('fontStyles patch ignores entries without a type', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const beforeAttrs = JSON.stringify(getAttrsNode(themed))

    const patched = applyTheme(themed, {
      fontStyles: [{ color: '#000' }], // no type → skipped
    })

    expect(JSON.stringify(getAttrsNode(patched))).toBe(beforeAttrs)
  })

  it('images patch ignores entries with an unknown image type', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const beforeAttrs = JSON.stringify(getAttrsNode(themed))

    const patched = applyTheme(themed, {
      images: [
        // @ts-expect-error — runtime validation drops unknown image types
        { type: 'banner', url: 'https://example.com/banner.png' },
      ],
    })

    expect(JSON.stringify(getAttrsNode(patched))).toBe(beforeAttrs)
  })

  it('fontStyles patch merges overrides into the default font-style per slot', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const patched = applyTheme(themed, {
      fontStyles: [{ type: EmailThemeFontStyleType.H1, color: '#112233' }],
    })
    const h1 = findAttrChild<RcmlClass>(
      patched,
      'rc-class',
      (c) => (c.attributes as Record<string, unknown>).name === 'rcml-h1-style'
    )
    const attrs = h1?.attributes as unknown as Record<string, string>

    expect(attrs.color).toBe('#112233')
    // Other font-style classes for untouched types aren't in the patch →
    // because fontStyles bucket was processed, only the slots mentioned
    // are upserted. Unmentioned slots in this bucket are NOT touched
    // (contrast with resetColorsTo-style semantics).
    const h2 = findAttrChild<RcmlClass>(
      patched,
      'rc-class',
      (c) => (c.attributes as Record<string, unknown>).name === 'rcml-h2-style'
    )

    // H2 class was already present from the themed() call and the patch
    // didn't mention H2 — so H2 must still be present with its default color.
    expect(h2).toBeDefined()
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Doc-state matrix
// ──────────────────────────────────────────────────────────────────────────

describe('applyTheme — doc-state matrix', () => {
  it('doc without any theme: patch creates rc-attributes + requested nodes', () => {
    const doc = docWithoutTheme()

    expect(getHead(doc).children.find((c) => c.tagName === 'rc-attributes')).toBeUndefined()

    const patched = applyTheme(doc, {
      colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
    })

    expect(getAttrsNode(patched)).toBeDefined()
    expect(findAttrChild<{ tagName: string; attributes: Record<string, string> }>(patched, 'rc-button')?.attributes['background-color']).toBe('#FF0000')
  })

  it('doc with default theme: patch updates existing nodes; ids preserved', () => {
    const themed = applyTheme(minimalDoc(), createEmailTheme())
    const buttonBefore = findAttrChild<{ tagName: string; id: string }>(themed, 'rc-button')

    expect(buttonBefore?.id).toBeDefined()

    const patched = applyTheme(themed, {
      colors: [{ type: EmailThemeColorType.Primary, hex: '#00FF00' }],
    })
    const buttonAfter = findAttrChild<{ tagName: string; id: string; attributes: Record<string, string> }>(
      patched,
      'rc-button'
    )

    expect(buttonAfter?.id).toBe(buttonBefore?.id)
    expect(buttonAfter?.attributes['background-color']).toBe('#00FF00')
  })

  it('doc with custom theme: orphan fields (not in the patch) survive', () => {
    // Apply a full theme that includes social links.
    const custom = applyTheme(
      minimalDoc(),
      createEmailTheme({
        brandStyleId: 1,
        colors: [{ type: EmailThemeColorType.Primary, hex: '#AA00AA' }],
      })
    )
    const socialBefore = JSON.stringify(findAttrChild<RcmlSocial>(custom, 'rc-social'))

    // Patch only brandStyleId — social block should be untouched.
    const patched = applyTheme(custom, { brandStyleId: 2 })

    expect(JSON.stringify(findAttrChild<RcmlSocial>(patched, 'rc-social'))).toBe(socialBefore)
  })

  it('sequential patches compose like a merged patch for non-overlapping buckets', () => {
    const base = applyTheme(minimalDoc(), createEmailTheme())
    const seq = applyTheme(
      applyTheme(base, {
        colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
      }),
      { brandStyleId: 42 }
    )
    const merged = applyTheme(base, {
      colors: [{ type: EmailThemeColorType.Primary, hex: '#FF0000' }],
      brandStyleId: 42,
    })

    const strip = (d: RcmlDocument): string =>
      JSON.stringify(d, (key, value) => (key === 'id' ? undefined : (value as unknown)))

    expect(strip(seq)).toBe(strip(merged))
  })
})

// ──────────────────────────────────────────────────────────────────────────
// rc-font reconciliation
// ──────────────────────────────────────────────────────────────────────────

describe('applyTheme — rc-font management', () => {
  it('overlay preserves author-added non-theme rc-font nodes', () => {
    const doc = minimalDoc()

    ;(getHead(doc).children as unknown as Array<unknown>).push({
      tagName: 'rc-font',
      id: 'custom',
      attributes: { name: "'Custom'", href: 'https://fonts.example/custom.css' },
    })

    const result = applyTheme(doc, createEmailTheme())

    // Default theme has no fonts → nothing to overlay → custom survives.
    expect(headFontCount(result)).toBe(1)
  })

  it('patch without fonts bucket leaves existing rc-font nodes intact', () => {
    const doc = minimalDoc()

    ;(getHead(doc).children as unknown as Array<unknown>).push({
      tagName: 'rc-font',
      id: 'kept',
      attributes: { name: "'Kept'", href: 'https://fonts.example/kept.css' },
    })

    const result = applyTheme(doc, { brandStyleId: 1 })
    const fonts = getHead(result).children.filter(
      (c) => (c as { tagName: string }).tagName === 'rc-font'
    ) as unknown as RcmlFont[]

    expect(fonts).toHaveLength(1)
    expect((fonts[0] as unknown as { id: string }).id).toBe('kept')
  })

  it('upserts matching rc-font in place, appends missing ones, leaves non-theme alone', () => {
    const doc = minimalDoc()

    ;(getHead(doc).children as unknown as Array<unknown>).push(
      {
        tagName: 'rc-font',
        id: 'merri',
        attributes: {
          name: "'Merriweather'",
          href: 'https://fonts.example/merriweather.css',
        },
      },
      {
        tagName: 'rc-font',
        id: 'legacy',
        attributes: {
          name: "'LegacyFont'",
          href: 'https://fonts.example/legacy.css',
        },
      }
    )

    const result = applyTheme(doc, {
      fonts: [
        { fontFamily: 'Merriweather', url: 'https://fonts.example/merriweather-v2.css' },
        { fontFamily: 'OpenSans', url: 'https://fonts.example/open.css' },
      ],
    })
    const fonts = getHead(result).children.filter(
      (c) => (c as { tagName: string }).tagName === 'rc-font'
    ) as unknown as RcmlFont[]

    // Merriweather updated in place, LegacyFont untouched, OpenSans appended.
    expect(fonts).toHaveLength(3)
    const merri = fonts.find((f) => f.attributes.name === "'Merriweather'")

    expect((merri as unknown as { id: string }).id).toBe('merri')
    expect(merri?.attributes.href).toBe('https://fonts.example/merriweather-v2.css')
    expect(fonts.find((f) => f.attributes.name === "'LegacyFont'")).toBeDefined()
    expect(fonts.find((f) => f.attributes.name === "'OpenSans'")).toBeDefined()
  })
})

// ──────────────────────────────────────────────────────────────────────────
// rc-social merge (covered briefly; detailed cases at the orchestrator level)
// ──────────────────────────────────────────────────────────────────────────

describe('applyTheme — rc-social merge', () => {
  it('overlays with an existing rc-social: updates matched href, appends missing, leaves orphans', () => {
    const doc = minimalDoc()
    const attrs = getAttrsNode(doc)

    ;(attrs.children as unknown as Array<unknown>).push({
      tagName: 'rc-social',
      id: 'social-1',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'facebook-el',
          attributes: { name: 'facebook', href: 'https://old.fb/' },
        },
        {
          tagName: 'rc-social-element',
          id: 'custom-el',
          attributes: { name: 'custom', href: 'https://custom.example/' },
        },
      ],
    })

    const result = applyTheme(doc, {
      links: [
        { type: 'facebook', url: 'https://new.fb/' },
        { type: 'instagram', url: 'https://ig.example/' },
      ],
    })
    const social = findAttrChild<RcmlSocial>(result, 'rc-social')

    expect(social?.id).toBe('social-1')

    const byName = new Map(
      (social?.children as RcmlSocialElement[]).map((el) => [
        (el.attributes as Record<string, unknown>).name as string,
        el,
      ])
    )

    // facebook updated in place (id preserved, href new)
    expect(byName.get('facebook')?.id).toBe('facebook-el')
    expect((byName.get('facebook')?.attributes as Record<string, unknown>).href).toBe(
      'https://new.fb/'
    )
    // instagram appended
    expect(byName.has('instagram')).toBe(true)
    // non-theme 'custom' link survives (overlay doesn't remove orphans)
    expect(byName.has('custom')).toBe(true)
  })

  it('deduplicates pre-existing elements sharing the same name (first wins)', () => {
    const doc = minimalDoc()
    const attrs = getAttrsNode(doc)

    ;(attrs.children as unknown as Array<unknown>).push({
      tagName: 'rc-social',
      id: 'social-dupe',
      children: [
        {
          tagName: 'rc-social-element',
          id: 'facebook-first',
          attributes: { name: 'facebook', href: 'https://first.fb/' },
        },
        {
          tagName: 'rc-social-element',
          id: 'facebook-dupe',
          attributes: { name: 'facebook', href: 'https://dupe.fb/' },
        },
      ],
    })

    const result = applyTheme(doc, {
      links: [{ type: 'facebook', url: 'https://new.fb/' }],
    })
    const social = findAttrChild<RcmlSocial>(result, 'rc-social')
    const elements = (social?.children ?? []) as RcmlSocialElement[]

    // Only the first element survived; its href was updated in place.
    expect(elements).toHaveLength(1)
    expect((elements[0] as { id: string }).id).toBe('facebook-first')
    expect((elements[0]!.attributes as Record<string, unknown>).href).toBe('https://new.fb/')
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Logo src propagation to body rc-logo nodes
// ──────────────────────────────────────────────────────────────────────────

function docWithLogoInBody(opts?: {
  rcClass?: string
  existingSrc?: string
  existingWidth?: string
}): RcmlDocument {
  const attrs: Record<string, string> = {
    'rc-class': opts?.rcClass ?? 'rcml-logo-style rc-initial-logo',
  }

  if (opts?.existingSrc !== undefined) attrs['src'] = opts.existingSrc
  if (opts?.existingWidth !== undefined) attrs['width'] = opts.existingWidth

  return {
    tagName: 'rcml',
    id: 'doc-logo',
    children: [
      { tagName: 'rc-head', id: 'head-logo', children: [] } as RcmlHead,
      {
        tagName: 'rc-body',
        id: 'body-logo',
        children: [
          {
            tagName: 'rc-section',
            children: [
              {
                tagName: 'rc-column',
                children: [
                  {
                    tagName: 'rc-logo',
                    id: 'logo-node',
                    attributes: { ...attrs },
                  },
                ],
              },
            ],
          },
        ],
      } as unknown as RcmlBody,
    ],
  } as RcmlDocument
}

function getBodyLogoNode(doc: RcmlDocument): { tagName: string; id?: string; attributes?: Record<string, unknown> } | undefined {
  const body = doc.children[1] as unknown as { children: Array<{ children: Array<{ children: Array<{ tagName: string; id?: string; attributes?: Record<string, unknown> }> }> }> }

  return body.children[0]?.children[0]?.children[0]
}

describe('applyTheme — logo src propagation to body', () => {
  it('sets src on rc-logo referencing rcml-logo-style', () => {
    const doc = docWithLogoInBody()
    const result = applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const logo = getBodyLogoNode(result)

    expect(logo?.attributes?.['src']).toBe('https://example.com/logo.png')
  })

  it('sets src on rc-logo referencing only rc-initial-logo', () => {
    const doc = docWithLogoInBody({ rcClass: 'rc-initial-logo' })
    const result = applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const logo = getBodyLogoNode(result)

    expect(logo?.attributes?.['src']).toBe('https://example.com/logo.png')
  })

  it('adds default width when rc-logo has no width attribute', () => {
    const doc = docWithLogoInBody()
    const result = applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const logo = getBodyLogoNode(result)

    expect(logo?.attributes?.['width']).toBe('96px')
  })

  it('preserves explicit width on rc-logo when already set', () => {
    const doc = docWithLogoInBody({ existingWidth: '200px' })
    const result = applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const logo = getBodyLogoNode(result)

    expect(logo?.attributes?.['width']).toBe('200px')
  })

  it('updates existing src when re-applying a different logo URL', () => {
    const doc = docWithLogoInBody({ existingSrc: 'https://example.com/old.png' })
    const result = applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/new.png' }],
    })
    const logo = getBodyLogoNode(result)

    expect(logo?.attributes?.['src']).toBe('https://example.com/new.png')
  })

  it('does not touch rc-logo without a logo class reference', () => {
    const doc = docWithLogoInBody({ rcClass: 'some-other-class' })
    const result = applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const logo = getBodyLogoNode(result)

    expect(logo?.attributes?.['src']).toBeUndefined()
  })

  it('does not mutate the original body even when no logo image is in the patch', () => {
    const doc = docWithLogoInBody()
    const bodySnapshot = JSON.stringify(doc.children[1])

    applyTheme(doc, { brandStyleId: 1 })

    expect(JSON.stringify(doc.children[1])).toBe(bodySnapshot)
  })

  it('does not mutate the input body', () => {
    const doc = docWithLogoInBody()
    const bodySnapshot = JSON.stringify(doc.children[1])

    applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })

    expect(JSON.stringify(doc.children[1])).toBe(bodySnapshot)
  })

  it('preserves logo node id after src propagation', () => {
    const doc = docWithLogoInBody()
    const result = applyTheme(doc, {
      images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
    })
    const logo = getBodyLogoNode(result)

    expect(logo?.id).toBe('logo-node')
  })
})

// ──────────────────────────────────────────────────────────────────────────
// Regression: applyTheme result must pass safeValidateEmailTemplate
// ──────────────────────────────────────────────────────────────────────────

it('theme-applied document passes safeValidateEmailTemplate', () => {
  const doc: RcmlDocument = {
    tagName: 'rcml',
    children: [
      { tagName: 'rc-head', children: [] } as RcmlHead,
      {
        tagName: 'rc-body',
        children: [
          {
            tagName: 'rc-section',
            children: [
              {
                tagName: 'rc-column',
                children: [
                  {
                    tagName: 'rc-text',
                    content: {
                      type: 'doc',
                      content: [
                        { type: 'paragraph', content: [{ type: 'text', text: 'Hello!' }] },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      } as unknown as RcmlBody,
    ],
  } as RcmlDocument

  const theme = createEmailTheme({
    brandStyleId: 10457,
    colors: [
      { type: EmailThemeColorType.Background, hex: '#f3f3f3' },
      { type: EmailThemeColorType.Body, hex: '#ffffff' },
      { type: EmailThemeColorType.Primary, hex: '#05cc87' },
      { type: EmailThemeColorType.Secondary, hex: '#F6F8F9' },
    ],
    images: [{ type: EmailThemeImageType.Logo, url: 'https://img.rule.io/14702/69709c979b5df' }],
    fonts: [{ fontFamily: 'Lato', url: 'https://fonts.googleapis.com/css?family=Lato' }],
    fontStyles: [
      { type: EmailThemeFontStyleType.Paragraph, fontFamily: 'Lato', fallbackFontFamily: 'sans-serif', fontSize: '16px', color: '#0F0F1F', lineHeight: '120%', letterSpacing: '0em', fontStyle: 'normal', fontWeight: '400', textDecoration: 'none' },
      { type: EmailThemeFontStyleType.H1, fontFamily: 'Helvetica', fallbackFontFamily: 'sans-serif', fontSize: '36px', color: '#0F0F1F', lineHeight: '120%', letterSpacing: '0em', fontStyle: 'normal', fontWeight: '700', textDecoration: 'none' },
    ],
  })

  const themed = applyTheme(doc, theme)
  const result = safeValidateEmailTemplate(themed)

  expect(result.success).toBe(true)
})
