import { describe, expect, it } from 'vitest'
import {
  RcmlElementBuildError,
  createAttributesElement,
  createBodyElement,
  createBrandStyleElement,
  createButtonElement,
  createCaseElement,
  createClassElement,
  createColumnElement,
  createDividerElement,
  createFontElement,
  createGroupElement,
  createHeadElement,
  createHeadingElement,
  createImageElement,
  createInlineContent,
  createLogoElement,
  createLoopElement,
  createLoopValueNode,
  createPlaceholderNode,
  createPlainTextElement,
  createPreviewElement,
  createRawElement,
  createRcmlDocumentElement,
  createSectionElement,
  createSocialChildElement,
  createSocialElement,
  createSpacerElement,
  createSwitchElement,
  createTextContent,
  createTextElement,
  createTextNode,
  createVideoElement,
  createWrapperElement,
} from './create-rcml-element.js'
import { validateEmailTemplate } from './validate-email-template.js'

// ─── Content helpers ────────────────────────────────────────────────────────

describe('inline-node helpers', () => {
  it('createTextNode produces a bare text node', () => {
    expect(createTextNode('hi')).toEqual({ type: 'text', text: 'hi' })
  })

  it('createTextNode omits empty marks arrays', () => {
    expect(createTextNode('hi', [])).toEqual({ type: 'text', text: 'hi' })
  })

  it('createTextNode attaches provided marks', () => {
    const node = createTextNode('hi', [
      { type: 'font', attrs: { 'font-weight': 'bold' } as never },
    ])

    expect(node.marks).toHaveLength(1)
  })

  it('createPlaceholderNode produces a canonical CustomField placeholder', () => {
    expect(createPlaceholderNode('Subscriber.FirstName', 169233)).toEqual({
      type: 'placeholder',
      attrs: {
        type: 'CustomField',
        value: 169233,
        name: 'Subscriber.FirstName',
        original: '[CustomField:169233]',
        'max-length': null,
      },
    })
  })

  it('createPlaceholderNode honours overrides', () => {
    const node = createPlaceholderNode('x', 1, { type: 'Date', maxLength: '64' })

    expect(node.attrs.type).toBe('Date')
    expect(node.attrs['max-length']).toBe('64')
  })

  it('createLoopValueNode produces a canonical loop-value node', () => {
    expect(createLoopValueNode('price')).toEqual({
      type: 'loop-value',
      attrs: { original: '[LoopValue:price]', value: 'price', index: 'price' },
    })
  })

  it('createInlineContent wraps nodes in a valid doc', () => {
    const doc = createInlineContent([
      createTextNode('Hi '),
      createPlaceholderNode('Subscriber.FirstName', 169233),
    ])

    expect(doc.type).toBe('doc')
    expect(doc.content[0]!.type).toBe('paragraph')
  })

  it('createTextContent converts RFM markdown to a validated doc', () => {
    const doc = createTextContent('hello')

    expect(doc.type).toBe('doc')
  })
})

// ─── Content leaves (rc-text, rc-heading, rc-button) ────────────────────────

describe('createTextElement', () => {
  it('builds from an RFM string', () => {
    const node = createTextElement({ content: 'hello' })

    expect(node.tagName).toBe('rc-text')
    expect(node.content.type).toBe('doc')
    expect(node.attributes).toBeUndefined()
  })

  it('accepts typed attributes', () => {
    const node = createTextElement({
      attrs: { align: 'center', color: '#333333' },
      content: 'hi',
    })

    expect(node.attributes).toEqual({ align: 'center', color: '#333333' })
  })

  it('accepts pre-built content Json', () => {
    const content = createInlineContent([createTextNode('hi')])
    const node = createTextElement({ content })

    expect(node.content).toEqual(content)
  })

  it('throws on invalid attr value', () => {
    expect(() =>
      createTextElement({ attrs: { color: 'not-a-color' }, content: 'x' }),
    ).toThrowError(RcmlElementBuildError)
  })

  it('throws on unknown attr', () => {
    expect(() =>
      createTextElement({
        attrs: { 'not-an-attr': 'x' } as unknown as { align: 'left' },
        content: 'x',
      }),
    ).toThrowError(RcmlElementBuildError)
  })
})

