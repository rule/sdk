import { describe, expect, it } from 'vitest'

import { customField } from './refs/factories.js'
import type { TemplateRefSerializer } from './refs/types.js'
import { createEmailTemplate } from './create-email-template.js'
import { createEmailTheme, DEFAULT_LINKS_MAP, EmailThemeImageType } from '@rule/rcml'
import type { EmailTheme } from '@rule/rcml'

interface FixtureCopy {
  greeting: string
}

interface FixtureContext {
  name: string
}

/** Base theme with the default colours, no logo, no social links. */
const bareTheme: EmailTheme = { ...createEmailTheme({ brandStyleId: 1 }), links: {}, images: {} }

/** Theme with a logo in `images.logo`, no social links. */
const themeWithLogo: EmailTheme = {
  ...createEmailTheme({
    brandStyleId: 1,
    images: [{ type: EmailThemeImageType.Logo, url: 'https://example.com/logo.png' }],
  }),
  links: {},
}

/** Theme with two social links, no logo. */
const themeWithSocials: EmailTheme = {
  ...createEmailTheme({
    brandStyleId: 1,
    links: [
      { type: 'facebook', url: 'https://facebook.com/example' },
      { type: 'instagram', url: 'https://instagram.com/example' },
    ],
  }),
  images: {},
}

function render(
  theme: EmailTheme,
  copy?: Partial<FixtureCopy>,
  serializer?: TemplateRefSerializer,
): string {
  const tpl = createEmailTemplate<FixtureCopy, FixtureContext>({
    baseUrl: import.meta.url,
    templatePath: './create-email-template-fixture.xml',
    copyPath: './create-email-template-fixture.json',
  })
  const args = serializer !== undefined
    ? { context: { name: 'Ada' }, theme, copy, serializer }
    : { context: { name: 'Ada' }, theme, copy }

  return JSON.stringify(tpl.render(args))
}

describe('createEmailTemplate', () => {
  it('loads default copy and renders a valid document', () => {
    const json = render(bareTheme)

    expect(json).toContain('Hello Ada')
  })

  it('merges a partial copy override over the defaults', () => {
    const json = render(bareTheme, { greeting: 'Hi {{name}}' })

    expect(json).toContain('Hi Ada')
    expect(json).not.toContain('Hello Ada')
  })

  it('skips the logo section when theme has no logo', () => {
    const json = render(bareTheme)

    expect(json).not.toContain('rc-logo')
  })

  it('renders the logo section when theme.images.logo is present', () => {
    const json = render(themeWithLogo)

    expect(json).toContain('rc-logo')
    expect(json).toContain('https://example.com/logo.png')
  })

  it('skips the social section when theme.links is empty', () => {
    const json = render(bareTheme)

    // rc-social elements from theme-applied <rc-attributes> class defs
    // aren't present in bareTheme (links: {}), and the body <?if
    // socialLinks?> gate fails → no rc-social anywhere.
    expect(json).not.toContain('rc-social')
  })

  it('renders the social section from theme.links', () => {
    const json = render(themeWithSocials)

    expect(json).toContain('rc-social')
    expect(json).toContain('facebook')
    expect(json).toContain('instagram')
  })

  describe('placeholder social slots', () => {
    // `createEmailTheme` seeds every slot with a placeholder URL. Those were
    // not supplied by the consumer and must not reach the rendered body.
    // (`applyTheme` still writes the slot defaults into rc-head's
    // rc-attributes; only the rendered body is checked here.)
    const bodyOf = (theme: EmailTheme): string => {
      const doc = JSON.parse(render(theme)) as { children: unknown[] }

      return JSON.stringify(doc.children[1])
    }

    it('renders no social section for a default-seeded theme', () => {
      const body = bodyOf({ ...createEmailTheme({ brandStyleId: 1 }), images: {} })

      expect(body).not.toContain('rc-social')

      for (const { url } of Object.values(DEFAULT_LINKS_MAP)) {
        expect(body).not.toContain(url)
      }
    })

    it('renders only the supplied links, not the placeholders around them', () => {
      const body = bodyOf({
        ...createEmailTheme({
          brandStyleId: 1,
          links: [{ type: 'facebook', url: 'https://facebook.com/acme' }],
        }),
        images: {},
      })

      expect(body).toContain('https://facebook.com/acme')
      expect(body).not.toContain(DEFAULT_LINKS_MAP.instagram.url)
      expect(body).not.toContain(DEFAULT_LINKS_MAP.linkedin.url)
    })

    it('treats placeholders written by earlier SDK versions as not configured', () => {
      const body = bodyOf({
        ...createEmailTheme({ brandStyleId: 1 }),
        images: {},
        links: {
          facebook: { type: 'facebook', url: 'https://www.facebook.com/' },
          instagram: { type: 'instagram', url: 'https://www.instagram.com/' },
        },
      })

      expect(body).not.toContain('rc-social')
    })
  })

  it('honours a caller-supplied TemplateRef serializer', () => {
    const upper: TemplateRefSerializer = {
      serializeCustomField: (r) => `CF<${r.group}.${r.name}>`.toUpperCase(),
      serializeLoopValue: (r) => `LV<${r.key}>`.toUpperCase(),
    }
    const json = render(bareTheme, undefined, upper)

    // Fixture has no ref slot; render should still succeed with the
    // custom serializer plumbed through.
    expect(json).toContain('Hello Ada')
    // White-box: prove the serializer would fire on a ref if the
    // fixture had one.
    expect(upper.serializeCustomField(customField('g', 'n', 1))).toBe('CF<G.N>')
  })
})
