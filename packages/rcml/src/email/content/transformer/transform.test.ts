import { describe, it, expect } from 'vitest'
import type { Root, RootContent } from 'mdast'
import { parseEmailRfm, parseEmailInlineRfm } from '../parser/parse.js'
import { ATOM_TOKEN_DELIMITER, ATOM_TOKEN_SEPARATOR } from '../parser/preprocess.js'
import { transform } from './transform.js'
import type { IrDoc, IrParagraph, IrFont, IrLink, IrBulletList, IrOrderedList, IrAlign, IrPlaceholder, IrLoopValue } from './types.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rfm(input: string): IrDoc {
  const { ast } = parseEmailRfm(input, { position: false })

  return transform(ast)
}

function inlineRfm(input: string): IrDoc {
  const { ast } = parseEmailInlineRfm(input, { position: false })

  return transform(ast)
}

// ─── Document shape ───────────────────────────────────────────────────────────

describe('transform() — document root', () => {
  it('returns a doc node with children array', () => {
    const ir = rfm('Hello')

    expect(ir.type).toBe('doc')
    expect(Array.isArray(ir.children)).toBe(true)
  })

  it('empty-like input produces one paragraph', () => {
    const ir = rfm('Hello')

    expect(ir.children).toHaveLength(1)
    expect(ir.children[0]!.type).toBe('paragraph')
  })

  it('multiple paragraphs produce multiple block children', () => {
    const ir = rfm('First\n\nSecond\n\nThird')

    expect(ir.children).toHaveLength(3)
    expect(ir.children.every((b) => b.type === 'paragraph')).toBe(true)
  })
})

// ─── Paragraph + text ─────────────────────────────────────────────────────────

describe('transform() — paragraph', () => {
  it('plain text becomes IrText inside IrParagraph', () => {
    const ir = rfm('Hello world')
    const para = ir.children[0] as IrParagraph

    expect(para.type).toBe('paragraph')
    expect(para.children[0]).toEqual({ type: 'text', value: 'Hello world' })
  })

  it('preserves text value verbatim', () => {
    const ir = rfm('Héllo wörld 123 !@#')
    const para = ir.children[0] as IrParagraph

    expect((para.children[0] as { value: string }).value).toBe('Héllo wörld 123 !@#')
  })
})

// ─── :font directive ──────────────────────────────────────────────────────────

