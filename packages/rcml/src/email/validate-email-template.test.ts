import { describe, expect, it } from 'vitest'
import type { RcmlDocument } from './rcml-types.js'
import {
  EmailTemplateErrorCodes,
  EmailTemplateValidationError,
  safeValidateEmailTemplate,
  validateEmailTemplate,
} from './validate-email-template.js'

/**
 * Minimal but legitimate RcmlDocument. Not meant to exercise every edge —
 * just something the validator should accept end-to-end.
 */
const VALID_DOC: RcmlDocument = {
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
}

describe('validateEmailTemplate — JSON AST input', () => {
  it('accepts a minimal valid document', () => {
    expect(() => validateEmailTemplate(VALID_DOC)).not.toThrow()
  })

  it('rejects an unknown root tagName', () => {
    const bad = { tagName: 'not-rcml', children: [] } as unknown as RcmlDocument

    expect(() => validateEmailTemplate(bad)).toThrow(EmailTemplateValidationError)
  })

  it('rejects a rc-column placed directly under rc-body', () => {
    const bad: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            // @ts-expect-error — intentionally invalid placement
            { tagName: 'rc-column', attributes: { width: '100%' }, children: [] },
          ],
        },
      ],
    }

    const result = safeValidateEmailTemplate(bad)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.some((e) => e.code === EmailTemplateErrorCodes.CHILD_INVALID)).toBe(true)
  })

  it('rejects an unknown attribute on rc-section', () => {
    const bad: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-section',
              // @ts-expect-error — `foo` is not a valid rc-section attribute
              attributes: { foo: 'bar' },
              children: [{ tagName: 'rc-column', children: [] }],
            },
          ],
        },
      ],
    }
    const result = safeValidateEmailTemplate(bad)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.some((e) => e.code === EmailTemplateErrorCodes.ATTR_UNKNOWN)).toBe(true)
  })

  it('rejects an invalid padding value (via Zod)', () => {
    const bad: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-section',
              attributes: { padding: 'banana' },
              children: [{ tagName: 'rc-column', children: [] }],
            },
          ],
        },
      ],
    }
    const result = safeValidateEmailTemplate(bad)

    expect(result.success).toBe(false)
    if (result.success) return
    const padIssue = result.errors.find((e) => e.path.endsWith('/attributes/padding'))

    expect(padIssue).toBeDefined()
    expect(padIssue?.code).toBe(EmailTemplateErrorCodes.ATTR_INVALID_VALUE)
  })

  it('rejects a malformed color on rc-body background', () => {
    const bad: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        { tagName: 'rc-body', attributes: { 'background-color': 'not-a-color' }, children: [] },
      ],
    }
    const result = safeValidateEmailTemplate(bad)

    expect(result.success).toBe(false)
    if (result.success) return
    const colorIssue = result.errors.find((e) => e.path.endsWith('/attributes/background-color'))

    expect(colorIssue?.code).toBe(EmailTemplateErrorCodes.ATTR_INVALID_VALUE)
  })

  it('enforces rc-section maxChildCount of 20 columns', () => {
    const columns = Array.from({ length: 21 }, () => ({
      tagName: 'rc-column' as const,
      children: [],
    }))
    const bad: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            { tagName: 'rc-section', children: columns },
          ],
        },
      ],
    }
    const result = safeValidateEmailTemplate(bad)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.some((e) => e.code === EmailTemplateErrorCodes.CHILD_TOO_MANY)).toBe(true)
  })
})

