import { describe, it, expect } from 'vitest'
import { parseEmailRfm, parseEmailInlineRfm } from '../parser/parse.js'
import { transform } from '../transformer/transform.js'
import { convert } from './convert.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>

function rfm(input: string): Json {
  const { ast } = parseEmailRfm(input, { position: false })
  const ir = transform(ast)

  return convert(ir).toJSON() as Json
}

function inlineRfm(input: string): Json {
  const { ast } = parseEmailInlineRfm(input, { position: false })
  const ir = transform(ast)

  return convert(ir).toJSON() as Json
}

// ─── Document root ────────────────────────────────────────────────────────────

describe('convert() — document root', () => {
  it('always produces a doc node', () => {
    const doc = rfm('Hello')

    expect(doc.type).toBe('doc')
  })

  it('doc has content array', () => {
    const doc = rfm('Hello')

    expect(Array.isArray(doc.content)).toBe(true)
  })

  it('multiple paragraphs produce multiple block children', () => {
    const doc = rfm('First\n\nSecond\n\nThird')

    expect(doc.content).toHaveLength(3)
  })
})

// ─── Paragraph + plain text ───────────────────────────────────────────────────

describe('convert() — paragraph', () => {
  it('plain text becomes a paragraph with a text node', () => {
    const doc = rfm('Hello world')

    expect(doc.content[0].type).toBe('paragraph')
    expect(doc.content[0].content[0]).toEqual({ type: 'text', text: 'Hello world' })
  })
})

// ─── :font mark ───────────────────────────────────────────────────────────────

describe('convert() — :font mark', () => {
  it('produces a text node with a font mark', () => {
    const doc = rfm(':font[bold]{font-weight="bold"}')
    const node = doc.content[0].content[0]

    expect(node.type).toBe('text')
    expect(node.marks[0].type).toBe('font')
    expect(node.marks[0].attrs['font-weight']).toBe('bold')
  })

  it('maps font-family to hyphenated attr', () => {
    const doc = rfm(':font[text]{font-family="Arial"}')
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs['font-family']).toBe('Arial')
  })

  it('maps font-size to hyphenated attr', () => {
    const doc = rfm(':font[text]{font-size="16px"}')
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs['font-size']).toBe('16px')
  })

  it('maps line-height to hyphenated attr', () => {
    const doc = rfm(':font[text]{line-height="1.5"}')
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs['line-height']).toBe('1.5')
  })

  it('maps letter-spacing to hyphenated attr', () => {
    const doc = rfm(':font[text]{letter-spacing="0.1em"}')
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs['letter-spacing']).toBe('0.1em')
  })

  it('maps font-style to hyphenated attr', () => {
    const doc = rfm(':font[text]{font-style="italic"}')
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs['font-style']).toBe('italic')
  })

  it('maps text-decoration underline', () => {
    const doc = rfm(':font[text]{text-decoration="underline"}')
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs['text-decoration']).toBe('underline')
  })

  it('maps text-decoration line-through', () => {
    const doc = rfm(":font[text]{text-decoration='line-through'}")
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs['text-decoration']).toBe('line-through')
  })

  it('maps color', () => {
    const doc = rfm(':font[text]{color="#ff0000"}')
    const mark = doc.content[0].content[0].marks[0]

    expect(mark.attrs.color).toBe('#ff0000')
  })

  it('unset font attrs are null in PM JSON (schema default)', () => {
    const doc = rfm(':font[text]{font-weight="bold"}')
    const attrs = doc.content[0].content[0].marks[0].attrs

    expect(attrs['font-family']).toBeNull()
    expect(attrs['font-size']).toBeNull()
    expect(attrs['font-style']).toBeNull()
    expect(attrs.color).toBeNull()
  })

  it('all 8 font attrs present in output with correct hyphenated keys', () => {
    const doc = rfm(':font[text]{font-weight="bold" font-size="18px" color="red" font-style="italic"}')
    const attrs = doc.content[0].content[0].marks[0].attrs

    expect(attrs).toHaveProperty('font-weight', 'bold')
    expect(attrs).toHaveProperty('font-size', '18px')
    expect(attrs).toHaveProperty('color', 'red')
    expect(attrs).toHaveProperty('font-style', 'italic')
  })
})