describe('createHeadingElement', () => {
  it('builds from an RFM string', () => {
    const node = createHeadingElement({ content: 'Title' })

    expect(node.tagName).toBe('rc-heading')
  })

  it('attaches attributes when supplied', () => {
    const node = createHeadingElement({ attrs: { align: 'center', color: '#333333' }, content: 'Hi' })

    expect(node.attributes).toEqual({ align: 'center', color: '#333333' })
  })

  it('throws on invalid attr', () => {
    expect(() =>
      createHeadingElement({ attrs: { 'font-size': 'huge' }, content: 'x' }),
    ).toThrowError(RcmlElementBuildError)
  })
})

describe('createButtonElement', () => {
  it('builds a button from an RFM string + href', () => {
    const node = createButtonElement({
      attrs: { href: 'https://example.com' },
      content: 'Click',
    })

    expect(node.tagName).toBe('rc-button')
    expect(node.attributes?.href).toBe('https://example.com')
  })

  it('throws on invalid href', () => {
    // URL validator in attr-validators.ts is aliased to plain string, so any
    // string passes. Use an invalid color instead to exercise attr validation.
    expect(() =>
      createButtonElement({ attrs: { color: 'bad-color' }, content: 'x' }),
    ).toThrowError(RcmlElementBuildError)
  })
})

// ─── Media / primitive leaves ───────────────────────────────────────────────

describe('createImageElement', () => {
  it('builds with required attrs', () => {
    const node = createImageElement({ attrs: { src: 'https://example.com/a.png' } })

    expect(node.tagName).toBe('rc-image')
    expect(node.attributes.src).toBe('https://example.com/a.png')
  })
})

describe('createLogoElement', () => {
  it('builds with no attrs', () => {
    expect(createLogoElement()).toEqual({ tagName: 'rc-logo' })
  })

  it('builds with attrs', () => {
    const node = createLogoElement({ attrs: { src: 'https://example.com/logo.png' } })

    expect(node.attributes?.src).toBe('https://example.com/logo.png')
  })
})

describe('createVideoElement', () => {
  it('builds with required attrs', () => {
    const node = createVideoElement({ attrs: { src: 'https://example.com/v.mp4' } })

    expect(node.tagName).toBe('rc-video')
  })
})

describe('createSpacerElement', () => {
  it('builds with no attrs', () => {
    expect(createSpacerElement()).toEqual({ tagName: 'rc-spacer' })
  })

  it('throws on invalid attr value', () => {
    expect(() =>
      createSpacerElement({ attrs: { height: 'huge' } }),
    ).toThrowError(RcmlElementBuildError)
  })
})

describe('createDividerElement', () => {
  it('builds with defaults', () => {
    expect(createDividerElement()).toEqual({ tagName: 'rc-divider' })
  })

  it('accepts valid attrs', () => {
    const node = createDividerElement({ attrs: { 'border-color': '#cccccc' } })

    expect(node.attributes?.['border-color']).toBe('#cccccc')
  })
})

// ─── Social ─────────────────────────────────────────────────────────────────

describe('createSocialChildElement', () => {
  it('builds with required attrs', () => {
    const node = createSocialChildElement({
      attrs: { name: 'twitter', href: 'https://twitter.com/x' },
    })

    expect(node.tagName).toBe('rc-social-element')
    expect(node.attributes.name).toBe('twitter')
  })

  it('carries content (label) when provided', () => {
    const node = createSocialChildElement({
      attrs: { name: 'x', href: 'https://x.com' },
      content: 'Follow',
    })

    expect(node.content).toBe('Follow')
  })
})

describe('createSocialElement', () => {
  it('builds a social container around children', () => {
    const child = createSocialChildElement({
      attrs: { name: 'x', href: 'https://x.com' },
    })
    const node = createSocialElement({ children: [child] })

    expect(node.tagName).toBe('rc-social')
    expect(node.children).toHaveLength(1)
  })

  it('attaches attributes when supplied', () => {
    const child = createSocialChildElement({
      attrs: { name: 'x', href: 'https://x.com' },
    })
    const node = createSocialElement({
      attrs: { align: 'center', mode: 'horizontal' },
      children: [child],
    })

    expect(node.attributes).toEqual({ align: 'center', mode: 'horizontal' })
  })

  it('rejects non-social-element children', () => {
    const text = createTextElement({ content: 'oops' })

    expect(() =>
      createSocialElement({
        children: [text as unknown as ReturnType<typeof createSocialChildElement>],
      }),
    ).toThrowError(RcmlElementBuildError)
  })
})

// ─── Layout containers ──────────────────────────────────────────────────────