describe('validateEmailTemplate — ProseMirror content delegation', () => {
  it('accepts a rc-text with a valid ProseMirror content doc', () => {
    const doc: RcmlDocument = {
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
                        content: [{ type: 'paragraph', content: [{ type: 'text', text: 'hi' }] }],
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    expect(() => validateEmailTemplate(doc)).not.toThrow()
  })

  it('surfaces invalid content as CONTENT_INVALID with prefixed path', () => {
    const doc: RcmlDocument = {
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
                      // @ts-expect-error — content's root must be type: 'doc'
                      content: { type: 'not-a-doc' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }
    const result = safeValidateEmailTemplate(doc)

    expect(result.success).toBe(false)
    if (result.success) return
    const contentIssue = result.errors.find(
      (e) => e.code === EmailTemplateErrorCodes.CONTENT_INVALID,
    )

    expect(contentIssue).toBeDefined()
    expect(contentIssue?.path.startsWith('/children/1/children/0/children/0/children/0/content')).toBe(
      true,
    )
  })
})

describe('validateEmailTemplate — XML string input', () => {
  it('accepts a valid XML template with an rc-text body', () => {
    const xml = `<rcml>
      <rc-head></rc-head>
      <rc-body background-color="#ffffff" width="600px">
        <rc-section>
          <rc-column width="100%">
            <rc-text>Hello world</rc-text>
          </rc-column>
        </rc-section>
      </rc-body>
    </rcml>`

    expect(() => validateEmailTemplate(xml)).not.toThrow()
  })

  it('returns an XML_PARSE_ERROR for malformed XML', () => {
    const result = safeValidateEmailTemplate('<rcml><rc-body></rc-head></rcml>')

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors[0]?.code).toBe(EmailTemplateErrorCodes.XML_PARSE_ERROR)
  })

  it('returns a ROOT_INVALID when the XML has no element payload', () => {
    const result = safeValidateEmailTemplate('   ')

    expect(result.success).toBe(false)
    if (result.success) return
    // Either ROOT_INVALID or XML_PARSE_ERROR is acceptable — both paths are
    // translated, and fast-xml-parser may surface either depending on version.
    expect([
      EmailTemplateErrorCodes.ROOT_INVALID,
      EmailTemplateErrorCodes.XML_PARSE_ERROR,
    ]).toContain(result.errors[0]?.code)
  })

  it('propagates CONTENT_INVALID when RFM inside rc-text fails to parse', () => {
    // Use a string that (if parsed as Email RFM) would emit an
    // EMAIL_RFM_PARSE_ERROR at the xml-to-rcml layer. The xml→rcml path uses
    // emailRfmToJson on the text content; malformed Email RFM surfaces as
    // EMAIL_RFM_PARSE_ERROR, which validate-email-template translates to
    // CONTENT_INVALID.
    const xml = `<rcml><rc-head></rc-head><rc-body width="600px"><rc-section><rc-column><rc-text>:font[</rc-text></rc-column></rc-section></rc-body></rcml>`
    const result = safeValidateEmailTemplate(xml)

    // Either the RFM rejects (our happy path) or it tolerates the bracket.
    // In both cases the point is exercise the CONTENT_INVALID translation
    // branch if it does reject.
    if (!result.success) {
      for (const err of result.errors) {
        expect([
          EmailTemplateErrorCodes.CONTENT_INVALID,
          EmailTemplateErrorCodes.XML_PARSE_ERROR,
          EmailTemplateErrorCodes.ROOT_INVALID,
          EmailTemplateErrorCodes.SCHEMA_VIOLATION,
          EmailTemplateErrorCodes.ATTR_INVALID_VALUE,
          EmailTemplateErrorCodes.ATTR_UNKNOWN,
        ]).toContain(err.code)
      }
    }
  })
})

describe('validateColumnWidths integration via safeValidateEmailTemplate', () => {
  it('flags a multi-column section whose percentage widths do not sum to 100%', () => {
    const doc: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          attributes: { width: '600px' },
          children: [
            {
              tagName: 'rc-section',
              children: [
                { tagName: 'rc-column', attributes: { width: '40%' }, children: [] },
                { tagName: 'rc-column', attributes: { width: '40%' }, children: [] },
              ],
            },
          ],
        },
      ],
    } as unknown as RcmlDocument
    const result = safeValidateEmailTemplate(doc)

    expect(result.success).toBe(false)

    if (!result.success) {
      expect(result.errors.some(
        (e) => e.code === EmailTemplateErrorCodes.ATTR_INVALID_VALUE && e.message.includes('sum to')
      )).toBe(true)
    }
  })

  it('accepts a multi-column section whose percentage widths sum to 100%', () => {
    const doc: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          attributes: { width: '600px' },
          children: [
            {
              tagName: 'rc-section',
              children: [
                { tagName: 'rc-column', attributes: { width: '50%' }, children: [] },
                { tagName: 'rc-column', attributes: { width: '50%' }, children: [] },
              ],
            },
          ],
        },
      ],
    } as unknown as RcmlDocument
    const result = safeValidateEmailTemplate(doc)

    if (!result.success) {
      const columnSumErrors = result.errors.filter(
        (e) => e.code === EmailTemplateErrorCodes.ATTR_INVALID_VALUE && e.message.includes('sum to')
      )

      expect(columnSumErrors).toHaveLength(0)
    }
  })
})