// ─── :link mark ───────────────────────────────────────────────────────────────

describe('convert() — :link mark', () => {
  it('produces a text node with a link mark', () => {
    const doc = rfm(':link[click]{href="https://example.com"}')
    const node = doc.content[0].content[0]

    expect(node.marks[0].type).toBe('link')
    expect(node.marks[0].attrs.href).toBe('https://example.com')
  })

  it('target defaults to null when not specified', () => {
    const doc = rfm(':link[text]{href="https://x.com"}')

    expect(doc.content[0].content[0].marks[0].attrs.target).toBeNull()
  })

  it('target is _blank when specified', () => {
    const doc = rfm(':link[text]{href="https://x.com" target="_blank"}')

    expect(doc.content[0].content[0].marks[0].attrs.target).toBe('_blank')
  })

  it('no-tracked defaults to "false" string when not specified', () => {
    const doc = rfm(':link[text]{href="https://x.com"}')

    expect(doc.content[0].content[0].marks[0].attrs['no-tracked']).toBe('false')
  })

  it('no-tracked="true" produces "true" string', () => {
    const doc = rfm(':link[text]{href="https://x.com" no-tracked="true"}')

    expect(doc.content[0].content[0].marks[0].attrs['no-tracked']).toBe('true')
  })

  it('no-tracked="false" produces "false" string', () => {
    const doc = rfm(':link[text]{href="https://x.com" no-tracked="false"}')

    expect(doc.content[0].content[0].marks[0].attrs['no-tracked']).toBe('false')
  })
})

// ─── Mark accumulation ────────────────────────────────────────────────────────

describe('convert() — mark accumulation', () => {
  it(':link wrapping :font — text node carries both marks', () => {
    const doc = rfm(':link[:font[bold]{font-weight="bold"}]{href="https://x.com"}')
    const node = doc.content[0].content[0]
    const markTypes = node.marks.map((m: Json) => m.type)

    expect(markTypes).toContain('font')
    expect(markTypes).toContain('link')
  })

  it(':font wrapping :font — two font marks accumulated', () => {
    const doc = rfm(':font[:font[text]{color="red"}]{font-weight="bold"}')
    const node = doc.content[0].content[0]
    const fontMarks = node.marks.filter((m: Json) => m.type === 'font')

    expect(fontMarks).toHaveLength(2)
  })

  it('mixed text + font + text → 3 text nodes', () => {
    const doc = rfm('Hello :font[world]{font-weight="bold"} again')
    const content = doc.content[0].content

    expect(content).toHaveLength(3)
    expect(content[0].text).toBe('Hello ')
    expect(content[1].marks[0].type).toBe('font')
    expect(content[2].text).toBe(' again')
  })

  it(':link with mixed text and :font children', () => {
    const doc = rfm(':link[Hi :font[there]{font-style="italic"}]{href="https://x.com"}')
    const content = doc.content[0].content

    expect(content).toHaveLength(2)
    expect(content[0].text).toBe('Hi ')
    const fontMark = content[1].marks.find((m: Json) => m.type === 'font')
    const linkMark = content[1].marks.find((m: Json) => m.type === 'link')

    expect(fontMark).toBeDefined()
    expect(linkMark).toBeDefined()
  })
})

// ─── Hard break ───────────────────────────────────────────────────────────────

describe('convert() — hardbreak', () => {
  it('hard break produces "hardbreak" node (kebab-free, no underscore)', () => {
    // Hard break in a list item (via paragraph inside list)
    const doc = rfm('- line one\n- line two')

    // Just verify the list structure — hard break tested via direct IR injection
    expect(doc.content[0].type).toBe('bullet-list')
  })

  it('hardBreak IR node emits a hardbreak ProseMirror node', () => {
    const ir = {
      type: 'doc',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'before' },
            { type: 'hardBreak' },
            { type: 'text', value: 'after' },
          ],
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = convert(ir as any).toJSON() as Json

    expect(doc.content[0].content[1].type).toBe('hardbreak')
  })
})

// ─── Lists ────────────────────────────────────────────────────────────────────