describe('createColumnElement', () => {
  it('builds with valid column children', () => {
    const text = createTextElement({ content: 'x' })
    const node = createColumnElement({ children: [text] })

    expect(node.tagName).toBe('rc-column')
    expect(node.children).toHaveLength(1)
  })

  it('rejects rc-section as column child', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })

    expect(() =>
      createColumnElement({
        children: [section as unknown as ReturnType<typeof createTextElement>],
      }),
    ).toThrowError(RcmlElementBuildError)
  })
})

describe('createSectionElement', () => {
  it('builds from a list of columns', () => {
    const col = createColumnElement({ children: [createTextElement({ content: 'x' })] })
    const node = createSectionElement({ children: [col] })

    expect(node.tagName).toBe('rc-section')
  })

  it('enforces maxChildCount (20 columns)', () => {
    const col = createColumnElement({ children: [createTextElement({ content: 'x' })] })
    const twentyOne = Array.from({ length: 21 }, () => col)

    expect(() => createSectionElement({ children: twentyOne })).toThrowError(
      RcmlElementBuildError,
    )
  })
})

// ─── Control flow ───────────────────────────────────────────────────────────

describe('createCaseElement / createSwitchElement', () => {
  it('builds a switch with one case', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })
    const caseNode = createCaseElement({ attrs: { 'case-type': 'default' }, children: [section] })
    const switchNode = createSwitchElement({ children: [caseNode] })

    expect(switchNode.tagName).toBe('rc-switch')
    expect(switchNode.children).toHaveLength(1)
  })

  it('createCaseElement rejects invalid case-type', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })

    expect(() =>
      createCaseElement({
        attrs: { 'case-type': 'bogus' as unknown as 'default' },
        children: [section],
      }),
    ).toThrowError(RcmlElementBuildError)
  })
})

describe('createLoopElement', () => {
  it('builds a loop around sections', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })
    const node = createLoopElement({
      attrs: { 'loop-type': 'custom-field', 'loop-value': '123' },
      children: [section],
    })

    expect(node.tagName).toBe('rc-loop')
  })
})

describe('createGroupElement', () => {
  it('builds a group around columns', () => {
    const col = createColumnElement({ children: [createTextElement({ content: 'x' })] })
    const node = createGroupElement({ children: [col] })

    expect(node.tagName).toBe('rc-group')
  })
})

describe('createWrapperElement', () => {
  it('builds a wrapper around a section', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })
    const node = createWrapperElement({ children: [section] })

    expect(node.tagName).toBe('rc-wrapper')
  })

  it('attaches attributes when supplied', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })
    const node = createWrapperElement({
      attrs: { 'background-color': '#f3f3f3', padding: '40px 0' },
      children: [section],
    })

    expect(node.attributes).toEqual({ 'background-color': '#f3f3f3', padding: '40px 0' })
  })
})

// ─── Head / metadata ────────────────────────────────────────────────────────

describe('createHeadElement / createBodyElement / createRcmlDocumentElement', () => {
  it('composes a full document', () => {
    const head = createHeadElement({ children: [createPreviewElement({ content: 'Preheader' })] })
    const body = createBodyElement({
      children: [
        createSectionElement({
          children: [
            createColumnElement({ children: [createTextElement({ content: 'hi' })] }),
          ],
        }),
      ],
    })
    const doc = createRcmlDocumentElement({ head, body })

    expect(doc.tagName).toBe('rcml')
    expect(doc.children).toEqual([head, body])
  })

  it('rejects an invalid head child', () => {
    const text = createTextElement({ content: 'oops' })

    expect(() =>
      createHeadElement({
        children: [text as unknown as ReturnType<typeof createPreviewElement>],
      }),
    ).toThrowError(RcmlElementBuildError)
  })
})

describe('createBrandStyleElement / createFontElement / createClassElement', () => {
  it('createBrandStyleElement with numeric id', () => {
    const node = createBrandStyleElement({ attrs: { id: '99999' } })

    expect(node.attributes.id).toBe('99999')
  })

  it('createFontElement with name + href', () => {
    const node = createFontElement({
      attrs: { name: 'Inter', href: 'https://fonts.example.com/inter.css' },
    })

    expect(node.attributes.name).toBe('Inter')
  })

  it('createClassElement with a typography attrs bundle', () => {
    const node = createClassElement({
      attrs: { name: 'h1-style', color: '#333333', 'font-size': '28px' },
    })

    expect(node.attributes.name).toBe('h1-style')
  })

  it('createClassElement rejects invalid value', () => {
    expect(() =>
      createClassElement({ attrs: { name: 'x', color: 'bad' } }),
    ).toThrowError(RcmlElementBuildError)
  })
})

