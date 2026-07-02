import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { DefaultTheme } from 'vitepress';

const API_PACKAGES: { dir: string; label: string }[] = [
  { dir: 'client/src', label: '@rule/client' },
  { dir: 'rcml/src', label: '@rule/rcml' },
  { dir: 'sdk/src', label: '@rule/sdk' },
];

const CATEGORIES: { dir: string; label: string }[] = [
  { dir: 'classes', label: 'Classes' },
  { dir: 'enumerations', label: 'Enumerations' },
  { dir: 'functions', label: 'Functions' },
  { dir: 'interfaces', label: 'Interfaces' },
  { dir: 'type-aliases', label: 'Type Aliases' },
  { dir: 'variables', label: 'Variables' },
];

function mdFilesToItems(dir: string, linkPrefix: string): DefaultTheme.SidebarItem[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => ({ text: f.replace(/\.md$/, ''), link: `${linkPrefix}/${f.replace(/\.md$/, '')}` }));
}

export function buildApiSidebar(srcDir: string): DefaultTheme.SidebarItem[] {
  const apiDir = join(srcDir, 'api');

  if (!existsSync(apiDir)) return [];

  return API_PACKAGES.map(({ dir, label }) => {
    const pkgDir = join(apiDir, dir);
    const items: DefaultTheme.SidebarItem[] = [{ text: 'Overview', link: `/api/${dir}/` }];

    for (const { dir: catDir, label: catLabel } of CATEGORIES) {
      const files = mdFilesToItems(join(pkgDir, catDir), `/api/${dir}/${catDir}`);

      if (files.length === 0) continue;
      items.push({ text: catLabel, collapsed: true, items: files });
    }

    return { text: label, items };
  });
}