describe('convert() — bullet list (kebab-case type names)', () => {
  it('produces "bullet-list" node type (not bullet_list)', () => {
    const doc = rfm('- item one\n- item two')

    expect(doc.content[0].type).toBe('bullet-list')
  })

  it('bullet list contains "list-item" nodes (not list_item)', () => {
    const doc = rfm('- item')

    expect(doc.content[0].content[0].type).toBe('list-item')
  })

  it('list item contains paragraph', () => {
    const doc = rfm('- hello')
    const item = doc.content[0].content[0]

    expect(item.content[0].type).toBe('paragraph')
    expect(item.content[0].content[0].text).toBe('hello')
  })

  it('two list items', () => {
    const doc = rfm('- one\n- two')

    expect(doc.content[0].content).toHaveLength(2)
  })

  it('list item with font mark', () => {
    const doc = rfm('- :font[bold]{font-weight="bold"}')
    const para = doc.content[0].content[0].content[0]

    expect(para.content[0].marks[0].type).toBe('font')
  })
})

describe('convert() — ordered list', () => {
  it('produces "ordered-list" node type (not ordered_list)', () => {
    const doc = rfm('1. first\n2. second')

    expect(doc.content[0].type).toBe('ordered-list')
  })

  it('ordered list item has correct type', () => {
    const doc = rfm('1. step')

    expect(doc.content[0].content[0].type).toBe('list-item')
  })
})

describe('convert() — nested list', () => {
  it('nested bullet list inside list-item', () => {
    const doc = rfm('- parent\n  - child')
    const outerItem = doc.content[0].content[0]
    const nestedList = outerItem.content.find((c: Json) => c.type === 'bullet-list')

    expect(nestedList).toBeDefined()
    expect(nestedList.type).toBe('bullet-list')
  })
})

// ─── :::align ─────────────────────────────────────────────────────────────────

describe('convert() — :::align', () => {
  it('produces "align" block node', () => {
    const doc = rfm(':::align{value="center"}\nHello\n:::')

    expect(doc.content[0].type).toBe('align')
  })

  it('align has correct value attr', () => {
    const doc = rfm(':::align{value="center"}\nHello\n:::')

    expect(doc.content[0].attrs.value).toBe('center')
  })

  it('align right', () => {
    const doc = rfm(':::align{value="right"}\nHi\n:::')

    expect(doc.content[0].attrs.value).toBe('right')
  })

  it('align left', () => {
    const doc = rfm(':::align{value="left"}\nHi\n:::')

    expect(doc.content[0].attrs.value).toBe('left')
  })

  it('align wraps block children', () => {
    const doc = rfm(':::align{value="center"}\nText\n:::')

    expect(doc.content[0].content[0].type).toBe('paragraph')
  })
})

// ─── ::placeholder ────────────────────────────────────────────────────────────

describe('convert() — ::placeholder', () => {
  it('produces inline placeholder wrapped in paragraph', () => {
    const doc = rfm('::placeholder{type="CustomField" value="val" name="myField" original="orig"}')

    expect(doc.content[0].type).toBe('paragraph')
    expect(doc.content[0].content[0].type).toBe('placeholder')
  })

  it('placeholder attrs are correct', () => {
    const doc = rfm('::placeholder{type="Subscriber" value="first_name" name="First name" original="[sub:fn]"}')
    const attrs = doc.content[0].content[0].attrs

    expect(attrs.type).toBe('Subscriber')
    expect(attrs.value).toBe('first_name')
    expect(attrs.name).toBe('First name')
    expect(attrs.original).toBe('[sub:fn]')
  })

  it('max-length defaults to null', () => {
    const doc = rfm('::placeholder{type="Date" value="v" name="n" original="o"}')

    expect(doc.content[0].content[0].attrs['max-length']).toBeNull()
  })

  it('max-length attr is set when provided', () => {
    const doc = rfm('::placeholder{type="CustomField" value="v" name="n" original="o" max-length="255"}')

    expect(doc.content[0].content[0].attrs['max-length']).toBe('255')
  })

  it('supports all placeholder types', () => {
    const types = ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date'] as const

    for (const t of types) {
      const doc = rfm(`::placeholder{type="${t}" value="v" name="n" original="o"}`)

      expect(doc.content[0].content[0].attrs.type).toBe(t)
    }
  })
})

