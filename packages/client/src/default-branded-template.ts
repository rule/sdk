/**
 * Default branded RCML template builder used by the deprecated orchestration
 * helpers (`RuleClient.createAutomationEmail`, `RuleClient.createCampaignEmail`)
 * when the caller passes a `brandStyleId` instead of a full `template`.
 *
 * The produced document is handed to {@link applyTheme}, which decorates the
 * empty head with brand-style + fonts + social + colour attributes derived
 * from the brand style. The body sections below keep their original hard-coded
 * class names (`rcml-h1-style`, `rcml-p-style`, `rcml-label-style`) and default
 * copy (`Replace this title`, `Click me!`, `Certified by Rule`) so the
 * editor-compatibility contract is unchanged.
 *
 * This module is intentionally **not** re-exported from `index.ts`. It exists
 * only to satisfy the deprecated wrappers; the orchestration is scheduled to
 * relocate to consumers in a follow-up change.
 */

import { randomUUID } from 'node:crypto';

import { applyTheme } from '@rule/rcml';
import type { RcmlBodyChild, RcmlDocument, RcmlHead } from '@rule/rcml';

import { emailThemeFromBrandStyle } from './brand-style-to-theme.js';
import type { BrandStyle } from './types.js';

function genId(): string {
  return randomUUID();
}

function buildLogoSection(logoUrl: string): RcmlBodyChild {
  return {
    tagName: 'rc-section',
    id: genId(),
    children: [
      {
        tagName: 'rc-column',
        id: genId(),
        attributes: { padding: '0 20px' },
        children: [
          {
            tagName: 'rc-logo',
            id: genId(),
            attributes: {
              'rc-class': 'rcml-logo-style rc-initial-logo',
              src: logoUrl,
              width: '96px',
              padding: '20px 0',
            },
          },
        ],
      },
    ],
  } as RcmlBodyChild;
}

function buildDefaultContentSection(): RcmlBodyChild {
  return {
    tagName: 'rc-section',
    id: genId(),
    attributes: { padding: '20px 0' },
    children: [
      {
        tagName: 'rc-column',
        id: genId(),
        attributes: { padding: '0 20px' },
        children: [
          {
            tagName: 'rc-image',
            id: genId(),
            attributes: {
              padding: '0 0 20px 0',
              src: 'https://app.rule.io/img/editor/image.png',
            },
          },
          {
            tagName: 'rc-heading',
            id: genId(),
            attributes: { 'rc-class': 'rcml-h1-style' },
            content: {
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Replace this title' }] },
              ],
            },
          },
          {
            tagName: 'rc-text',
            id: genId(),
            attributes: { 'rc-class': 'rcml-p-style' },
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Click into this box to change the font settings. Edit this text to include additional information and a description of the image.',
                    },
                  ],
                },
              ],
            },
          },
          {
            tagName: 'rc-button',
            id: genId(),
            attributes: {
              align: 'center',
              border: 'none',
              'border-radius': '8px',
              'inner-padding': '10px 16px',
              padding: '0 0 20px 0',
              'padding-bottom': '20px',
              'text-align': 'center',
              'vertical-align': 'middle',
              'rc-class': 'rcml-label-style',
            },
            content: {
              type: 'doc',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click me!' }] }],
            },
          },
        ],
      },
    ],
  } as RcmlBodyChild;
}

function buildFooterSection(): RcmlBodyChild {
  const textColor = '#666666';
  const fontSize = '10px';

  return {
    tagName: 'rc-section',
    id: genId(),
    attributes: { padding: '20px 0px 20px 0px' },
    children: [
      {
        tagName: 'rc-column',
        id: genId(),
        attributes: { padding: '0 20px' },
        children: [
          {
            tagName: 'rc-text',
            id: genId(),
            attributes: {
              align: 'center',
              padding: '0px 0px 10px 0px',
              'rc-class': 'rcml-p-style',
            },
            content: {
              type: 'doc',
              content: [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'View in browser',
                      marks: [
                        {
                          type: 'font',
                          attrs: {
                            'font-size': fontSize,
                            'text-decoration': 'underline',
                            color: textColor,
                          },
                        },
                        {
                          type: 'link',
                          attrs: {
                            href: '[Link:WebBrowser]',
                            target: '_blank',
                            'no-tracked': 'true',
                          },
                        },
                      ],
                    },
                    { type: 'text', text: ' ' },
                    {
                      type: 'text',
                      text: '|',
                      marks: [
                        { type: 'font', attrs: { 'font-size': fontSize, color: textColor } },
                      ],
                    },
                    { type: 'text', text: ' ' },
                    {
                      type: 'text',
                      text: 'Unsubscribe',
                      marks: [
                        {
                          type: 'font',
                          attrs: {
                            'font-size': fontSize,
                            'text-decoration': 'underline',
                            color: textColor,
                          },
                        },
                        {
                          type: 'link',
                          attrs: {
                            href: '[Link:Unsubscribe]',
                            target: '_blank',
                            'no-tracked': 'true',
                          },
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          },
          {
            tagName: 'rc-text',
            id: genId(),
            attributes: {
              align: 'center',
              padding: '10px 0px 0px 0px',
              'font-family': "'Helvetica', sans-serif",
              'font-style': 'normal',
              'line-height': '120%',
              'letter-spacing': '0em',
              color: textColor,
              'font-weight': '400',
              'text-decoration': 'none',
              'font-size': fontSize,
            },
            content: {
              type: 'doc',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: 'Certified by Rule' }] },
              ],
            },
          },
        ],
      },
    ],
  } as RcmlBodyChild;
}

/**
 * Build a fully themed RCML document for the default "here is your brand,
 * here is a placeholder content section" flow.
 *
 * Pipeline:
 *   brand style → `emailThemeFromBrandStyle` → `EmailTheme`
 *   skeleton doc (logo/content/footer body) + preview head if preheader
 *   `applyTheme(skeleton, theme)` → returns the decorated document
 */
export function buildDefaultBrandedTemplate(
  brandStyle: BrandStyle,
  options: { preheader?: string; sections?: readonly RcmlBodyChild[] } = {}
): RcmlDocument {
  const theme = emailThemeFromBrandStyle(brandStyle);
  const logoUrl = theme.images.logo?.url;
  const userSections = options.sections ?? [];
  const bodyChildren: RcmlBodyChild[] = [
    ...(logoUrl ? [buildLogoSection(logoUrl)] : []),
    ...(userSections.length > 0 ? userSections : [buildDefaultContentSection()]),
    buildFooterSection(),
  ];

  const head: RcmlHead = {
    tagName: 'rc-head',
    id: genId(),
    children: options.preheader
      ? [{ tagName: 'rc-preview', id: genId(), content: options.preheader }]
      : [],
  };

  const baseDoc: RcmlDocument = {
    tagName: 'rcml',
    id: genId(),
    children: [
      head,
      { tagName: 'rc-body', id: genId(), children: bodyChildren },
    ],
  };

  return applyTheme(baseDoc, theme);
}