describe('transform() — :font', () => {
  it('converts :font to IrFont with camelCase attrs', () => {
    const ir = rfm(':font[bold text]{font-weight="bold"}')
    const para = ir.children[0] as IrParagraph
    const font = para.children[0] as IrFont

    expect(font.type).toBe('font')
    expect(font.attrs.fontWeight).toBe('bold')
    expect(font.children[0]).toEqual({ type: 'text', value: 'bold text' })
  })

  it('maps font-family', () => {
    const ir = rfm(':font[text]{font-family="Arial"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.fontFamily).toBe('Arial')
  })

  it('maps font-size', () => {
    const ir = rfm(':font[text]{font-size="16px"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.fontSize).toBe('16px')
  })

  it('maps line-height', () => {
    const ir = rfm(':font[text]{line-height="1.5"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.lineHeight).toBe('1.5')
  })

  it('maps letter-spacing', () => {
    const ir = rfm(':font[text]{letter-spacing="0.1em"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.letterSpacing).toBe('0.1em')
  })

  it('maps font-style', () => {
    const ir = rfm(':font[text]{font-style="italic"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.fontStyle).toBe('italic')
  })

  it('maps text-decoration underline', () => {
    const ir = rfm(':font[text]{text-decoration="underline"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.textDecoration).toBe('underline')
  })

  it('maps text-decoration line-through', () => {
    const ir = rfm(":font[text]{text-decoration='line-through'}")
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.textDecoration).toBe('line-through')
  })

  it('maps color', () => {
    const ir = rfm(':font[text]{color="#ff0000"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs.color).toBe('#ff0000')
  })

  it('maps multiple attrs at once', () => {
    const ir = rfm(':font[text]{font-weight="bold" font-size="18px" color="red"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(font.attrs).toMatchObject({ fontWeight: 'bold', fontSize: '18px', color: 'red' })
  })

  it('only includes present attrs (no undefined keys)', () => {
    const ir = rfm(':font[text]{font-weight="bold"}')
    const font = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(Object.keys(font.attrs)).toEqual(['fontWeight'])
  })
})

// ─── :link directive ──────────────────────────────────────────────────────────

describe('transform() — :link', () => {
  it('converts :link to IrLink with href and children', () => {
    const ir = rfm(':link[click here]{href="https://example.com"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.type).toBe('link')
    expect(link.href).toBe('https://example.com')
    expect(link.children[0]).toEqual({ type: 'text', value: 'click here' })
  })

  it('sets target when _blank is specified', () => {
    const ir = rfm(':link[text]{href="https://x.com" target="_blank"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.target).toBe('_blank')
  })

  it('does not set target when not specified', () => {
    const ir = rfm(':link[text]{href="https://x.com"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.target).toBeUndefined()
  })

  it('sets noTracked=true when no-tracked="true"', () => {
    const ir = rfm(':link[text]{href="https://x.com" no-tracked="true"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.noTracked).toBe(true)
  })

  it('sets noTracked=false when no-tracked="false"', () => {
    const ir = rfm(':link[text]{href="https://x.com" no-tracked="false"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.noTracked).toBe(false)
  })

  it('does not set noTracked when omitted', () => {
    const ir = rfm(':link[text]{href="https://x.com"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.noTracked).toBeUndefined()
  })

  it(':link wrapping :font — nested font inside link', () => {
    const ir = rfm(':link[:font[bold]{font-weight="bold"}]{href="https://x.com"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.type).toBe('link')
    expect(link.children[0]!.type).toBe('font')
    expect((link.children[0] as IrFont).attrs.fontWeight).toBe('bold')
  })

  it(':link with all options combined', () => {
    const ir = rfm(':link[go]{href="https://x.com" target="_blank" no-tracked="true"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.href).toBe('https://x.com')
    expect(link.target).toBe('_blank')
    expect(link.noTracked).toBe(true)
  })
})

// ─── Mixed inline content ─────────────────────────────────────────────────────

describe('transform() — mixed inline', () => {
  it('text + :font + text in a paragraph', () => {
    const ir = rfm('Hello :font[world]{font-weight="bold"} again')
    const para = ir.children[0] as IrParagraph

    expect(para.children).toHaveLength(3)
    expect(para.children[0]).toEqual({ type: 'text', value: 'Hello ' })
    expect(para.children[1]!.type).toBe('font')
    expect(para.children[2]).toEqual({ type: 'text', value: ' again' })
  })

  it(':font wrapping :font (nested styled spans)', () => {
    const ir = rfm(':font[:font[text]{color="red"}]{font-weight="bold"}')
    const outer = (ir.children[0] as IrParagraph).children[0] as IrFont

    expect(outer.type).toBe('font')
    expect(outer.attrs.fontWeight).toBe('bold')
    const inner = outer.children[0] as IrFont

    expect(inner.type).toBe('font')
    expect(inner.attrs.color).toBe('red')
  })

  it(':link with mixed text and :font children', () => {
    const ir = rfm(':link[Hi :font[there]{font-style="italic"}]{href="https://x.com"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.children).toHaveLength(2)
    expect(link.children[0]).toEqual({ type: 'text', value: 'Hi ' })
    expect(link.children[1]!.type).toBe('font')
  })
})

// ─── Lists ────────────────────────────────────────────────────────────────────

describe('transform() — bullet list', () => {
  it('produces IrBulletList with IrListItem children', () => {
    const ir = rfm('- item one\n- item two')
    const list = ir.children[0] as IrBulletList

    expect(list.type).toBe('bulletList')
    expect(list.children).toHaveLength(2)
    expect(list.children[0]!.type).toBe('listItem')
    expect(list.children[1]!.type).toBe('listItem')
  })

  it('list item children contain IrParagraph', () => {
    const ir = rfm('- hello')
    const list = ir.children[0] as IrBulletList
    const item = list.children[0]!

    expect(item.children[0]!.type).toBe('paragraph')
    const para = item.children[0] as IrParagraph

    expect(para.children[0]).toEqual({ type: 'text', value: 'hello' })
  })

  it('list item with :font inside', () => {
    const ir = rfm('- :font[bold]{font-weight="bold"}')
    const list = ir.children[0] as IrBulletList
    const para = list.children[0]!.children[0] as IrParagraph

    expect(para.children[0]!.type).toBe('font')
  })
})

describe('transform() — ordered list', () => {
  it('produces IrOrderedList', () => {
    const ir = rfm('1. first\n2. second')
    const list = ir.children[0] as IrOrderedList

    expect(list.type).toBe('orderedList')
    expect(list.children).toHaveLength(2)
  })

  it('ordered list item has paragraph child', () => {
    const ir = rfm('1. step one')
    const list = ir.children[0] as IrOrderedList
    const para = list.children[0]!.children[0] as IrParagraph

    expect(para.children[0]).toEqual({ type: 'text', value: 'step one' })
  })
})

describe('transform() — nested lists', () => {
  it('nested bullet list produces nested IrBulletList', () => {
    const ir = rfm('- parent\n  - child')
    const outer = ir.children[0] as IrBulletList
    const outerItem = outer.children[0]!

    // listItem may contain [paragraph, bulletList]
    const nested = outerItem.children.find((c) => c.type === 'bulletList') as IrBulletList

    expect(nested).toBeDefined()
    expect(nested.type).toBe('bulletList')
  })
})

// ─── :::align ─────────────────────────────────────────────────────────────────

describe('transform() — :::align', () => {
  it('produces IrAlign with correct value', () => {
    const ir = rfm(':::align{value="center"}\nHello\n:::')
    const align = ir.children[0] as IrAlign

    expect(align.type).toBe('align')
    expect(align.value).toBe('center')
  })

  it('align children contain the inner blocks', () => {
    const ir = rfm(':::align{value="right"}\nText\n:::')
    const align = ir.children[0] as IrAlign

    expect(align.children[0]!.type).toBe('paragraph')
  })

  it('supports left, center, right values', () => {
    const values = ['left', 'center', 'right'] as const

    for (const value of values) {
      const ir = rfm(`:::align{value="${value}"}\nHi\n:::`)
      const align = ir.children[0] as IrAlign

      expect(align.value).toBe(value)
    }
  })
})

// ─── ::placeholder ────────────────────────────────────────────────────────────

describe('transform() — ::placeholder', () => {
  it('produces IrPlaceholder with typed attrs', () => {
    const ir = rfm('::placeholder{type="CustomField" value="val" name="myField" original="orig"}')
    const ph = ir.children[0] as IrPlaceholder

    expect(ph.type).toBe('placeholder')
    expect(ph.attrs.type).toBe('CustomField')
    expect(ph.attrs.value).toBe('val')
    expect(ph.attrs.name).toBe('myField')
    expect(ph.attrs.original).toBe('orig')
  })

  it('includes maxLength when max-length is set', () => {
    const ir = rfm('::placeholder{type="CustomField" value="v" name="n" original="o" max-length="255"}')
    const ph = ir.children[0] as IrPlaceholder

    expect(ph.attrs.maxLength).toBe('255')
  })

  it('omits maxLength when max-length is absent', () => {
    const ir = rfm('::placeholder{type="Subscriber" value="v" name="n" original="o"}')
    const ph = ir.children[0] as IrPlaceholder

    expect(ph.attrs.maxLength).toBeUndefined()
  })

  it('supports all placeholder types', () => {
    const types = ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date'] as const

    for (const t of types) {
      const ir = rfm(`::placeholder{type="${t}" value="v" name="n" original="o"}`)
      const ph = ir.children[0] as IrPlaceholder

      expect(ph.attrs.type).toBe(t)
    }
  })
})

// ─── ::loop-value ─────────────────────────────────────────────────────────────

describe('transform() — ::loop-value', () => {
  it('produces IrLoopValue with original, value, index', () => {
    const ir = rfm('::loop-value{original="orig" value="val" index="0"}')
    const lv = ir.children[0] as IrLoopValue

    expect(lv.type).toBe('loopValue')
    expect(lv.original).toBe('orig')
    expect(lv.value).toBe('val')
    expect(lv.index).toBe('0')
  })

  it('has empty children (leaf directive has no content)', () => {
    const ir = rfm('::loop-value{original="o" value="v" index="1"}')
    const lv = ir.children[0] as IrLoopValue

    expect(lv.children).toEqual([])
  })
})

// ─── Inline RFM ───────────────────────────────────────────────────────────────

describe('transform() — Inline RFM', () => {
  it('inlineRfm paragraph with :font', () => {
    const ir = inlineRfm(':font[text]{font-weight="bold"}')

    expect(ir.type).toBe('doc')
    expect((ir.children[0] as IrParagraph).children[0]!.type).toBe('font')
  })

  it('inlineRfm paragraph with :link', () => {
    const ir = inlineRfm(':link[click]{href="https://x.com"}')
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.type).toBe('link')
    expect(link.href).toBe('https://x.com')
  })

  it('inlineRfm ::placeholder produces IrPlaceholder', () => {
    const ir = inlineRfm('::placeholder{type="Date" value="v" name="n" original="o"}')

    expect(ir.children[0]!.type).toBe('placeholder')
  })
})

// ─── Error cases ──────────────────────────────────────────────────────────────

describe('transform() — error handling', () => {
  it('throws for unknown block node type', () => {
    const fakeAst: Root = {
      type: 'root',
      children: [{ type: 'heading', depth: 1, children: [] } as unknown as RootContent],
    }

    expect(() => transform(fakeAst)).toThrow(/Unexpected block node type "heading"/)
  })

  it('throws for unknown container directive', () => {
    const fakeAst: Root = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'unknown',
          attributes: {},
          children: [],
        } as unknown as RootContent,
      ],
    }

    expect(() => transform(fakeAst)).toThrow(/Unknown container directive ":::unknown"/)
  })

  it('throws for unknown text directive', () => {
    const fakeAst: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'textDirective',
              name: 'unknown',
              attributes: {},
              children: [],
            },
          ],
        } as unknown as RootContent,
      ],
    }

    expect(() => transform(fakeAst)).toThrow(/Unknown text directive ":unknown"/)
  })

  it('throws for unknown inline node type', () => {
    const fakeAst: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'strong', children: [] }],
        } as unknown as RootContent,
      ],
    }

    expect(() => transform(fakeAst)).toThrow(/Unexpected inline node type "strong"/)
  })

  it('throws for unknown leaf directive name', () => {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'leafDirective',
          name: 'unknown-leaf',
          attributes: {},
          children: [],
        } as unknown as RootContent,
      ],
    }

    expect(() => transform(ast)).toThrow(/Unknown leaf directive "::unknown-leaf"/)
  })

  it('break node transforms to hardBreak', () => {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            { type: 'text', value: 'line1' },
            { type: 'break' },
            { type: 'text', value: 'line2' },
          ],
        } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const para = ir.children[0] as IrParagraph

    expect(para.children[1]?.type).toBe('hardBreak')
  })
})