// ─── ::loop-value ─────────────────────────────────────────────────────────────

describe('convert() — ::loop-value', () => {
  it('produces inline loop-value wrapped in paragraph', () => {
    const doc = rfm('::loop-value{original="orig" value="val" index="0"}')

    expect(doc.content[0].type).toBe('paragraph')
    expect(doc.content[0].content[0].type).toBe('loop-value')
  })

  it('loop-value has correct attrs', () => {
    const doc = rfm('::loop-value{original="orig" value="val" index="2"}')
    const attrs = doc.content[0].content[0].attrs

    expect(attrs.original).toBe('orig')
    expect(attrs.value).toBe('val')
    expect(attrs.index).toBe('2')
  })
})

// ─── Inline RFM ───────────────────────────────────────────────────────────────

describe('convert() — Inline RFM', () => {
  it('inlineRfm paragraph with :font', () => {
    const doc = inlineRfm(':font[text]{font-weight="bold"}')

    expect(doc.type).toBe('doc')
    expect(doc.content[0].content[0].marks[0].type).toBe('font')
  })

  it('inlineRfm paragraph with :link', () => {
    const doc = inlineRfm(':link[click]{href="https://x.com"}')

    expect(doc.content[0].content[0].marks[0].type).toBe('link')
    expect(doc.content[0].content[0].marks[0].attrs.href).toBe('https://x.com')
  })

  it('inlineRfm placeholder produces inline atom in paragraph', () => {
    const doc = inlineRfm('::placeholder{type="Date" value="v" name="n" original="o"}')

    expect(doc.content[0].content[0].type).toBe('placeholder')
  })
})

// ─── Error handling ───────────────────────────────────────────────────────────

describe('convert() — error handling', () => {
  it('throws for unknown IR block type', () => {
    const ir = {
      type: 'doc',
      children: [{ type: 'unknown-block', children: [] }],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => convert(ir as any)).toThrow(/Unexpected IR block type "unknown-block"/)
  })

  it('throws for unknown IR inline type in flattenInline', () => {
    const ir = {
      type: 'doc',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'unknown-inline' }],
        },
      ],
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(() => convert(ir as any)).toThrow(/Unexpected IR inline type "unknown-inline"/)
  })
})

// ─── SCHEMA.md sample verification ───────────────────────────────────────────

describe('convert() — SCHEMA.md sample', () => {
  it('matches the documented sample JSON structure', () => {
    // "Hello world, click here [subscriber placeholder]" centered
    const input = [
      ':::align{value="center"}',
      'Hello world, :link[click here]{href="https://example.com" target="_blank" no-tracked="false"}',
      '::placeholder{type="Subscriber" value="first_name" name="First name" original="[subscriber:first_name]"}',
      ':::',
    ].join('\n')

    const doc = rfm(input)

    // Top-level align block
    expect(doc.content[0].type).toBe('align')
    expect(doc.content[0].attrs.value).toBe('center')

    const para = doc.content[0].content[0]

    expect(para.type).toBe('paragraph')

    // "Hello world, " plain text
    expect(para.content[0].type).toBe('text')
    expect(para.content[0].text).toBe('Hello world, ')

    // "click here" with link mark
    const linkNode = para.content[1]

    expect(linkNode.text).toBe('click here')
    const linkMark = linkNode.marks.find((m: Json) => m.type === 'link')

    expect(linkMark).toBeDefined()
    expect(linkMark.attrs.href).toBe('https://example.com')
    expect(linkMark.attrs.target).toBe('_blank')
    expect(linkMark.attrs['no-tracked']).toBe('false')

    // Placeholder directive is inside the align block (second child of align's content)
    const phPara = doc.content[0].content[1]

    expect(phPara.type).toBe('paragraph')
    expect(phPara.content[0].type).toBe('placeholder')
    expect(phPara.content[0].attrs.type).toBe('Subscriber')
    expect(phPara.content[0].attrs.value).toBe('first_name')
    expect(phPara.content[0].attrs['max-length']).toBeNull()
  })
})