export const guideSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: 'Getting Started',
    collapsed: false,
    items: [
      { text: 'Quick Start', link: '/guide/getting-started' },
      { text: 'Contributing to Docs', link: '/guide/contributing' },
    ],
  },
  {
    text: 'Migration',
    collapsed: false,
    items: [
      { text: '@rulecom → @rule', link: '/guide/migration' },
    ],
  },
  {
    text: '@rule/sdk',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/packages/sdk/' },
    ],
  },
  {
    text: '@rule/client',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/packages/client/' },
      {
        text: 'Concepts',
        collapsed: false,
        items: [
          { text: 'Asynchronous Operations', link: '/packages/client/async-operations' },
          { text: 'Webhooks', link: '/packages/client/webhooks' },
        ],
      },
      { text: 'Tags', link: '/packages/client/tags' },
      {
        text: 'Subscribers',
        collapsed: true,
        items: [
          { text: 'Subscriber Identifiers', link: '/packages/client/subscriber-identifiers' },
          { text: 'Managing Subscribers', link: '/packages/client/managing-subscribers' },
          { text: 'Custom Fields', link: '/packages/client/custom-fields' },
          { text: 'Organizing with Tags', link: '/packages/client/organizing-with-tags' },
          { text: 'Triggering Tag Automations', link: '/packages/client/tag-automation-modes' },
          { text: 'Blocking Subscribers', link: '/packages/client/blocking-subscribers' },
          { text: 'Managing Suppressions', link: '/packages/client/managing-suppressions' },
          { text: 'Syncing Subscribers', link: '/packages/client/syncing-subscribers' },
          { text: 'Bulk Create Subscribers', link: '/packages/client/bulk-create-subscribers' },
        ],
      },
      { text: 'Brand Styles', link: '/packages/client/brand-styles' },
      { text: 'Recipients', link: '/packages/client/recipients' },
      {
        text: 'Email',
        collapsed: false,
        items: [
          { text: 'Campaigns', link: '/packages/client/email-campaigns' },
          { text: 'Automations', link: '/packages/client/email-automations' },
          { text: 'Messages', link: '/packages/client/email-messages' },
          { text: 'Templates', link: '/packages/client/email-templates' },
        ],
      },
      {
        text: 'SMS',
        collapsed: false,
        items: [
          { text: 'Campaigns', link: '/packages/client/sms-campaigns' },
          { text: 'Automations', link: '/packages/client/sms-automations' },
          { text: 'Messages', link: '/packages/client/sms-messages' },
          { text: 'Templates', link: '/packages/client/sms-templates' },
        ],
      },
      { text: 'Dynamic Sets', link: '/packages/client/dynamic-sets' },
      { text: 'Analytics', link: '/packages/client/analytics' },
      { text: 'Exports', link: '/packages/client/exports' },
      { text: 'Custom Field Schema', link: '/packages/client/custom-fields-schema' },
      { text: 'API Keys', link: '/packages/client/api-keys' },
      { text: 'Account', link: '/packages/client/account' },
      { text: 'Error Handling', link: '/packages/client/error-handling' },

    ],
  },
  {
    text: '@rule/rcml',
    collapsed: false,
    items: [
      { text: 'Overview', link: '/packages/rcml/' },
      {
        text: 'Email',
        collapsed: false,
        items: [
          {
            text: 'Concepts',
            collapsed: false,
            items: [
              {
                text: 'Basic',
                collapsed: true,
                items: [
                  { text: 'Template', link: '/packages/rcml/email/concepts/basic/template' },
                  { text: 'Containers', link: '/packages/rcml/email/concepts/basic/containers' },
                  { text: 'Elements', link: '/packages/rcml/email/concepts/basic/elements' },
                  { text: 'Rich text content', link: '/packages/rcml/email/concepts/basic/rich-text-content' },
                  { text: 'Theme', link: '/packages/rcml/email/concepts/basic/theme' },
                ],
              },
              {
                text: 'Advanced',
                collapsed: true,
                items: [
                  { text: 'Switches', link: '/packages/rcml/email/concepts/advanced/switches' },
                  { text: 'Loops', link: '/packages/rcml/email/concepts/advanced/loops' },
                  { text: 'Custom HTML', link: '/packages/rcml/email/concepts/advanced/custom-html' },
                ],
              },
            ],
          },
          {
            text: 'RCML',
            collapsed: false,
            items: [
              { text: 'Overview', link: '/packages/rcml/email/rcml/' },
              {
                text: 'Root components',
                collapsed: true,
                items: [
                  { text: 'rcml', link: '/packages/rcml/email/rcml/root/rcml' },
                  { text: 'rc-head', link: '/packages/rcml/email/rcml/root/rc-head' },
                  { text: 'rc-body', link: '/packages/rcml/email/rcml/root/rc-body' },
                ],
              },
              {
                text: 'Head components',
                collapsed: true,
                items: [
                  { text: 'rc-brand-style', link: '/packages/rcml/email/rcml/head/rc-brand-style' },
                  { text: 'rc-font', link: '/packages/rcml/email/rcml/head/rc-font' },
                  { text: 'rc-attributes', link: '/packages/rcml/email/rcml/head/rc-attributes' },
                  { text: 'rc-preview', link: '/packages/rcml/email/rcml/head/rc-preview' },
                  { text: 'rc-class', link: '/packages/rcml/email/rcml/head/rc-class' },
                  { text: 'rc-plain-text', link: '/packages/rcml/email/rcml/head/rc-plain-text' },
                ],
              },
              {
                text: 'Body components',
                collapsed: true,
                items: [
                  {
                    text: 'Layout',
                    collapsed: true,
                    items: [
                      { text: 'rc-section', link: '/packages/rcml/email/rcml/body/layout/rc-section' },
                      { text: 'rc-column', link: '/packages/rcml/email/rcml/body/layout/rc-column' },
                      { text: 'rc-wrapper', link: '/packages/rcml/email/rcml/body/layout/rc-wrapper' },
                      { text: 'rc-group', link: '/packages/rcml/email/rcml/body/layout/rc-group' },
                    ],
                  },
                  {
                    text: 'Content',
                    collapsed: true,
                    items: [
                      { text: 'rc-text', link: '/packages/rcml/email/rcml/body/content/rc-text' },
                      { text: 'rc-heading', link: '/packages/rcml/email/rcml/body/content/rc-heading' },
                      { text: 'rc-button', link: '/packages/rcml/email/rcml/body/content/rc-button' },
                      { text: 'rc-image', link: '/packages/rcml/email/rcml/body/content/rc-image' },
                      { text: 'rc-logo', link: '/packages/rcml/email/rcml/body/content/rc-logo' },
                      { text: 'rc-video', link: '/packages/rcml/email/rcml/body/content/rc-video' },
                      { text: 'rc-spacer', link: '/packages/rcml/email/rcml/body/content/rc-spacer' },
                      { text: 'rc-divider', link: '/packages/rcml/email/rcml/body/content/rc-divider' },
                      { text: 'rc-social', link: '/packages/rcml/email/rcml/body/content/rc-social' },
                      { text: 'rc-social-element', link: '/packages/rcml/email/rcml/body/content/rc-social-element' },
                      { text: 'rc-raw', link: '/packages/rcml/email/rcml/body/content/rc-raw' },
                    ],
                  },
                  {
                    text: 'Control flow',
                    collapsed: true,
                    items: [
                      { text: 'rc-switch', link: '/packages/rcml/email/rcml/body/control-flow/rc-switch' },
                      { text: 'rc-case', link: '/packages/rcml/email/rcml/body/control-flow/rc-case' },
                      { text: 'rc-loop', link: '/packages/rcml/email/rcml/body/control-flow/rc-loop' },
                    ],
                  },
                ],
              },
            ],
          },
          {
            text: 'RCML Content',
            collapsed: false,
            items: [
              { text: 'Flavors', link: '/packages/rcml/email/content/flavors' },
              {
                text: 'Block nodes',
                collapsed: true,
                items: [
                  { text: 'doc', link: '/packages/rcml/email/content/block-nodes/doc' },
                  { text: 'paragraph', link: '/packages/rcml/email/content/block-nodes/paragraph' },
                  { text: 'bullet-list', link: '/packages/rcml/email/content/block-nodes/bullet-list' },
                  { text: 'ordered-list', link: '/packages/rcml/email/content/block-nodes/ordered-list' },
                  { text: 'list-item', link: '/packages/rcml/email/content/block-nodes/list-item' },
                  { text: 'align', link: '/packages/rcml/email/content/block-nodes/align' },
                  { text: 'hardbreak', link: '/packages/rcml/email/content/block-nodes/hardbreak' },
                ],
              },
              {
                text: 'Inline nodes',
                collapsed: true,
                items: [
                  { text: 'text', link: '/packages/rcml/email/content/inline-nodes/text' },
                  { text: 'placeholder', link: '/packages/rcml/email/content/inline-nodes/placeholder' },
                  { text: 'loop-value', link: '/packages/rcml/email/content/inline-nodes/loop-value' },
                ],
              },
              {
                text: 'Marks',
                collapsed: true,
                items: [
                  { text: 'font', link: '/packages/rcml/email/content/marks/font' },
                  { text: 'link', link: '/packages/rcml/email/content/marks/link' },
                ],
              },
            ],
          },
          { text: 'Validation', link: '/packages/rcml/email/validation' },
          { text: 'Building programmatically', link: '/packages/rcml/email/building-programmatically' },
          { text: 'Building with LLM', link: '/packages/rcml/email/building-with-llm' },
        ],
      },
      {
        text: 'SMS',
        collapsed: false,
        items: [
          { text: 'Overview', link: '/packages/rcml/sms/' },
          {
            text: 'Concepts',
            collapsed: false,
            items: [
              { text: 'Template', link: '/packages/rcml/sms/concepts/template' },
              { text: 'Content', link: '/packages/rcml/sms/concepts/content' },
              { text: 'Unsubscription', link: '/packages/rcml/sms/concepts/unsubscription' },
            ],
          },
          {
            text: 'SMS RCML',
            collapsed: false,
            items: [
              { text: 'rc-sms', link: '/packages/rcml/sms/rcml/rc-sms' },
            ],
          },
          {
            text: 'SMS RFM',
            collapsed: true,
            items: [
              { text: 'sms', link: '/packages/rcml/sms/content/nodes/sms' },
              { text: 'message', link: '/packages/rcml/sms/content/nodes/message' },
              { text: 'link', link: '/packages/rcml/sms/content/nodes/link' },
              { text: 'placeholder', link: '/packages/rcml/sms/content/nodes/placeholder' },
            ],
          },
          { text: 'Building programmatically', link: '/packages/rcml/sms/building-programmatically' },
          { text: 'Validation', link: '/packages/rcml/sms/validation' },
          { text: 'Building with LLM', link: '/packages/rcml/sms/building-with-llm' },
        ],
      },
    ],
  },
];
