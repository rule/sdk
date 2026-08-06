import { describe, expect, it } from 'vitest'
import type { RcmlDocument } from './rcml-types.js'
import { rcmlToXml } from './rcml-to-xml.js'
import { xmlToRcml } from './xml-to-rcml.js'

/**
 * Docs that exercise a mix of structural nodes, attributes, PM content,
 * special characters, and the optional `id` field.
 */
const ROUND_TRIP_DOCS: ReadonlyArray<{ name: string; doc: RcmlDocument }> = [
  {
    name: 'minimal head + body',
    doc: {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        { tagName: 'rc-body', children: [] },
      ],
    },
  },
  {
    name: 'attributes + nested structure',
    doc: {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          attributes: { 'background-color': '#ffffff', width: '600px' },
          children: [
            {
              tagName: 'rc-section',
              attributes: { 'background-color': '#f5f5f5', padding: '20px 0' },
              children: [
                {
                  tagName: 'rc-column',
                  attributes: { width: '100%' },
                  children: [
                    { tagName: 'rc-spacer', attributes: { height: '10px' } },
                    { tagName: 'rc-divider', attributes: { 'border-color': '#cccccc' } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'rc-text content round-trip (RFM body)',
    doc: {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
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
                          {
                            type: 'paragraph',
                            content: [{ type: 'text', text: 'Hello world' }],
                          },
                        ],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'rc-raw content round-trip',
    doc: {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
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
                      tagName: 'rc-raw',
                      content: { type: 'html', text: '<!--[if mso]><table><tr><td><![endif]-->' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: 'preserves `id` on multiple nodes',
    doc: {
      id: 'root',
      tagName: 'rcml',
      children: [
        { id: 'h', tagName: 'rc-head', children: [] },
        {
          id: 'b',
          tagName: 'rc-body',
          attributes: { width: '600px' },
          children: [],
        },
      ],
    },
  },
]

describe('rcmlToXml → xmlToRcml round-trip', () => {
  for (const { name, doc } of ROUND_TRIP_DOCS) {
    it(name, () => {
      const xml = rcmlToXml(doc)
      const restored = xmlToRcml(xml)

      expect(restored).toEqual(doc)
    })
  }
})

describe('xmlToRcml → rcmlToXml (string → JSON → string) idempotence', () => {
  it('stable for a pretty-printed canonical XML', () => {
    const xml = [
      '<rcml>',
      '  <rc-head></rc-head>',
      '  <rc-body background-color="#ffffff" width="600px">',
      '    <rc-section padding="20px 0">',
      '      <rc-column width="100%">',
      '        <rc-spacer height="10px"></rc-spacer>',
      '      </rc-column>',
      '    </rc-section>',
      '  </rc-body>',
      '</rcml>',
    ].join('\n')
    const json = xmlToRcml(xml)
    const xml2 = rcmlToXml(json)

    expect(xml2).toBe(xml)
  })
})
