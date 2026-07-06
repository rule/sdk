/**
 * Tests for {@link emailThemeFromBrandStyle} — the `@rule/client` bridge
 * that converts a Rule.io brand-style API response directly into an
 * {@link EmailTheme}.
 */

import { describe, expect, it } from 'vitest';

import {
  EmailThemeColorType,
  EmailThemeFontStyleType,
  EmailThemeImageType,
  applyTheme,
} from '@rule/rcml';

import { emailThemeFromBrandStyle, resolveBrandTheme } from './brand-style-to-theme.js';
import { RuleClientError } from './errors.js';
import type { BrandStyle } from './types.js';

const NOW = '2026-04-30T00:00:00Z';

function fullBrandStyle(overrides: Partial<BrandStyle> = {}): BrandStyle {
  return {
    id: 99999,
    accountId: 1,
    name: 'Test Brand',
    isDefault: true,
    colours: [
      { id: 1, brandStyleId: 99999, type: 'brand', hex: '#F6F8F9', brightness: 0, createdAt: NOW, updatedAt: NOW },
      { id: 2, brandStyleId: 99999, type: 'accent', hex: '#0066CC', brightness: 0, createdAt: NOW, updatedAt: NOW },
      { id: 3, brandStyleId: 99999, type: 'light', hex: '#FFFFFF', brightness: 0, createdAt: NOW, updatedAt: NOW },
      { id: 4, brandStyleId: 99999, type: 'side', hex: '#F3F3F3', brightness: 0, createdAt: NOW, updatedAt: NOW },
      { id: 5, brandStyleId: 99999, type: 'dark', hex: '#1A1A1A', brightness: 0, createdAt: NOW, updatedAt: NOW },
    ],
    fonts: [
      { id: 10, brandStyleId: 99999, type: 'title', origin: 'google', originName: 'Merriweather', name: 'Merriweather', url: 'https://fonts.example/merriweather.css', createdAt: NOW, updatedAt: NOW },
      { id: 11, brandStyleId: 99999, type: 'body', origin: 'google', originName: 'Open Sans', name: 'Open Sans', url: 'https://fonts.example/opensans.css', createdAt: NOW, updatedAt: NOW },
    ],
    images: [
      { id: 20, brandStyleId: 99999, type: 'logo', publicPath: 'https://example.com/logo.png', createdAt: NOW, updatedAt: NOW },
      { id: 21, brandStyleId: 99999, type: 'icon', publicPath: 'https://example.com/icon.png', createdAt: NOW, updatedAt: NOW },
    ],
    links: [
      { id: 30, brandStyleId: 99999, type: 'facebook', link: 'https://fb.example/acme', createdAt: NOW, updatedAt: NOW },
      { id: 31, brandStyleId: 99999, type: 'twitter', link: 'https://twitter.example/acme', createdAt: NOW, updatedAt: NOW },
      { id: 32, brandStyleId: 99999, type: 'website', link: 'https://acme.example/', createdAt: NOW, updatedAt: NOW },
      { id: 33, brandStyleId: 99999, type: 'youtube', link: 'https://yt.example/acme', createdAt: NOW, updatedAt: NOW },
    ],
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

describe('emailThemeFromBrandStyle — full input', () => {
  const theme = emailThemeFromBrandStyle(fullBrandStyle());

  it('carries the brand-style id', () => {
    expect(theme.brandStyleId).toBe(99999);
  });

  it('maps brand/accent/light/side colours onto the four theme slots', () => {
    expect(theme.colors[EmailThemeColorType.Secondary]?.hex).toBe('#F6F8F9');
    expect(theme.colors[EmailThemeColorType.Primary]?.hex).toBe('#0066CC');
    expect(theme.colors[EmailThemeColorType.Body]?.hex).toBe('#FFFFFF');
    expect(theme.colors[EmailThemeColorType.Background]?.hex).toBe('#F3F3F3');
  });

  it('propagates the dark colour to every font-style', () => {
    for (const type of Object.keys(theme.fontStyles) as EmailThemeFontStyleType[]) {
      if (type === EmailThemeFontStyleType.ButtonLabel) {
        // ButtonLabel keeps its default colour (#FFFFFF) — unaffected by `dark`.
        expect(theme.fontStyles[type].color).toBe('#FFFFFF');
      } else {
        expect(theme.fontStyles[type].color).toBe('#1A1A1A');
      }
    }
  });

  it('populates fonts and per-fontStyle font-family overrides', () => {
    const families = theme.fonts.map((f) => f.fontFamily);

    expect(families).toContain('Merriweather');
    expect(families).toContain('Open Sans');

    for (const type of [EmailThemeFontStyleType.H1, EmailThemeFontStyleType.H4]) {
      expect(theme.fontStyles[type].fontFamily).toBe('Merriweather');
    }

    for (const type of [EmailThemeFontStyleType.Paragraph, EmailThemeFontStyleType.ButtonLabel]) {
      expect(theme.fontStyles[type].fontFamily).toBe('Open Sans');
    }
  });

  it('picks the logo image', () => {
    const logo = theme.images[EmailThemeImageType.Logo];

    expect(logo?.url).toBe('https://example.com/logo.png');
  });

  it('maps social links and normalises twitter to x; drops unsupported types', () => {
    const types = Object.values(theme.links).map((l) => l!.type);

    expect(types).toContain('facebook');
    expect(types).toContain('website');
    expect(types).toContain('x'); // twitter → x
    expect(types).not.toContain('youtube');
  });
});

describe('emailThemeFromBrandStyle — partial input', () => {
  it('falls back to defaults when colours are missing', () => {
    const theme = emailThemeFromBrandStyle(fullBrandStyle({ colours: [] }));

    // Default primary colour from theme-defaults.
    expect(theme.colors[EmailThemeColorType.Primary]?.hex).toBe('#05CC87');
  });

  it('keeps default font-style colour when no dark colour is supplied', () => {
    const theme = emailThemeFromBrandStyle(
      fullBrandStyle({
        colours: [
          {
            id: 1,
            brandStyleId: 99999,
            type: 'accent',
            hex: '#123456',
            brightness: 0,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
      })
    );

    // H1 uses Merriweather font + default color (#0F0F1F).
    expect(theme.fontStyles[EmailThemeFontStyleType.H1].color).toBe('#0F0F1F');
  });

  it('omits the logo when no logo image is present', () => {
    const theme = emailThemeFromBrandStyle(fullBrandStyle({ images: [] }));

    expect(theme.images[EmailThemeImageType.Logo]).toBeUndefined();
  });

  it('produces empty fonts array when brand has no fonts', () => {
    const theme = emailThemeFromBrandStyle(fullBrandStyle({ fonts: [] }));

    expect(theme.fonts).toEqual([]);
  });

  it('omits url on fonts without a url', () => {
    const theme = emailThemeFromBrandStyle(
      fullBrandStyle({
        fonts: [
          {
            id: 10,
            brandStyleId: 99999,
            type: 'title',
            origin: 'system',
            originName: 'Helvetica',
            name: 'Helvetica',
            url: null,
            createdAt: NOW,
            updatedAt: NOW,
          },
        ],
      })
    );

    expect(theme.fonts).toEqual([{ fontFamily: 'Helvetica' }]);
  });

  it('drops social links with empty or unsafe URLs so they do not override theme defaults', () => {
    const theme = emailThemeFromBrandStyle(
      fullBrandStyle({
        links: [
          { id: 30, brandStyleId: 99999, type: 'facebook', link: '', createdAt: NOW, updatedAt: NOW },
          { id: 31, brandStyleId: 99999, type: 'instagram', link: '   ', createdAt: NOW, updatedAt: NOW },
          { id: 32, brandStyleId: 99999, type: 'linkedin', link: 'javascript:alert(1)', createdAt: NOW, updatedAt: NOW },
          { id: 33, brandStyleId: 99999, type: 'twitter', link: 'not-a-url', createdAt: NOW, updatedAt: NOW },
          { id: 34, brandStyleId: 99999, type: 'website', link: '  https://acme.example/  ', createdAt: NOW, updatedAt: NOW },
        ],
      }),
    );

    // Empty and whitespace-only links are dropped.
    expect(theme.links.facebook?.url).toBe('https://www.facebook.com/');
    expect(theme.links.instagram?.url).toBe('https://www.instagram.com/');
    // javascript: URI is blocked by @braintree/sanitize-url → about:blank → dropped.
    expect(theme.links.linkedin?.url).toBe('https://www.linkedin.com/');
    // A string without a protocol is passed through as-is by sanitize-url.
    expect(theme.links.x?.url).toBe('not-a-url');

    // A safe URL is trimmed and applied.
    expect(theme.links.website?.url).toBe('https://acme.example/');
  });

  it('drops font url when it is empty or unsafe (applyTheme rejects unsafe font urls)', () => {
    const theme = emailThemeFromBrandStyle(
      fullBrandStyle({
        fonts: [
          { id: 10, brandStyleId: 99999, type: 'title', origin: 'google', originName: 'Merriweather', name: 'Merriweather', url: 'javascript:alert(1)', createdAt: NOW, updatedAt: NOW },
          { id: 11, brandStyleId: 99999, type: 'body', origin: 'google', originName: 'Open Sans', name: 'Open Sans', url: '', createdAt: NOW, updatedAt: NOW },
        ],
      }),
    );

    // Font families still register, but unsafe URLs are stripped so
    // applyTheme does not later throw EmailThemeApplyError on a partial
    // brand style.
    expect(theme.fonts).toEqual([
      { fontFamily: 'Merriweather' },
      { fontFamily: 'Open Sans' },
    ]);
  });

  it('drops the logo image when its URL is empty or unsafe', () => {
    const empty = emailThemeFromBrandStyle(
      fullBrandStyle({
        images: [
          { id: 20, brandStyleId: 99999, type: 'logo', publicPath: '', createdAt: NOW, updatedAt: NOW },
        ],
      }),
    );

    expect(empty.images[EmailThemeImageType.Logo]).toBeUndefined();

    const unsafe = emailThemeFromBrandStyle(
      fullBrandStyle({
        images: [
          { id: 20, brandStyleId: 99999, type: 'logo', publicPath: 'javascript:alert(1)', createdAt: NOW, updatedAt: NOW },
        ],
      }),
    );

    expect(unsafe.images[EmailThemeImageType.Logo]).toBeUndefined();
  });

  it('is tolerant of null top-level arrays', () => {
    const theme = emailThemeFromBrandStyle({
      id: 1,
      accountId: 1,
      name: 'Empty',
      isDefault: true,
      colours: null,
      fonts: null,
      images: null,
      links: null,
      createdAt: NOW,
      updatedAt: NOW,
    });

    expect(theme.brandStyleId).toBe(1);
    // All slots revert to defaults.
    expect(theme.colors[EmailThemeColorType.Primary]?.hex).toBe('#05CC87');
  });
});

describe('resolveBrandTheme', () => {
  const minimalStyle: BrandStyle = {
    id: 1,
    accountId: 1,
    name: 'Default',
    isDefault: true,
    colours: [],
    fonts: [],
    images: [],
    links: [],
    createdAt: NOW,
    updatedAt: NOW,
  };

  it('uses the override id when provided, returning source=override', async () => {
    const client = {
      brandStyles: { list: async () => [], get: async () => minimalStyle },
    };
    const result = await resolveBrandTheme(client, 1);

    expect(result.id).toBe(1);
    expect(result.source).toBe('override');
  });

  it('throws RuleClientError for non-integer override id', async () => {
    const client = {
      brandStyles: { list: async () => [], get: async () => null },
    };

    await expect(resolveBrandTheme(client, 1.5)).rejects.toThrow(RuleClientError);
    await expect(resolveBrandTheme(client, -3)).rejects.toThrow(RuleClientError);
  });

  it('throws RuleClientError when override id is not found', async () => {
    const client = {
      brandStyles: { list: async () => [], get: async () => null },
    };

    await expect(resolveBrandTheme(client, 99)).rejects.toThrow(RuleClientError);
  });

  it('picks the isDefault entry when no override is given', async () => {
    const defaultStyle = { ...minimalStyle, id: 2, isDefault: true };
    const client = {
      brandStyles: {
        list: async () => [{ ...minimalStyle, id: 1, isDefault: false }, defaultStyle],
        get: async () => defaultStyle,
      },
    };
    const result = await resolveBrandTheme(client);

    expect(result.id).toBe(2);
    expect(result.source).toBe('default');
  });

  it('falls back to first entry when no default is flagged', async () => {
    const first = { ...minimalStyle, id: 10, isDefault: false };
    const client = {
      brandStyles: {
        list: async () => [first, { ...minimalStyle, id: 11, isDefault: false }],
        get: async () => first,
      },
    };
    const result = await resolveBrandTheme(client);

    expect(result.id).toBe(10);
    expect(result.source).toBe('fallback');
  });

  it('throws RuleClientError when no brand styles exist', async () => {
    const client = {
      brandStyles: { list: async () => [], get: async () => null },
    };

    await expect(resolveBrandTheme(client)).rejects.toThrow(RuleClientError);
  });

  it('throws RuleClientError when selected brand style cannot be fetched', async () => {
    const client = {
      brandStyles: { list: async () => [minimalStyle], get: async () => null },
    };

    await expect(resolveBrandTheme(client)).rejects.toThrow(RuleClientError);
  });
});

describe('emailThemeFromBrandStyle + applyTheme — end-to-end', () => {
  it('produces a document whose head reflects the brand style', () => {
    const theme = emailThemeFromBrandStyle(fullBrandStyle());
    const doc = applyTheme(
      {
        tagName: 'rcml',
        id: 'doc',
        children: [
          {
            tagName: 'rc-head',
            id: 'h',
            children: [
              { tagName: 'rc-brand-style', id: 'b', attributes: { id: 0 } },
              { tagName: 'rc-attributes', id: 'a', children: [] },
            ],
          },
          {
            tagName: 'rc-body',
            id: 'bd',
            children: [],
          },
        ],
      } as never,
      theme
    );

    const serialised = JSON.stringify(doc);

    expect(serialised).toContain('"id":99999'); // rc-brand-style id
    expect(serialised).toContain('#0066CC'); // primary/accent colour → rc-button
    expect(serialised).toContain('#F3F3F3'); // background → rc-body
    expect(serialised).toContain('#FFFFFF'); // body (section bg) + button-label color
    expect(serialised).toContain('rcml-logo-style');
    expect(serialised).toContain('https://example.com/logo.png');
    expect(serialised).toContain("'Merriweather'"); // title font
    expect(serialised).toContain("'Open Sans'"); // body font
    expect(serialised).toContain('https://fonts.example/merriweather.css');
  });
});