// ─── Container directive variants (direct MDAST) ──────────────────────────────

describe('transform() — :::placeholder as container directive', () => {
  it('produces IrPlaceholder from container directive', () => {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'placeholder',
          attributes: { type: 'Date', value: 'v', name: 'n', original: 'o' },
          children: [],
        } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)

    expect(ir.children[0]?.type).toBe('placeholder')
  })
})

describe('transform() — :::loop-value as container directive', () => {
  it('produces IrLoopValue from container directive', () => {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'loop-value',
          attributes: { original: 'o', value: 'v', index: '0' },
          children: [],
        } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)

    expect(ir.children[0]?.type).toBe('loopValue')
  })
})

// ─── transformAlign default value ─────────────────────────────────────────────

describe('transform() — transformAlign default value', () => {
  it('defaults align value to "left" when value attribute is absent', () => {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'containerDirective',
          name: 'align',
          attributes: {},
          children: [],
        } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const align = ir.children[0] as IrAlign

    expect(align.value).toBe('left')
  })
})

// ─── expandTokenizedText empty segment ────────────────────────────────────────

describe('transform() — expandTokenizedText empty segment', () => {
  it('atom at end of text produces no trailing IrText node', () => {
    const ir = rfm('before ::placeholder{type="Subscriber" value="v" name="n" original="o"}')
    const para = ir.children[0] as IrParagraph

    expect(para.children).toHaveLength(2)
    expect(para.children[0]).toEqual({ type: 'text', value: 'before ' })
    expect(para.children[1]?.type).toBe('placeholder')
  })
})

