import { describe, it, expect } from 'vitest'
import { emailRfmToJson, emailInlineRfmToJson } from './email-rfm-to-json.js'
import { RcmlValidationError } from './content/parser/parse.js'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyJson = Record<string, any>

/** Full font attrs object with all 8 values null — used to assert unset attrs are null. */
const NULL_FONT_ATTRS = {
  'font-family': null,
  'font-size': null,
  'line-height': null,
  'letter-spacing': null,
  'font-style': null,
  'font-weight': null,
  'text-decoration': null,
  color: null,
}

// ─── emailRfmToJson ────────────────────────────────────────────────────────────────

describe('emailRfmToJson()', () => {
  // ─── Document structure ─────────────────────────────────────────────────────

  describe('document structure', () => {
    it('plain text produces a doc > paragraph > text node', () => {
      expect(emailRfmToJson('Hello.')).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello.' }],
          },
        ],
      })
    })

    it('multiple paragraphs produce multiple doc children', () => {
      const doc = emailRfmToJson('First.\n\nSecond.') as AnyJson

      expect(doc.content).toHaveLength(2)
      expect(doc.content[0].type).toBe('paragraph')
      expect(doc.content[1].type).toBe('paragraph')
    })
  })

  // ─── :font mark — attribute coverage ────────────────────────────────────────

  describe(':font mark — attribute coverage', () => {
    it('font-weight → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{font-weight="700"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.type).toBe('font')
      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'font-weight': '700' })
    })

    it('font-size → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{font-size="16px"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'font-size': '16px' })
    })

    it('line-height → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{line-height="1.5"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'line-height': '1.5' })
    })

    it('letter-spacing → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{letter-spacing="0.5px"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'letter-spacing': '0.5px' })
    })

    it('font-style italic → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{font-style="italic"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'font-style': 'italic' })
    })

    it('text-decoration underline → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{text-decoration="underline"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'text-decoration': 'underline' })
    })

    it('text-decoration line-through → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{text-decoration="line-through"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'text-decoration': 'line-through' })
    })

    it('color → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{color="#ff0000"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, color: '#ff0000' })
    })

    it('font-family → set; all other 7 attrs are null', () => {
      const mark = (emailRfmToJson(':font[text]{font-family="Arial"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'font-family': 'Arial' })
    })

    it('all 8 attrs set simultaneously', () => {
      const mark = (
        emailRfmToJson(
          ':font[text]{font-family="Arial" font-size="18px" line-height="1.5" letter-spacing="0.1em" font-style="italic" font-weight="700" text-decoration="underline" color="#0000ff"}',
        ) as AnyJson
      ).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({
        'font-family': 'Arial',
        'font-size': '18px',
        'line-height': '1.5',
        'letter-spacing': '0.1em',
        'font-style': 'italic',
        'font-weight': '700',
        'text-decoration': 'underline',
        color: '#0000ff',
      })
    })
  })

  // ─── :font mark — position in paragraph ─────────────────────────────────────

  describe(':font mark — position in paragraph', () => {
    it('font-only paragraph produces a single marked text node', () => {
      const content = (emailRfmToJson(':font[hello]{font-weight="700"}') as AnyJson).content[0].content

      expect(content).toHaveLength(1)
      expect(content[0].text).toBe('hello')
      expect(content[0].marks[0].type).toBe('font')
    })

    it('font at start: [marked, plain]', () => {
      const content = (emailRfmToJson(':font[bold]{font-weight="700"} after') as AnyJson).content[0].content

      expect(content).toHaveLength(2)
      expect(content[0].marks[0].type).toBe('font')
      expect(content[1]).toEqual({ type: 'text', text: ' after' })
    })

    it('font at end: [plain, marked]', () => {
      const content = (emailRfmToJson('before :font[bold]{font-weight="700"}') as AnyJson).content[0].content

      expect(content).toHaveLength(2)
      expect(content[0]).toEqual({ type: 'text', text: 'before ' })
      expect(content[1].marks[0].type).toBe('font')
    })

    it('font in middle: [plain, marked, plain]', () => {
      const content = (emailRfmToJson('before :font[bold]{font-weight="700"} after') as AnyJson).content[0].content

      expect(content).toHaveLength(3)
      expect(content[0]).toEqual({ type: 'text', text: 'before ' })
      expect(content[1].marks[0].type).toBe('font')
      expect(content[2]).toEqual({ type: 'text', text: ' after' })
    })

    it('multiple font spans in one paragraph', () => {
      const content = (emailRfmToJson(':font[A]{color="red"} :font[B]{color="blue"}') as AnyJson).content[0].content

      expect(content).toHaveLength(3)
      expect(content[0].marks[0].attrs.color).toBe('red')
      expect(content[1]).toEqual({ type: 'text', text: ' ' })
      expect(content[2].marks[0].attrs.color).toBe('blue')
    })
  })

  // ─── :link mark ─────────────────────────────────────────────────────────────

  describe(':link mark', () => {
    it('href only → target:null, no-tracked:"false"', () => {
      const mark = (emailRfmToJson(':link[click]{href="https://example.com"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.type).toBe('link')
      expect(mark.attrs).toEqual({ href: 'https://example.com', target: null, 'no-tracked': 'false' })
    })

    it('href + target="_blank"', () => {
      const mark = (emailRfmToJson(':link[click]{href="https://example.com" target="_blank"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.attrs.target).toBe('_blank')
    })

    it('href + no-tracked="true"', () => {
      const mark = (emailRfmToJson(':link[click]{href="https://example.com" no-tracked="true"}') as AnyJson).content[0]
        .content[0].marks[0]

      expect(mark.attrs['no-tracked']).toBe('true')
    })

    it('all three link attrs set', () => {
      const mark = (
        emailRfmToJson(':link[click]{href="https://example.com" target="_blank" no-tracked="true"}') as AnyJson
      ).content[0].content[0].marks[0]

      expect(mark.attrs).toEqual({
        href: 'https://example.com',
        target: '_blank',
        'no-tracked': 'true',
      })
    })
  })

  // ─── Mark nesting / accumulation ────────────────────────────────────────────

  describe('mark nesting / accumulation', () => {
    it(':link wrapping :font → text node carries both marks', () => {
      const node = (emailRfmToJson(':link[:font[bold]{font-weight="700"}]{href="https://x.com"}') as AnyJson).content[0]
        .content[0]
      const types = node.marks.map((m: AnyJson) => m.type)

      expect(types).toContain('font')
      expect(types).toContain('link')
    })

    it(':font wrapping :link → text node carries both marks', () => {
      const node = (emailRfmToJson(':font[:link[click]{href="https://x.com"}]{font-weight="700"}') as AnyJson).content[0]
        .content[0]
      const types = node.marks.map((m: AnyJson) => m.type)

      expect(types).toContain('font')
      expect(types).toContain('link')
    })

    it(':font wrapping :font — two font marks accumulated', () => {
      const node = (emailRfmToJson(':font[:font[text]{color="red"}]{font-weight="700"}') as AnyJson).content[0].content[0]
      const fontMarks = node.marks.filter((m: AnyJson) => m.type === 'font')

      expect(fontMarks).toHaveLength(2)
      const weights = fontMarks.map((m: AnyJson) => m.attrs['font-weight'])
      const colors = fontMarks.map((m: AnyJson) => m.attrs.color)

      expect(weights).toContain('700')
      expect(colors).toContain('red')
    })

    it(':link with mixed text and :font children — font+link on inner, link-only on outer', () => {
      const content = (emailRfmToJson(':link[plain :font[styled]{font-style="italic"}]{href="https://x.com"}') as AnyJson)
        .content[0].content

      expect(content).toHaveLength(2)
      expect(content[0].marks.map((m: AnyJson) => m.type)).toEqual(['link'])
      const types = content[1].marks.map((m: AnyJson) => m.type)

      expect(types).toContain('font')
      expect(types).toContain('link')
    })
  })

  // ─── Bullet list ─────────────────────────────────────────────────────────────

  describe('bullet list', () => {
    it('simple 2-item bullet list structure', () => {
      const doc = emailRfmToJson('- one\n- two') as AnyJson

      expect(doc.content[0].type).toBe('bullet-list')
      expect(doc.content[0].content).toHaveLength(2)
      expect(doc.content[0].content[0].type).toBe('list-item')
      expect(doc.content[0].content[0].content[0].type).toBe('paragraph')
      expect(doc.content[0].content[0].content[0].content[0].text).toBe('one')
    })

    it('nested bullet list inside a list-item', () => {
      const doc = emailRfmToJson('- parent\n  - child') as AnyJson
      const outerItem = doc.content[0].content[0]
      const inner = outerItem.content.find((c: AnyJson) => c.type === 'bullet-list')

      expect(inner).toBeDefined()
      expect(inner.content[0].type).toBe('list-item')
    })

    it('list item with :font mark', () => {
      const doc = emailRfmToJson('- :font[bold]{font-weight="700"}') as AnyJson
      const para = doc.content[0].content[0].content[0]

      expect(para.content[0].marks[0].type).toBe('font')
    })
  })

  // ─── Ordered list ─────────────────────────────────────────────────────────────

  describe('ordered list', () => {
    it('simple ordered list produces "ordered-list" node', () => {
      const doc = emailRfmToJson('1. first\n2. second') as AnyJson

      expect(doc.content[0].type).toBe('ordered-list')
      expect(doc.content[0].content).toHaveLength(2)
      expect(doc.content[0].content[0].type).toBe('list-item')
    })
  })

  // ─── :::align ─────────────────────────────────────────────────────────────────

  describe(':::align', () => {
    it('value="center" → align block with attrs.value "center"', () => {
      const doc = emailRfmToJson(':::align{value="center"}\nHello\n:::') as AnyJson

      expect(doc.content[0].type).toBe('align')
      expect(doc.content[0].attrs.value).toBe('center')
      expect(doc.content[0].content[0].type).toBe('paragraph')
    })

    it('value="right"', () => {
      const doc = emailRfmToJson(':::align{value="right"}\nHi\n:::') as AnyJson

      expect(doc.content[0].attrs.value).toBe('right')
    })

    it('value="left"', () => {
      const doc = emailRfmToJson(':::align{value="left"}\nHi\n:::') as AnyJson

      expect(doc.content[0].attrs.value).toBe('left')
    })

    it('align wrapping a bullet list', () => {
      const doc = emailRfmToJson(':::align{value="center"}\n- item\n:::') as AnyJson

      expect(doc.content[0].type).toBe('align')
      expect(doc.content[0].content[0].type).toBe('bullet-list')
    })
  })

  // ─── ::placeholder ────────────────────────────────────────────────────────────

  describe('::placeholder', () => {
    it('standalone on own line → paragraph wrapping placeholder atom', () => {
      const doc = emailRfmToJson('::placeholder{type="CustomField" value="v" name="n" original="o"}') as AnyJson

      expect(doc.content[0].type).toBe('paragraph')
      expect(doc.content[0].content[0].type).toBe('placeholder')
    })

    it('full attrs present; max-length defaults to null', () => {
      const attrs = (emailRfmToJson('::placeholder{type="User" value="John" name="First name" original="[User:Name]"}') as AnyJson)
        .content[0].content[0].attrs

      expect(attrs).toEqual({
        type: 'User',
        value: 'John',
        name: 'First name',
        original: '[User:Name]',
        'max-length': null,
      })
    })

    it('max-length attr is populated when set', () => {
      const attrs = (
        emailRfmToJson('::placeholder{type="User" value="v" name="n" original="o" max-length="100"}') as AnyJson
      ).content[0].content[0].attrs

      expect(attrs['max-length']).toBe('100')
    })

    it('numeric string value is coerced to a number', () => {
      const attrs = (emailRfmToJson('::placeholder{type="CustomField" value="42" name="n" original="o"}') as AnyJson).content[0]
        .content[0].attrs

      expect(attrs.value).toBe(42)
    })

    it('absent value attr becomes null', () => {
      const attrs = (emailRfmToJson('::placeholder{type="Date" name="n" original="o"}') as AnyJson).content[0].content[0].attrs

      expect(attrs.value).toBeNull()
    })

    it('supports all 5 placeholder types', () => {
      const types = ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date'] as const

      for (const t of types) {
        const attrs = (emailRfmToJson(`::placeholder{type="${t}" value="v" name="n" original="o"}`) as AnyJson).content[0]
          .content[0].attrs

        expect(attrs.type).toBe(t)
      }
    })

    it('placeholder inline in paragraph — atom sits between text nodes', () => {
      const content = (
        emailRfmToJson('before ::placeholder{type="User" value="v" name="n" original="o"} after') as AnyJson
      ).content[0].content

      expect(content[0]).toEqual({ type: 'text', text: 'before ' })
      expect(content[1].type).toBe('placeholder')
      expect(content[2]).toEqual({ type: 'text', text: ' after' })
    })
  })

  // ─── ::loop-value ─────────────────────────────────────────────────────────────

  describe('::loop-value', () => {
    it('standalone → paragraph wrapping loop-value atom with correct attrs', () => {
      const doc = emailRfmToJson('::loop-value{original="[loop:item]" value="item" index="0"}') as AnyJson

      expect(doc.content[0].type).toBe('paragraph')

      const atom = doc.content[0].content[0]

      expect(atom.type).toBe('loop-value')
      expect(atom.attrs).toEqual({ original: '[loop:item]', value: 'item', index: '0' })
    })

    it('inline in paragraph — atom sits between text nodes', () => {
      const content = (
        emailRfmToJson('item: ::loop-value{original="[loop:item]" value="item" index="0"} end') as AnyJson
      ).content[0].content

      expect(content[0].type).toBe('text')
      expect(content[1].type).toBe('loop-value')
      expect(content[2].type).toBe('text')
    })
  })

  // ─── Real-world fixtures ──────────────────────────────────────────────────────

  describe('real-world fixtures', () => {
    it('mixed :font paragraph matches expected JSON exactly', () => {
      const md =
        'Click into this :font[box]{font-weight="700"} to :font[change]{color="#8931B5"} the font :font[settings]{text-decoration="line-through"}. Edit this text to include additional information and a description of the image. test\n'

      expect(emailRfmToJson(md)).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Click into this ' },
              {
                type: 'text',
                marks: [{ type: 'font', attrs: { ...NULL_FONT_ATTRS, 'font-weight': '700' } }],
                text: 'box',
              },
              { type: 'text', text: ' to ' },
              {
                type: 'text',
                marks: [{ type: 'font', attrs: { ...NULL_FONT_ATTRS, color: '#8931B5' } }],
                text: 'change',
              },
              { type: 'text', text: ' the font ' },
              {
                type: 'text',
                marks: [{ type: 'font', attrs: { ...NULL_FONT_ATTRS, 'text-decoration': 'line-through' } }],
                text: 'settings',
              },
              {
                type: 'text',
                text: '. Edit this text to include additional information and a description of the image. test',
              },
            ],
          },
        ],
      })
    })

    it('inline placeholders mixed with text match expected JSON exactly', () => {
      const md =
        'Edit this text to include additional information ::placeholder{type="CustomField" original="[CustomField:Order.CreatedAt]" name="Order.CreatedAt" value="11"} and a description of the image. test ::placeholder{type="User" original="[User:Street]" name="Street" value="Street"} and another one 😁 is ::placeholder{type="Date" original="[Date:yesterday::m-d-Y]" name="Yesterday"}.\n'

      expect(emailRfmToJson(md)).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Edit this text to include additional information ' },
              {
                type: 'placeholder',
                attrs: {
                  type: 'CustomField',
                  original: '[CustomField:Order.CreatedAt]',
                  name: 'Order.CreatedAt',
                  value: 11,
                  'max-length': null,
                },
              },
              { type: 'text', text: ' and a description of the image. test ' },
              {
                type: 'placeholder',
                attrs: {
                  type: 'User',
                  original: '[User:Street]',
                  name: 'Street',
                  value: 'Street',
                  'max-length': null,
                },
              },
              { type: 'text', text: ' and another one 😁 is ' },
              {
                type: 'placeholder',
                attrs: {
                  type: 'Date',
                  original: '[Date:yesterday::m-d-Y]',
                  name: 'Yesterday',
                  value: null,
                  'max-length': null,
                },
              },
              { type: 'text', text: '.' },
            ],
          },
        ],
      })
    })

    it('21 consecutive placeholders with no surrounding text match expected JSON exactly', () => {
      const md =
        '::placeholder{type="User" original="[User:CompanyName]" name="Company name" value="CompanyName"}' +
        '::placeholder{type="User" original="[User:Street]" name="Street" value="Street"}' +
        '::placeholder{type="User" original="[User:Zip]" name="Zip" value="Zip"}' +
        '::placeholder{type="User" original="[User:City]" name="City" value="City"}' +
        '::placeholder{type="User" original="[User:EmailAddress]" name="Email address" value="EmailAddress"}' +
        '::placeholder{type="Subscriber" original="[Subscriber:email]" name="Email" value="email"}' +
        '::placeholder{type="Subscriber" original="[Subscriber:phone_number]" name="Phone number" value="phone_number"}' +
        '::placeholder{type="Subscriber" original="[Subscriber:language]" name="Language" value="language"}' +
        '::placeholder{type="CustomField" original="[CustomField:Order.CreatedAt]" name="Order.CreatedAt" value="11"}' +
        '::placeholder{type="CustomField" original="[CustomField:Order.Id]" name="Order.Id" value="10"}' +
        '::placeholder{type="CustomField" original="[CustomField:Order.Total]" name="Order.Total" value="13"}' +
        '::placeholder{type="CustomField" original="[CustomField:Order.Products]" name="Order.Products" value="12"}' +
        '::placeholder{type="CustomField" original="[CustomField:Subscriber.Interests]" name="Subscriber.Interests" value="5"}' +
        '::placeholder{type="CustomField" original="[CustomField:Subscriber.FullName]" name="Subscriber.FullName" value="6"}' +
        '::placeholder{type="Date" original="[Date:now::Y-m-d]" name="Now"}' +
        '::placeholder{type="Date" original="[Date:tomorrow::Y-m-d]" name="Tomorrow"}' +
        '::placeholder{type="Date" original="[Date:yesterday::m/d/Y]" name="Yesterday"}' +
        '::placeholder{type="Date" original="[Date:in-2-days::m-d-Y]" name="In-2-days"}' +
        '::placeholder{type="Date" original="[Date:3-days-ago::d/m/Y]" name="3-days-ago"}' +
        '::placeholder{type="RemoteContent" original="[RemoteContent:https://google.com]" name="RemoteContent" value="https://google.com"}' +
        '::placeholder{type="RemoteContent" original="[RemoteContent:https://x.com/[CustomField:Order.Id]]" name="RemoteContent" value="https://x.com/[CustomField:Order.Id]"}' +
        '\n'

      expect(emailRfmToJson(md)).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'placeholder', attrs: { type: 'User', original: '[User:CompanyName]', name: 'Company name', value: 'CompanyName', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'User', original: '[User:Street]', name: 'Street', value: 'Street', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'User', original: '[User:Zip]', name: 'Zip', value: 'Zip', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'User', original: '[User:City]', name: 'City', value: 'City', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'User', original: '[User:EmailAddress]', name: 'Email address', value: 'EmailAddress', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Subscriber', original: '[Subscriber:email]', name: 'Email', value: 'email', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Subscriber', original: '[Subscriber:phone_number]', name: 'Phone number', value: 'phone_number', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Subscriber', original: '[Subscriber:language]', name: 'Language', value: 'language', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'CustomField', original: '[CustomField:Order.CreatedAt]', name: 'Order.CreatedAt', value: 11, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'CustomField', original: '[CustomField:Order.Id]', name: 'Order.Id', value: 10, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'CustomField', original: '[CustomField:Order.Total]', name: 'Order.Total', value: 13, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'CustomField', original: '[CustomField:Order.Products]', name: 'Order.Products', value: 12, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'CustomField', original: '[CustomField:Subscriber.Interests]', name: 'Subscriber.Interests', value: 5, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'CustomField', original: '[CustomField:Subscriber.FullName]', name: 'Subscriber.FullName', value: 6, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Date', original: '[Date:now::Y-m-d]', name: 'Now', value: null, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Date', original: '[Date:tomorrow::Y-m-d]', name: 'Tomorrow', value: null, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Date', original: '[Date:yesterday::m/d/Y]', name: 'Yesterday', value: null, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Date', original: '[Date:in-2-days::m-d-Y]', name: 'In-2-days', value: null, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'Date', original: '[Date:3-days-ago::d/m/Y]', name: '3-days-ago', value: null, 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'RemoteContent', original: '[RemoteContent:https://google.com]', name: 'RemoteContent', value: 'https://google.com', 'max-length': null } },
              { type: 'placeholder', attrs: { type: 'RemoteContent', original: '[RemoteContent:https://x.com/[CustomField:Order.Id]]', name: 'RemoteContent', value: 'https://x.com/[CustomField:Order.Id]', 'max-length': null } },
            ],
          },
        ],
      })
    })
  })

  // ─── Validation errors ────────────────────────────────────────────────────────

  describe('validation errors', () => {
    it('throws RcmlValidationError for headings', () => {
      expect(() => emailRfmToJson('# Heading')).toThrow(RcmlValidationError)
    })

    it('throws RcmlValidationError for native bold (**text**)', () => {
      expect(() => emailRfmToJson('**bold**')).toThrow(RcmlValidationError)
    })

    it('accepts hard breaks (backslash or two trailing spaces)', () => {
      expect(() => emailRfmToJson('line one  \nline two')).not.toThrow()
      expect(() => emailRfmToJson('line one\\\nline two')).not.toThrow()
    })

    it('throws RcmlValidationError for unknown container directives', () => {
      expect(() => emailRfmToJson(':::unknown{}\n:::')).toThrow(RcmlValidationError)
    })

    it('multiple invalid nodes → err.errors has one entry per violation', () => {
      try {
        emailRfmToJson('# Heading\n\n> Blockquote')
      } catch (err) {
        expect(err).toBeInstanceOf(RcmlValidationError)

        if (err instanceof RcmlValidationError) {
          expect(err.errors.length).toBeGreaterThanOrEqual(2)
          expect(err.errors[0]).toHaveProperty('message')
          expect(err.errors[0]).toHaveProperty('path')
        }
      }
    })
  })
})