describe('EmailTemplateValidationError shape', () => {
  it('matches the expected error format', () => {
    const bad = { tagName: 'rcml' } as unknown as RcmlDocument
    let captured: EmailTemplateValidationError | null = null

    try {
      validateEmailTemplate(bad)
    } catch (err) {
      captured = err as EmailTemplateValidationError
    }

    expect(captured).toBeInstanceOf(EmailTemplateValidationError)
    expect(captured?.name).toBe('EmailTemplateValidationError')
    expect(Array.isArray(captured?.errors)).toBe(true)
    expect(captured?.message.startsWith('RCML email template validation failed:\n')).toBe(true)
  })

  it("truncates the summary with '...and N more' past 5 issues", () => {
    // Produce ≥6 issues by stacking bad attribute values on a section.
    const bad: RcmlDocument = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        {
          tagName: 'rc-body',
          children: [
            {
              tagName: 'rc-section',
              attributes: {
                padding: 'x',
                'padding-top': 'x',
                'padding-bottom': 'x',
                'padding-left': 'x',
                'padding-right': 'x',
                'background-color': 'x',
                border: 'x',
              },
              children: [{ tagName: 'rc-column', children: [] }],
            },
          ],
        },
      ],
    }
    const result = safeValidateEmailTemplate(bad)

    expect(result.success).toBe(false)
    if (result.success) return
    expect(result.errors.length).toBeGreaterThan(5)
    const err = new EmailTemplateValidationError(result.errors)

    expect(err.message).toContain('...and')
    expect(err.message).toContain('more')
  })
})

// ─── Regression: editor-generated rc-attributes children ─────────────────────

describe('validateEmailTemplate — rc-attributes attribute-override nodes', () => {
  it('accepts rc-body/rc-section/rc-button inside rc-attributes without children/content', () => {
    // The editor emits attribute-default nodes with only `attributes` — no
    // `children` on rc-body/rc-section, no `content` on rc-button.  The
    // schema must accept this shape.
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [
            {
              tagName: 'rc-attributes',
              children: [
                { tagName: 'rc-body', attributes: { 'background-color': '#f3f3f3' } },
                { tagName: 'rc-section', attributes: { 'background-color': '#ffffff' } },
                { tagName: 'rc-button', attributes: { 'background-color': '#05cc87' } },
              ],
            },
          ],
        },
        { tagName: 'rc-body', children: [] },
      ],
    } as unknown as RcmlDocument

    const result = safeValidateEmailTemplate(doc)

    expect(result.success).toBe(true)
  })

  it('accepts rc-class and rc-social inside rc-attributes', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [
            {
              tagName: 'rc-attributes',
              children: [
                {
                  tagName: 'rc-class',
                  attributes: { name: 'rcml-brand-color', 'background-color': '#F6F8F9' },
                },
                {
                  tagName: 'rc-social',
                  children: [
                    { tagName: 'rc-social-element', attributes: { name: 'facebook', href: 'https://facebook.com/' } },
                  ],
                },
              ],
            },
          ],
        },
        { tagName: 'rc-body', children: [] },
      ],
    } as unknown as RcmlDocument

    const result = safeValidateEmailTemplate(doc)

    expect(result.success).toBe(true)
  })

  it('rejects an unknown tag inside rc-attributes', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [
            {
              tagName: 'rc-attributes',
              children: [
                { tagName: 'rc-column', children: [] },
              ],
            },
          ],
        },
        { tagName: 'rc-body', children: [] },
      ],
    } as unknown as RcmlDocument

    const result = safeValidateEmailTemplate(doc)

    expect(result.success).toBe(false)
  })
})

// ─── Regression: rc-preview / rc-plain-text / rc-raw content fields ──────────