// ─── transformAtomToken inline cases ──────────────────────────────────────────

describe('transform() — inline ::placeholder via PUA token', () => {
  it('produces IrPlaceholder inside paragraph', () => {
    const ir = rfm('text ::placeholder{type="Date" value="v" name="n" original="o"} more')
    const para = ir.children[0] as IrParagraph
    const ph = para.children.find((c) => c.type === 'placeholder') as IrPlaceholder

    expect(ph).toBeDefined()
    expect(ph.attrs.type).toBe('Date')
    expect(ph.attrs.name).toBe('n')
  })
})

describe('transform() — inline ::loop-value via PUA token', () => {
  it('produces IrLoopValue inside paragraph', () => {
    const ir = rfm('text ::loop-value{original="o" value="v" index="1"} more')
    const para = ir.children[0] as IrParagraph
    const lv = para.children.find((c) => c.type === 'loopValue') as IrLoopValue

    expect(lv).toBeDefined()
    expect(lv.original).toBe('o')
    expect(lv.value).toBe('v')
  })
})

describe('transform() — transformAtomToken unknown name', () => {
  it('throws for an unknown inline atom token name', () => {
    const token = `${ATOM_TOKEN_DELIMITER}unknown${ATOM_TOKEN_SEPARATOR}${ATOM_TOKEN_DELIMITER}`
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: token }],
        } as unknown as RootContent,
      ],
    }

    expect(() => transform(ast)).toThrow(/Unknown inline atom token name "unknown"/)
  })
})