// ─── emailInlineRfmToJson ──────────────────────────────────────────────────────────

describe('emailInlineRfmToJson()', () => {
  describe('document structure', () => {
    it('plain text produces a doc > paragraph > text node', () => {
      expect(emailInlineRfmToJson('Hello.')).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: 'Hello.' }],
          },
        ],
      })
    })

    it('multiple paragraphs produce multiple doc children', () => {
      const doc = emailInlineRfmToJson('First.\n\nSecond.') as AnyJson

      expect(doc.content).toHaveLength(2)
    })
  })

  describe(':font mark', () => {
    it('produces a text node with a font mark', () => {
      const mark = (emailInlineRfmToJson(':font[text]{font-weight="700"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.type).toBe('font')
      expect(mark.attrs).toEqual({ ...NULL_FONT_ATTRS, 'font-weight': '700' })
    })

    it('font in middle of paragraph: [plain, marked, plain]', () => {
      const content = (emailInlineRfmToJson('before :font[bold]{font-weight="700"} after') as AnyJson).content[0].content

      expect(content).toHaveLength(3)
      expect(content[0]).toEqual({ type: 'text', text: 'before ' })
      expect(content[1].marks[0].type).toBe('font')
      expect(content[2]).toEqual({ type: 'text', text: ' after' })
    })
  })

  describe(':link mark', () => {
    it('produces a text node with a link mark', () => {
      const mark = (emailInlineRfmToJson(':link[click]{href="https://example.com"}') as AnyJson).content[0].content[0].marks[0]

      expect(mark.type).toBe('link')
      expect(mark.attrs).toEqual({ href: 'https://example.com', target: null, 'no-tracked': 'false' })
    })
  })

  describe('inline atoms', () => {
    it('::placeholder inline in paragraph', () => {
      const content = (
        emailInlineRfmToJson('Hello ::placeholder{type="User" value="v" name="n" original="o"} world') as AnyJson
      ).content[0].content

      expect(content[0]).toEqual({ type: 'text', text: 'Hello ' })
      expect(content[1].type).toBe('placeholder')
      expect(content[1].attrs.type).toBe('User')
      expect(content[2]).toEqual({ type: 'text', text: ' world' })
    })

    it('3 consecutive ::placeholder atoms → single paragraph, no text between', () => {
      const md =
        '::placeholder{type="User" original="[User:Name]" name="Name" value="John"}' +
        '::placeholder{type="Date" original="[Date:now::Y-m-d]" name="Now"}' +
        '::placeholder{type="CustomField" original="[CustomField:Order.Id]" name="Order.Id" value="10"}\n'

      const content = (emailInlineRfmToJson(md) as AnyJson).content[0].content

      expect(content).toHaveLength(3)
      expect(content[0].type).toBe('placeholder')
      expect(content[1].type).toBe('placeholder')
      expect(content[2].type).toBe('placeholder')
    })

    it('::loop-value inline in paragraph', () => {
      const content = (
        emailInlineRfmToJson('item ::loop-value{original="[loop:x]" value="x" index="0"} end') as AnyJson
      ).content[0].content

      expect(content[1].type).toBe('loop-value')
      expect(content[1].attrs.original).toBe('[loop:x]')
    })
  })

  describe('validation errors', () => {
    it('throws RcmlValidationError for bullet lists', () => {
      expect(() => emailInlineRfmToJson('- item')).toThrow(RcmlValidationError)
    })

    it('throws RcmlValidationError for ordered lists', () => {
      expect(() => emailInlineRfmToJson('1. item')).toThrow(RcmlValidationError)
    })

    it('throws RcmlValidationError for :::align', () => {
      expect(() => emailInlineRfmToJson(':::align{value="center"}\ntext\n:::')).toThrow(RcmlValidationError)
    })

    it('throws RcmlValidationError for headings', () => {
      expect(() => emailInlineRfmToJson('# Heading')).toThrow(RcmlValidationError)
    })

    it('error exposes structured errors array', () => {
      try {
        emailInlineRfmToJson('- item')
      } catch (err) {
        expect(err).toBeInstanceOf(RcmlValidationError)

        if (err instanceof RcmlValidationError) {
          expect(err.errors[0]).toHaveProperty('message')
          expect(err.errors[0]).toHaveProperty('path')
        }
      }
    })
  })
})