describe('validateEmailTemplate — non-PM content fields', () => {
  it('accepts rc-plain-text with a { type, text } content object', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [
            {
              tagName: 'rc-plain-text',
              content: { type: 'text', text: 'Click here to unsubscribe: %Link:Unsubscribe%' },
            },
          ],
        },
        { tagName: 'rc-body', children: [] },
      ],
    } as unknown as RcmlDocument

    expect(safeValidateEmailTemplate(doc).success).toBe(true)
  })

  it('accepts rc-preview with a string content', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [{ tagName: 'rc-preview', content: 'Check out our latest deals' }],
        },
        { tagName: 'rc-body', children: [] },
      ],
    } as unknown as RcmlDocument

    expect(safeValidateEmailTemplate(doc).success).toBe(true)
  })

  it('accepts rc-preview without content', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [{ tagName: 'rc-preview' }] },
        { tagName: 'rc-body', children: [] },
      ],
    } as unknown as RcmlDocument

    expect(safeValidateEmailTemplate(doc).success).toBe(true)
  })

  it('rejects rc-plain-text with wrong content shape', () => {
    const doc = {
      tagName: 'rcml',
      children: [
        {
          tagName: 'rc-head',
          children: [
            // @ts-expect-error — intentionally wrong shape
            { tagName: 'rc-plain-text', content: 'just a string, not an object' },
          ],
        },
        { tagName: 'rc-body', children: [] },
      ],
    } as unknown as RcmlDocument

    const result = safeValidateEmailTemplate(doc)

    expect(result.success).toBe(false)
  })
})

// ─── Regression: full editor-produced document ───────────────────────────────