describe('createAttributesElement / createPreviewElement / createPlainTextElement / createRawElement', () => {
  it('createAttributesElement with a style-override body child', () => {
    // Per schema, <rc-attributes> accepts body/section/button/heading/text/social
    // as style-override declarations (not <rc-class>; that goes directly under <rc-head>).
    // The legacy RcmlAttributes.children type lists distinct "*Style" shapes that
    // share the tag with their content-bearing counterparts; cast to bridge.
    type AttrsChild = Parameters<typeof createAttributesElement>[0]['children'][number]
    const styleBody = createBodyElement({
      attrs: { 'background-color': '#ffffff' },
      children: [],
    })
    const node = createAttributesElement({
      children: [styleBody as unknown as AttrsChild],
    })

    expect(node.tagName).toBe('rc-attributes')
  })

  it('createPreviewElement with content', () => {
    expect(createPreviewElement({ content: 'Preheader' })).toEqual({
      tagName: 'rc-preview',
      content: 'Preheader',
    })
  })

  it('createPreviewElement with no content', () => {
    expect(createPreviewElement()).toEqual({ tagName: 'rc-preview' })
  })

  it('createPlainTextElement wraps content in the expected shape', () => {
    expect(createPlainTextElement({ content: 'hi' })).toEqual({
      tagName: 'rc-plain-text',
      content: { type: 'text', text: 'hi' },
    })
  })

  it('createRawElement with content', () => {
    expect(createRawElement({ content: '<p>raw</p>' })).toEqual({
      tagName: 'rc-raw',
      content: { type: 'html', text: '<p>raw</p>' },
    })
  })

  it('createRawElement without content omits the content field', () => {
    expect(createRawElement()).toEqual({ tagName: 'rc-raw' })
    expect(createRawElement({})).toEqual({ tagName: 'rc-raw' })
  })
})

// ─── attrs-less variants (cover `if (attributes)` false branches) ────────────

describe('factories accept no-attrs invocations and omit the attributes field', () => {
  it('createSocialElement without attrs', () => {
    const child = createSocialChildElement({
      attrs: { name: 'x', href: 'https://x.com' },
    })
    const node = createSocialElement({ children: [child] })

    expect(node.tagName).toBe('rc-social')
    expect(node.attributes).toBeUndefined()
  })

  it('createWrapperElement without attrs', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })
    const node = createWrapperElement({ children: [section] })

    expect(node.tagName).toBe('rc-wrapper')
    expect(node.attributes).toBeUndefined()
  })

  it('createBodyElement without attrs', () => {
    const section = createSectionElement({
      children: [createColumnElement({ children: [createTextElement({ content: 'x' })] })],
    })
    const node = createBodyElement({ children: [section] })

    expect(node.tagName).toBe('rc-body')
    expect(node.attributes).toBeUndefined()
  })

  it('createSectionElement without attrs', () => {
    const col = createColumnElement({ children: [createTextElement({ content: 'x' })] })
    const node = createSectionElement({ children: [col] })

    expect(node.attributes).toBeUndefined()
  })

  it('createColumnElement without attrs', () => {
    const node = createColumnElement({
      children: [createTextElement({ content: 'x' })],
    })

    expect(node.attributes).toBeUndefined()
  })
})

// ─── End-to-end ─────────────────────────────────────────────────────────────

describe('end-to-end — validateEmailTemplate accepts a factory-built document', () => {
  it('builds a minimal template and passes validation', () => {
    // Mirror the structure of the existing VALID_DOC in validate-email-template.test.ts:
    // empty <rc-head> + <rc-body> with a <rc-section>/<rc-column>/leaf tree.
    const head = createHeadElement({ children: [] })
    const body = createBodyElement({
      attrs: { 'background-color': '#ffffff', width: '600px' },
      children: [
        createSectionElement({
          attrs: { 'background-color': '#f5f5f5', padding: '20px 0' },
          children: [
            createColumnElement({
              attrs: { width: '100%' },
              children: [
                createSpacerElement({ attrs: { height: '10px' } }),
                createDividerElement({ attrs: { 'border-color': '#cccccc' } }),
              ],
            }),
          ],
        }),
      ],
    })
    const doc = createRcmlDocumentElement({ head, body })

    expect(() => validateEmailTemplate(doc)).not.toThrow()
  })
})
