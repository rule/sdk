/* eslint-disable @typescript-eslint/no-unnecessary-condition */
import { describe, it, expect } from 'vitest'
import { parse, parseEmailRfm, parseEmailInlineRfm, RcmlValidationError } from './parse.js'

const rfmFullInput = `:::align{value="center"}

A :font[bold]{font-weight="bold"} paragraph.

:::

- First item
- Second item

1. Step one
2. Step two`

describe('parse()', () => {
  describe('basic output shape', () => {
    it('returns a Root node for empty input', () => {
      const { ast } = parse('')

      expect(ast.type).toBe('root')
      expect(ast.children).toHaveLength(0)
    })

    it('returns a VFile with the original input value', () => {
      const input = 'Hello world.'
      const { file } = parse(input)

      expect(String(file)).toBe(input)
    })

    it('includes position info by default', () => {
      const { ast } = parse('Hello.')

      expect(ast.position).toBeDefined()
    })

    it('strips positions when position=false', () => {
      const { ast } = parse('Hello.', { position: false })

      expect(ast.position).toBeUndefined()
      const para = ast.children[0]

      expect(para?.position).toBeUndefined()
    })

    it('strips positions recursively from deeply nested nodes', () => {
      const { ast } = parse('- :font[bold]{font-weight="bold"}', { position: false })
      const list = ast.children[0]

      expect(list?.position).toBeUndefined()
      if (list?.type !== 'list') return
      const item = list.children[0]

      expect(item?.position).toBeUndefined()
      if (item?.type !== 'listItem') return
      const para = item.children[0]

      expect(para?.position).toBeUndefined()
      if (para?.type !== 'paragraph') return
      const directive = para.children.find((c) => c.type === 'textDirective')

      expect(directive?.position).toBeUndefined()
    })
  })

  describe('paragraphs', () => {
    it('parses a single paragraph', () => {
      const { ast } = parse("Hello world.\n\nSecond paragraph.", { position: false })

      expect(ast.children).toHaveLength(2)
      expect(ast.children[0]?.type).toBe('paragraph')
      expect(ast.children[1]?.type).toBe('paragraph')
    })

    it('paragraph contains a text node with correct value', () => {
      const { ast } = parse('Hello world.', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]).toMatchObject({ type: 'text', value: 'Hello world.' })
    })

    it('paragraph contains text nodes surrounding a directive', () => {
      const { ast } = parse('Hello :font[bold]{font-weight="bold"} world.', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]).toMatchObject({ type: 'text', value: 'Hello ' })
      expect(para.children[1]?.type).toBe('textDirective')
      expect(para.children[2]).toMatchObject({ type: 'text', value: ' world.' })
    })
  })

  describe('position info', () => {
    it('records correct line number for first paragraph', () => {
      const { ast } = parse('Hello.')
      const para = ast.children[0]

      expect(para?.position?.start.line).toBe(1)
      expect(para?.position?.start.column).toBe(1)
    })

    it('records correct line number for second paragraph', () => {
      const { ast } = parse('First.\n\nSecond.')
      const para = ast.children[1]

      expect(para?.position?.start.line).toBe(3)
    })

    it('records correct line for a container directive', () => {
      const { ast } = parse('Intro.\n\n:::align{value="center"}\n\nText.\n\n:::')
      const align = ast.children.find((c) => c.type === 'containerDirective')

      expect(align?.position?.start.line).toBe(3)
    })
  })

  describe(':font text directive', () => {
    it('parses :font as a textDirective node', () => {
      const { ast } = parse('A :font[bold]{font-weight="bold"} and :font[italic]{font-style="italic"} word.', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const directives = para.children.filter((c) => c.type === 'textDirective')

      expect(directives).toHaveLength(2)
    })

    it('captures :font directive name and attributes', () => {
      const { ast } = parse(':font[bold text]{font-weight="bold"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const directive = para.children[0]

      if (directive?.type !== 'textDirective') return
      expect(directive.name).toBe('font')
      expect(directive.attributes).toMatchObject({ 'font-weight': 'bold' })
    })

    it('captures :font label text as a child text node', () => {
      const { ast } = parse(':font[bold text]{font-weight="bold"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const directive = para.children[0]

      if (directive?.type !== 'textDirective') return
      expect(directive.children[0]).toMatchObject({ type: 'text', value: 'bold text' })
    })

    it('parses all supported :font attributes', () => {
      const input = ':font[styled]{font-family="Arial" font-size="16px" line-height="1.5" letter-spacing="0.1em" font-style="italic" font-weight="bold" text-decoration="underline" color="#ff0000"}'
      const { ast } = parse(input, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const directive = para.children[0]

      if (directive?.type !== 'textDirective') return
      expect(directive.attributes).toMatchObject({
        'font-family': 'Arial',
        'font-size': '16px',
        'line-height': '1.5',
        'letter-spacing': '0.1em',
        'font-style': 'italic',
        'font-weight': 'bold',
        'text-decoration': 'underline',
        'color': '#ff0000',
      })
    })

    it('parses multiple :font directives in one paragraph', () => {
      const input = ':font[A]{font-weight="bold"} and :font[B]{font-style="italic"} and :font[C]{color="#000"}'
      const { ast } = parse(input, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const directives = para.children.filter((c) => c.type === 'textDirective')

      expect(directives).toHaveLength(3)
      expect(directives[0]).toMatchObject({ name: 'font' })
      expect(directives[1]).toMatchObject({ name: 'font' })
      expect(directives[2]).toMatchObject({ name: 'font' })
    })
  })

  describe(':link text directive', () => {
    const linkInput = 'Click :link[:font[here]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com" target="_blank"} to continue.'

    it('parses :link as a textDirective node', () => {
      const { ast } = parse(linkInput, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children.find((c) => c.type === 'textDirective')

      if (link?.type !== 'textDirective') return
      expect(link.name).toBe('link')
      expect(link.attributes).toMatchObject({ href: 'https://example.com', target: '_blank' })
    })

    it('parses :link child :font as a nested textDirective', () => {
      const { ast } = parse(linkInput, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children.find((c) => c.type === 'textDirective')

      if (link?.type !== 'textDirective') return
      const fontChild = link.children.find((c) => c.type === 'textDirective')

      expect(fontChild?.type).toBe('textDirective')
      if (fontChild?.type !== 'textDirective') return
      expect(fontChild.name).toBe('font')
      expect(fontChild.attributes).toMatchObject({ color: '#2e5bff', 'text-decoration': 'underline' })
    })

    it('parses :link without target attribute', () => {
      const { ast } = parse(':link[click]{href="https://x.com"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'textDirective') return
      expect(link.attributes?.['target']).toBeUndefined()
      expect(link.attributes?.['href']).toBe('https://x.com')
    })

    it('parses :link with no-tracked attribute', () => {
      const { ast } = parse(':link[click]{href="https://x.com" no-tracked="true"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'textDirective') return
      expect(link.attributes).toMatchObject({ 'no-tracked': 'true' })
    })
  })

  describe('::placeholder leaf directive', () => {
    it('parses ::placeholder as a leafDirective node', () => {
      const { ast } = parse('::placeholder{type="Subscriber" value="first_name" name="First name" original="[subscriber:first_name]"}', { position: false })
      const directive = ast.children.find((c) => c.type === 'leafDirective')

      if (directive?.type !== 'leafDirective') return
      expect(directive.name).toBe('placeholder')
      expect(directive.attributes).toMatchObject({
        type: 'Subscriber',
        value: 'first_name',
        name: 'First name',
        original: '[subscriber:first_name]',
      })
    })

    it('parses ::placeholder max-length attribute', () => {
      const input = '::placeholder{type="Subscriber" value="x" name="X" original="[x]" max-length="100"}'
      const { ast } = parse(input, { position: false })
      const directive = ast.children.find((c) => c.type === 'leafDirective')

      if (directive?.type !== 'leafDirective') return
      expect(directive.attributes?.['max-length']).toBe('100')
    })

  })

  describe('::loop-value leaf directive', () => {
    const loopValueInput = '::loop-value{original="orders.name" value="orders" index="name"}'

    it('parses ::loop-value as a leafDirective node', () => {
      const { ast } = parse(loopValueInput, { position: false })
      const directive = ast.children.find((c) => c.type === 'leafDirective')

      expect(directive?.type).toBe('leafDirective')
      if (directive?.type !== 'leafDirective') return
      expect(directive.name).toBe('loop-value')
    })

    it('captures all ::loop-value attributes', () => {
      const { ast } = parse(loopValueInput, { position: false })
      const directive = ast.children.find((c) => c.type === 'leafDirective')

      if (directive?.type !== 'leafDirective') return
      expect(directive.attributes).toMatchObject({
        original: 'orders.name',
        value: 'orders',
        index: 'name',
      })
    })
  })

  describe(':::align container directive', () => {
    it('parses :::align as a containerDirective', () => {
      const { ast } = parse(rfmFullInput, { position: false })
      const align = ast.children.find((c) => c.type === 'containerDirective')

      if (align?.type !== 'containerDirective') return
      expect(align.name).toBe('align')
      expect(align.attributes).toMatchObject({ value: 'center' })
    })

    it('parses :::align children as block content', () => {
      const input = ':::align{value="center"}\n\nA paragraph.\n\n:::'
      const { ast } = parse(input, { position: false })
      const align = ast.children[0]

      if (align?.type !== 'containerDirective') return
      const para = align.children.find((c) => c.type === 'paragraph')

      expect(para?.type).toBe('paragraph')
    })

    it('parses all align value variants', () => {
      for (const value of ['left', 'center', 'right']) {
        const { ast } = parse(`:::align{value="${value}"}\n\nText.\n\n:::`, { position: false })
        const align = ast.children[0]

        if (align?.type !== 'containerDirective') return
        expect(align.attributes?.['value']).toBe(value)
      }
    })
  })

  describe('lists', () => {
    it('parses bullet list', () => {
      const { ast } = parse(rfmFullInput, { position: false })
      const list = ast.children.find((c) => c.type === 'list')

      if (list?.type !== 'list') return
      expect(list.ordered).toBe(false)
    })

    it('parses ordered list', () => {
      const { ast } = parse(rfmFullInput, { position: false })
      const lists = ast.children.filter((c) => c.type === 'list')
      const ordered = lists.find((l) => l.type === 'list' && l.ordered === true)

      expect(ordered).toBeDefined()
    })

    it('list item contains a paragraph child', () => {
      const { ast } = parse('- Hello', { position: false })
      const list = ast.children[0]

      if (list?.type !== 'list') return
      const item = list.children[0]

      if (item?.type !== 'listItem') return
      expect(item.children[0]?.type).toBe('paragraph')
    })

    it('list item paragraph contains the item text', () => {
      const { ast } = parse('- Hello', { position: false })
      const list = ast.children[0]

      if (list?.type !== 'list') return
      const item = list.children[0]

      if (item?.type !== 'listItem') return
      const para = item.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]).toMatchObject({ type: 'text', value: 'Hello' })
    })

    it('list item can contain a :font directive', () => {
      const { ast } = parse('- :font[bold]{font-weight="bold"}', { position: false })
      const list = ast.children[0]

      if (list?.type !== 'list') return
      const item = list.children[0]

      if (item?.type !== 'listItem') return
      const para = item.children[0]

      if (para?.type !== 'paragraph') return
      const directive = para.children.find((c) => c.type === 'textDirective')

      expect(directive?.type).toBe('textDirective')
    })

    it('parses multiple list items', () => {
      const { ast } = parse('- One\n- Two\n- Three', { position: false })
      const list = ast.children[0]

      if (list?.type !== 'list') return
      expect(list.children).toHaveLength(3)
    })
  })

  describe('CommonMark block nodes (parsed, not validated)', () => {
    it('parses # as a heading node with depth 1', () => {
      const { ast } = parse('# Title', { position: false })

      expect(ast.children[0]).toMatchObject({ type: 'heading', depth: 1 })
    })

    it('parses ## as a heading node with depth 2', () => {
      const { ast } = parse('## Subtitle', { position: false })

      expect(ast.children[0]).toMatchObject({ type: 'heading', depth: 2 })
    })

    it('parses heading children as text nodes', () => {
      const { ast } = parse('# Hello', { position: false })
      const heading = ast.children[0]

      if (heading?.type !== 'heading') return
      expect(heading.children[0]).toMatchObject({ type: 'text', value: 'Hello' })
    })

    it('parses > as a blockquote node', () => {
      const { ast } = parse('> A quote', { position: false })

      expect(ast.children[0]?.type).toBe('blockquote')
    })

    it('parses fenced code block as a code node', () => {
      const { ast } = parse('```\nconsole.log("hi")\n```', { position: false })

      expect(ast.children[0]).toMatchObject({ type: 'code', value: 'console.log("hi")' })
    })

    it('captures fenced code block language', () => {
      const { ast } = parse('```js\nconst x = 1\n```', { position: false })

      expect(ast.children[0]).toMatchObject({ type: 'code', lang: 'js' })
    })

    it('parses --- as a thematicBreak node', () => {
      const { ast } = parse('---', { position: false })

      expect(ast.children[0]?.type).toBe('thematicBreak')
    })

    it('parses raw HTML block as an html node', () => {
      const { ast } = parse('<div>hello</div>', { position: false })

      expect(ast.children[0]?.type).toBe('html')
    })
  })

  describe('CommonMark inline marks (parsed, not validated)', () => {
    it('parses **text** as a strong node', () => {
      const { ast } = parse('**bold**', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]?.type).toBe('strong')
    })

    it('parses strong children as text nodes', () => {
      const { ast } = parse('**bold**', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const strong = para.children[0]

      if (strong?.type !== 'strong') return
      expect(strong.children[0]).toMatchObject({ type: 'text', value: 'bold' })
    })

    it('parses *text* as an emphasis node', () => {
      const { ast } = parse('*italic*', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]?.type).toBe('emphasis')
    })

    it('parses emphasis children as text nodes', () => {
      const { ast } = parse('*italic*', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const em = para.children[0]

      if (em?.type !== 'emphasis') return
      expect(em.children[0]).toMatchObject({ type: 'text', value: 'italic' })
    })

    it('treats ~~text~~ as literal text — use :font{text-decoration="line-through"} instead', () => {
      // Native GFM strikethrough is not supported; strikethrough styling is
      // expressed via :font[text]{text-decoration="line-through"}
      const { ast } = parse('~~strike~~', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]).toMatchObject({ type: 'text', value: '~~strike~~' })
    })

    it('parses :font with text-decoration="line-through" as a textDirective', () => {
      const { ast } = parse(':font[strike]{text-decoration="line-through"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const directive = para.children[0]

      if (directive?.type !== 'textDirective') return
      expect(directive.name).toBe('font')
      expect(directive.attributes).toMatchObject({ 'text-decoration': 'line-through' })
    })

    it('parses `code` as an inlineCode node', () => {
      const { ast } = parse('some `code` here', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const inlineCode = para.children.find((c) => c.type === 'inlineCode')

      expect(inlineCode).toMatchObject({ type: 'inlineCode', value: 'code' })
    })

    it('parses [text](url) as a link node', () => {
      const { ast } = parse('[click](https://example.com)', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]).toMatchObject({ type: 'link', url: 'https://example.com' })
    })

    it('parses link children as text nodes', () => {
      const { ast } = parse('[click](https://example.com)', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'link') return
      expect(link.children[0]).toMatchObject({ type: 'text', value: 'click' })
    })

    it('parses ![alt](url) as an image node', () => {
      const { ast } = parse('![logo](https://example.com/img.png)', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]).toMatchObject({
        type: 'image',
        url: 'https://example.com/img.png',
        alt: 'logo',
      })
    })
  })

  describe('mark combinations', () => {
    it(':link wrapping plain text label', () => {
      const { ast } = parse(':link[click here]{href="https://example.com"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'textDirective') return
      expect(link.name).toBe('link')
      expect(link.children[0]).toMatchObject({ type: 'text', value: 'click here' })
    })

    it(':link wrapping :font with color and underline', () => {
      const { ast } = parse(
        ':link[:font[visit]{color="#2e5bff" text-decoration="underline"}]{href="https://example.com"}',
        { position: false },
      )
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'textDirective') return
      const font = link.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.name).toBe('font')
      expect(font.attributes).toMatchObject({ color: '#2e5bff', 'text-decoration': 'underline' })
    })

    it(':link wrapping :font with font-weight bold', () => {
      const { ast } = parse(
        ':link[:font[buy now]{font-weight="bold"}]{href="https://shop.example.com"}',
        { position: false },
      )
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'textDirective') return
      const font = link.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({ 'font-weight': 'bold' })
      expect(link.attributes).toMatchObject({ href: 'https://shop.example.com' })
    })

    it(':link wrapping :font with all style attributes', () => {
      const input = ':link[:font[styled link]{font-weight="bold" font-style="italic" color="#ff0000" text-decoration="underline"}]{href="https://example.com" target="_blank"}'
      const { ast } = parse(input, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'textDirective') return
      expect(link.attributes).toMatchObject({ href: 'https://example.com', target: '_blank' })
      const font = link.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({
        'font-weight': 'bold',
        'font-style': 'italic',
        color: '#ff0000',
        'text-decoration': 'underline',
      })
    })

    it(':font bold + italic (font-weight and font-style together)', () => {
      const { ast } = parse(':font[text]{font-weight="bold" font-style="italic"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const font = para.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({ 'font-weight': 'bold', 'font-style': 'italic' })
    })

    it(':font with color and font-size together', () => {
      const { ast } = parse(':font[text]{color="#333333" font-size="14px"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const font = para.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({ color: '#333333', 'font-size': '14px' })
    })

    it(':font with text-decoration line-through', () => {
      const { ast } = parse(':font[old price]{text-decoration="line-through"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const font = para.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({ 'text-decoration': 'line-through' })
    })

    it(':font with text-decoration underline', () => {
      const { ast } = parse(':font[terms]{text-decoration="underline"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const font = para.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({ 'text-decoration': 'underline' })
    })

    it('two :link directives in one paragraph', () => {
      const input = ':link[first]{href="https://a.com"} and :link[second]{href="https://b.com"}'
      const { ast } = parse(input, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const links = para.children.filter((c) => c.type === 'textDirective' && c.name === 'link')

      expect(links).toHaveLength(2)
      expect(links[0]).toMatchObject({ name: 'link' })
      expect(links[1]).toMatchObject({ name: 'link' })
    })

    it('mixed :font and :link in same paragraph preserves order', () => {
      const input = ':font[Hello]{font-weight="bold"} :link[world]{href="https://example.com"} end'
      const { ast } = parse(input, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      expect(para.children[0]).toMatchObject({ type: 'textDirective', name: 'font' })
      expect(para.children[1]).toMatchObject({ type: 'text', value: ' ' })
      expect(para.children[2]).toMatchObject({ type: 'textDirective', name: 'link' })
      expect(para.children[3]).toMatchObject({ type: 'text', value: ' end' })
    })

    it(':font with line-height and letter-spacing for typographic control', () => {
      const { ast } = parse(':font[spaced]{line-height="1.8" letter-spacing="0.05em"}', { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const font = para.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({ 'line-height': '1.8', 'letter-spacing': '0.05em' })
    })

    it(':link wrapping :font with line-through (styled strike)', () => {
      const { ast } = parse(
        ':link[:font[old]{text-decoration="line-through"}]{href="https://example.com"}',
        { position: false },
      )
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const link = para.children[0]

      if (link?.type !== 'textDirective') return
      const font = link.children[0]

      if (font?.type !== 'textDirective') return
      expect(font.attributes).toMatchObject({ 'text-decoration': 'line-through' })
    })
  })

  describe('hard break', () => {
    const hardBreakInput = "Line one\\\nLine two"

    it('parses a hard break as a break node', () => {
      const { ast } = parse(hardBreakInput, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const breakNode = para.children.find((c) => c.type === 'break')

      expect(breakNode?.type).toBe('break')
    })

    it('hard break splits text into separate text nodes', () => {
      const { ast } = parse(hardBreakInput, { position: false })
      const para = ast.children[0]

      if (para?.type !== 'paragraph') return
      const textNodes = para.children.filter((c) => c.type === 'text')

      expect(textNodes.length).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('parseEmailRfm()', () => {
  it('does not throw for valid RFM content', () => {
    expect(() => parseEmailRfm(':font[bold]{font-weight="bold"}')).not.toThrow()
  })

  it('throws RcmlValidationError for invalid content', () => {
    expect(() => parseEmailRfm('# Heading')).toThrow(RcmlValidationError)
  })

  it('error message lists all issues', () => {
    try {
      parseEmailRfm('# Heading\n\n> Quote')
    } catch (err) {
      expect(err).toBeInstanceOf(RcmlValidationError)

      if (err instanceof RcmlValidationError) {
        expect(err.message).toMatch(/Found \d+ validation error/)
        expect(err.errors.length).toBeGreaterThanOrEqual(2)
      }
    }
  })
})

describe('parseEmailInlineRfm()', () => {
  it('does not throw for valid Inline RFM content', () => {
    expect(() => parseEmailInlineRfm(':font[label]{font-weight="bold"}')).not.toThrow()
  })

  it('throws RcmlValidationError for lists', () => {
    expect(() => parseEmailInlineRfm('- item')).toThrow(RcmlValidationError)
  })

  it('exposes structured errors on RcmlValidationError', () => {
    try {
      parseEmailInlineRfm(':font[text]{bad-attr="x"}')
    } catch (err) {
      expect(err).toBeInstanceOf(RcmlValidationError)

      if (err instanceof RcmlValidationError) {
        expect(err.errors[0]).toHaveProperty('message')
        expect(err.errors[0]).toHaveProperty('path')
      }
    }
  })
})