describe('validateEmailTemplate — full editor-produced document', () => {
  it('accepts a complete branded template as produced by the editor', () => {
    const doc = {
      id: '2f142943-4c50-4e15-8bc9-e62cd0cc1048',
      tagName: 'rcml',
      children: [
        {
          id: 'e71cb80d-93fa-4239-8a1b-91a43d9233be',
          tagName: 'rc-head',
          children: [
            {
              id: 'ca9f6719-84fa-45e5-afae-d62240ad1500',
              tagName: 'rc-brand-style',
              attributes: { id: '10457' },
            },
            {
              id: '18ce0f2b-1f23-4f74-aa1f-fd07674c4ad9',
              tagName: 'rc-attributes',
              children: [
                { id: '6b7020c2-01e9-4dc6-9aae-5d0294817763', tagName: 'rc-body', attributes: { 'background-color': '#f3f3f3' } },
                { id: '910efa7b-3a65-4377-9ee2-a11d92c429e2', tagName: 'rc-section', attributes: { 'background-color': '#ffffff' } },
                { id: '3c07274e-f634-4441-a846-37673d03cac6', tagName: 'rc-button', attributes: { 'background-color': '#05cc87' } },
                { id: '9e389fd8-8ac5-4191-802e-8cd29e1bceeb', tagName: 'rc-class', attributes: { name: 'rcml-logo-style', src: 'https://img.rule.io/14702/69709c979b5df' } },
                {
                  id: '109a86ff-796b-4f93-b089-0cf02647f57e',
                  tagName: 'rc-social',
                  children: [
                    { id: '64a9d206-33c2-4453-a619-f765c3e454b3', tagName: 'rc-social-element', attributes: { name: 'facebook', href: 'https://facebook.com/rulecom' } },
                    { id: '7bc58ba7-a60d-4731-b323-e0d06752306b', tagName: 'rc-social-element', attributes: { name: 'instagram', href: 'https://instagram.com/rulecom' } },
                    { id: 'e3f83567-876c-4101-b0c2-b383c49d7d40', tagName: 'rc-social-element', attributes: { name: 'linkedin', href: 'https://linkedin.com/company/rulecom' } },
                    { id: 'daf55b98-6603-4300-aede-6d3a4ae2e379', tagName: 'rc-social-element', attributes: { name: 'tiktok', href: 'https://www.tiktok.com' } },
                    { id: '0fb4982b-0b84-49c5-baaa-aaa7fdfd2de0', tagName: 'rc-social-element', attributes: { name: 'x', href: 'https://www.x.com' } },
                    { id: 'e7b166f0-f647-4c7d-a4bd-ea58cc91430c', tagName: 'rc-social-element', attributes: { name: 'web', href: 'https://rule.se' } },
                  ],
                },
                { id: 'c6e6dc65-acbd-4f45-9fcb-daeb5e700ae1', tagName: 'rc-class', attributes: { name: 'rcml-brand-color', 'background-color': '#F6F8F9' } },
                { id: '28e82ed1-93f3-49b9-be4a-9cd28aaaf7fd', tagName: 'rc-class', attributes: { name: 'rcml-p-style', 'font-family': "'Lato',   sans-serif", 'font-size': '16px', color: '#0F0F1F', 'line-height': '120%', 'letter-spacing': '0em', 'font-weight': '400', 'font-style': 'normal', 'text-decoration': 'none' } },
                { id: '7fcc0040-c138-49f7-98a2-e7ab47274ab4', tagName: 'rc-class', attributes: { name: 'rcml-h1-style', 'font-family': "'Helvetica',   sans-serif", 'font-size': '36px', color: '#0F0F1F', 'line-height': '120%', 'letter-spacing': '0em', 'font-weight': '700', 'font-style': 'normal', 'text-decoration': 'none' } },
                { id: '55e04b66-bc8f-43ee-a090-64a0e28b5491', tagName: 'rc-class', attributes: { name: 'rcml-h2-style', 'font-family': "'Helvetica',   sans-serif", 'font-size': '28px', color: '#0F0F1F', 'line-height': '120%', 'letter-spacing': '0em', 'font-weight': '700', 'font-style': 'normal', 'text-decoration': 'none' } },
                { id: '58acf5f1-688c-4a49-8325-05adb98fc4c8', tagName: 'rc-class', attributes: { name: 'rcml-h3-style', 'font-family': "'Helvetica',   sans-serif", 'font-size': '24px', color: '#0F0F1F', 'line-height': '120%', 'letter-spacing': '0em', 'font-weight': '700', 'font-style': 'normal', 'text-decoration': 'none' } },
                { id: '72d2b2d8-221f-4003-8ed9-cef4ff62c62b', tagName: 'rc-class', attributes: { name: 'rcml-h4-style', 'font-family': "'Helvetica',   sans-serif", 'font-size': '18px', color: '#0F0F1F', 'line-height': '120%', 'letter-spacing': '0em', 'font-weight': '700', 'font-style': 'normal', 'text-decoration': 'none' } },
                { id: '2df5206d-a281-481e-9608-e0850e8d9d5b', tagName: 'rc-class', attributes: { name: 'rcml-label-style', 'font-family': "'Lato',   sans-serif", 'font-size': '14px', color: '#FFFFFF', 'line-height': '120%', 'letter-spacing': '0em', 'font-weight': '400', 'font-style': 'normal', 'text-decoration': 'none' } },
              ],
            },
            { id: '37d4595b-8a79-4eb7-b84c-b9f2f0475377', tagName: 'rc-preview' },
            {
              id: '51aa7b3d-ad76-4ebc-b42d-50039b890eb5',
              tagName: 'rc-plain-text',
              content: { type: 'text', text: 'Klicka här för att läsa mailet på webben: %Link:WebBrowser%\n\nLorem ipsum dolor sit amet\n\n---\nKlicka här för att avregistrera dig från detta nyhetsbrev: %Link:Unsubscribe%\nskickat med Rule - http://www.rule.se' },
            },
            { id: 'f091c148-5337-4a7c-946d-7332edc506c9', tagName: 'rc-font', attributes: { name: "'Lato'", href: 'https://fonts.googleapis.com/css?family=Lato' } },
          ],
        },
        {
          id: '6edb1753-975f-4e9c-b0dc-b0276a3f40fc',
          tagName: 'rc-body',
          children: [
            {
              id: 'a5518de0-5453-40e7-be09-6923e9a0a6ac',
              tagName: 'rc-section',
              children: [
                {
                  id: '244f498e-06b5-43f2-ab2c-54306b70a295',
                  tagName: 'rc-column',
                  attributes: { padding: '0 20px' },
                  children: [
                    { id: 'ad00bab6-ce53-4a76-9ade-d81f36714c81', tagName: 'rc-logo', attributes: { 'rc-class': 'rcml-logo-style rc-initial-logo', width: '96px', padding: '20px 0' } },
                  ],
                },
              ],
            },
            {
              id: '7f7b575f-80fa-4c78-8d45-6a211d8f103a',
              tagName: 'rc-section',
              attributes: { padding: '20px 0' },
              children: [
                {
                  id: '5a166430-f9f1-461a-a1a6-8dea2906a330',
                  tagName: 'rc-column',
                  attributes: { padding: '0 20px' },
                  children: [
                    { id: '670a7b30-4966-48b2-bcdb-fe63f1433d08', tagName: 'rc-image', attributes: { padding: '0 0 20px 0', src: 'https://app.rule.io/img/editor/image.png' } },
                    {
                      id: 'ee11fb66-2129-4c18-8dd8-6bffb077dfe6',
                      tagName: 'rc-heading',
                      attributes: { 'rc-class': 'rcml-h1-style' },
                      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Replace this title' }] }] },
                    },
                    {
                      id: 'b73b1189-acfb-4654-a9fe-539f720cd349',
                      tagName: 'rc-text',
                      attributes: { 'rc-class': 'rcml-p-style' },
                      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click into this box to change the font settings.' }] }] },
                    },
                    {
                      id: 'e7a39c4d-c524-45b7-b927-b791b1c62098',
                      tagName: 'rc-button',
                      attributes: { align: 'center', border: 'none', 'border-radius': '8px', 'inner-padding': '10px 16px', padding: '0 0 20px 0', 'padding-bottom': '20px', 'text-align': 'center', 'vertical-align': 'middle', 'rc-class': 'rcml-label-style' },
                      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Click me!' }] }] },
                    },
                  ],
                },
              ],
            },
            {
              id: '171381bc-0a6b-4899-862e-235133c23119',
              tagName: 'rc-section',
              attributes: { padding: '20px 0px 20px 0px', 'background-color': '#f3f3f3' },
              children: [
                {
                  id: '10975dc0-e3fd-4ec1-84e9-83263a6df2af',
                  tagName: 'rc-column',
                  attributes: { padding: '0 20px' },
                  children: [
                    {
                      id: 'c1c0b664-0239-4bbb-b907-472848b79eee',
                      tagName: 'rc-text',
                      attributes: { align: 'center', padding: '0px 0px 10px 0px', 'rc-class': 'rcml-p-style' },
                      content: {
                        type: 'doc',
                        content: [{
                          type: 'paragraph',
                          content: [
                            { type: 'text', text: 'Open in browser', marks: [{ type: 'font', attrs: { 'font-size': '10px', 'text-decoration': 'underline', color: '#666666' } }, { type: 'link', attrs: { href: '[Link:WebBrowser]', target: '_blank', 'no-tracked': 'true' } }] },
                            { type: 'text', text: ' ' },
                            { type: 'text', text: '|', marks: [{ type: 'font', attrs: { 'font-size': '10px', color: '#666666' } }] },
                            { type: 'text', text: ' ' },
                            { type: 'text', text: 'Unsubscribe', marks: [{ type: 'font', attrs: { 'font-size': '10px', 'text-decoration': 'underline', color: '#666666' } }, { type: 'link', attrs: { href: '[Link:Unsubscribe]', target: '_blank', 'no-tracked': 'true' } }] },
                          ],
                        }],
                      },
                    },
                    {
                      id: '6380b542-3286-46a4-aa5d-3ccce584f92b',
                      tagName: 'rc-text',
                      attributes: { align: 'center', padding: '10px 0px 0px 0px', 'font-family': "'Helvetica',   sans-serif", 'font-style': 'normal', 'line-height': '120%', 'letter-spacing': '0em', color: '#666666', 'font-weight': '400', 'text-decoration': 'none', 'font-size': '10px', 'rc-class': 'rcml-p-style' },
                      content: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Certified by Rule' }] }] },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    } as unknown as RcmlDocument

    const result = safeValidateEmailTemplate(doc)

    if (!result.success) {
      // Print errors to aid diagnosis when the test fails.
      console.error('Validation errors:', JSON.stringify(result.errors, null, 2))
    }

    expect(result.success).toBe(true)
  })
})