// ─── parseTokenAttrs unquoted value ───────────────────────────────────────────

describe('transform() — parseTokenAttrs unquoted attribute value', () => {
  it('parses unquoted attribute value in PUA token', () => {
    const token = `${ATOM_TOKEN_DELIMITER}loop-value${ATOM_TOKEN_SEPARATOR}original=o value=v index=0${ATOM_TOKEN_DELIMITER}`
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'text', value: token }],
        } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const para = ir.children[0] as IrParagraph
    const lv = para.children[0] as IrLoopValue

    expect(lv.type).toBe('loopValue')
    expect(lv.value).toBe('v')
  })
})

// ─── coerceAttrValue branches ─────────────────────────────────────────────────

describe('transform() — coerceAttrValue', () => {
  it('coerces missing placeholder value attr to null', () => {
    const ir = rfm('::placeholder{type="Subscriber" name="n" original="o"}')
    const ph = ir.children[0] as IrPlaceholder

    expect(ph.attrs.value).toBeNull()
  })

  it('coerces numeric string placeholder value attr to number', () => {
    const ir = rfm('::placeholder{type="Subscriber" value="11" name="n" original="o"}')
    const ph = ir.children[0] as IrPlaceholder

    expect(ph.attrs.value).toBe(11)
  })
})

// ─── null attributes fallbacks (node.attributes ?? {} and raw[key] ?? '') ─────

describe('transform() — null attributes on leaf directives', () => {
  it('leaf ::loop-value with null attributes uses fallback empty strings', () => {
    const ast: Root = {
      type: 'root',
      children: [
        { type: 'leafDirective', name: 'loop-value', attributes: null, children: [] } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const lv = ir.children[0] as IrLoopValue

    expect(lv.original).toBe('')
    expect(lv.value).toBe('')
    expect(lv.index).toBe('')
  })
})

describe('transform() — null attributes on container directives', () => {
  it(':::placeholder with null attributes uses fallback empty strings', () => {
    const ast: Root = {
      type: 'root',
      children: [
        { type: 'containerDirective', name: 'placeholder', attributes: null, children: [] } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const ph = ir.children[0] as IrPlaceholder

    expect(ph.attrs.name).toBe('')
    expect(ph.attrs.original).toBe('')
  })

  it(':::loop-value with null attributes uses fallback empty strings', () => {
    const ast: Root = {
      type: 'root',
      children: [
        { type: 'containerDirective', name: 'loop-value', attributes: null, children: [] } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const lv = ir.children[0] as IrLoopValue

    expect(lv.original).toBe('')
    expect(lv.value).toBe('')
    expect(lv.index).toBe('')
  })

})

describe('transform() — null attributes on text directives', () => {
  it(':font with null attributes produces IrFont with no attrs', () => {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'textDirective', name: 'font', attributes: null, children: [] }],
        } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const para = ir.children[0] as IrParagraph

    expect(para.children[0]?.type).toBe('font')
  })

  it(':link with null attributes falls back to empty href', () => {
    const ast: Root = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [{ type: 'textDirective', name: 'link', attributes: null, children: [] }],
        } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const link = (ir.children[0] as IrParagraph).children[0] as IrLink

    expect(link.href).toBe('')
  })
})

// ─── expandTokenizedText — sepIdx < 0 (token without separator) ───────────────

describe('transform() — PUA token without separator', () => {
  it('loop-value token with separator but empty attrs uses fallback empty strings', () => {
    // DELIM + name + SEP + DELIM (SEP present but no attrs after it) → empty raw map
    const token = `${ATOM_TOKEN_DELIMITER}loop-value${ATOM_TOKEN_SEPARATOR}${ATOM_TOKEN_DELIMITER}`
    const ast: Root = {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', value: token }] } as unknown as RootContent,
      ],
    }
    const ir = transform(ast)
    const lv = (ir.children[0] as IrParagraph).children[0] as IrLoopValue

    expect(lv.type).toBe('loopValue')
    expect(lv.original).toBe('')
    expect(lv.value).toBe('')
    expect(lv.index).toBe('')
  })
})
