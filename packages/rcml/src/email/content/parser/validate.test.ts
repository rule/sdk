import { describe, it, expect } from 'vitest'
import { parse } from './parse.js'
import { validate } from './validate.js'
import { formatErrors } from './format.js'
import { emailRfmConfig, emailInlineRfmConfig } from '../flavors/index.js'

const parseAndValidate = (input: string, config: typeof emailRfmConfig) => {
  const { ast } = parse(input)

  return validate(ast, config)
}

describe('validate()', () => {
  describe('valid content', () => {
    it('accepts empty input for both configs', () => {
      expect(parseAndValidate('', emailRfmConfig).valid).toBe(true)
      expect(parseAndValidate('', emailInlineRfmConfig).valid).toBe(true)
    })

    it('accepts plain paragraph', () => {
      expect(parseAndValidate('Hello world.', emailInlineRfmConfig).valid).toBe(true)
    })

    it('accepts multiple plain paragraphs', () => {
      expect(parseAndValidate('First.\n\nSecond.\n\nThird.', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :font with valid attributes', () => {
      expect(parseAndValidate(':font[bold]{font-weight="bold"}', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :font with multiple valid attributes', () => {
      const result = parseAndValidate(
        ':font[styled]{font-weight="bold" font-style="italic" color="#ff0000"}',
        emailRfmConfig,
      )

      expect(result.valid).toBe(true)
    })

    it('accepts :font font-style="normal"', () => {
      expect(parseAndValidate(':font[t]{font-style="normal"}', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :font font-style="italic"', () => {
      expect(parseAndValidate(':font[t]{font-style="italic"}', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :font text-decoration="none"', () => {
      expect(parseAndValidate(':font[t]{text-decoration="none"}', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :font text-decoration="underline"', () => {
      expect(parseAndValidate(':font[t]{text-decoration="underline"}', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :font text-decoration="line-through"', () => {
      expect(parseAndValidate(':font[t]{text-decoration="line-through"}', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :link with href', () => {
      expect(parseAndValidate(':link[click]{href="https://example.com"}', emailInlineRfmConfig).valid).toBe(true)
    })

    it('accepts :link with target="_blank"', () => {
      expect(
        parseAndValidate(':link[click]{href="https://x.com" target="_blank"}', emailRfmConfig).valid,
      ).toBe(true)
    })

    it('accepts :link with no-tracked="true"', () => {
      expect(
        parseAndValidate(':link[click]{href="https://x.com" no-tracked="true"}', emailRfmConfig).valid,
      ).toBe(true)
    })

    it('accepts :link with no-tracked="false"', () => {
      expect(
        parseAndValidate(':link[click]{href="https://x.com" no-tracked="false"}', emailRfmConfig).valid,
      ).toBe(true)
    })

    it('accepts :link wrapping :font', () => {
      const result = parseAndValidate(
        ':link[:font[click]{color="#2e5bff"}]{href="https://example.com"}',
        emailRfmConfig,
      )

      expect(result.valid).toBe(true)
    })

    it('accepts :link wrapping :font in emailInlineRfmConfig', () => {
      const result = parseAndValidate(
        ':link[:font[click]{font-weight="bold"}]{href="https://example.com"}',
        emailInlineRfmConfig,
      )

      expect(result.valid).toBe(true)
    })

    it('accepts ::placeholder with required attributes', () => {
      const result = parseAndValidate(
        '::placeholder{type="Subscriber" value="first_name" name="First name" original="[subscriber:first_name]"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(true)
    })

    it('accepts ::placeholder with all valid type values', () => {
      const types = ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date']

      for (const type of types) {
        const result = parseAndValidate(
          `::placeholder{type="${type}" value="x" name="X" original="[x]"}\n:::`,
          emailRfmConfig,
        )

        expect(result.valid).toBe(true)
      }
    })

    it('accepts ::placeholder with optional max-length', () => {
      const result = parseAndValidate(
        '::placeholder{type="Subscriber" value="x" name="X" original="[x]" max-length="100"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(true)
    })

    it('accepts ::loop-value in both configs', () => {
      const input = '::loop-value{original="orders.name" value="orders" index="name"}\n:::'

      expect(parseAndValidate(input, emailRfmConfig).valid).toBe(true)
      expect(parseAndValidate(input, emailInlineRfmConfig).valid).toBe(true)
    })

    it('accepts :::align in emailRfmConfig', () => {
      const result = parseAndValidate(':::align{value="center"}\n\nA paragraph.\n\n:::', emailRfmConfig)

      expect(result.valid).toBe(true)
    })

    it('accepts :::align with value="left"', () => {
      expect(parseAndValidate(':::align{value="left"}\n\nText.\n\n:::', emailRfmConfig).valid).toBe(true)
    })

    it('accepts :::align with value="right"', () => {
      expect(parseAndValidate(':::align{value="right"}\n\nText.\n\n:::', emailRfmConfig).valid).toBe(true)
    })

    it('accepts bullet and ordered lists in emailRfmConfig', () => {
      const result = parseAndValidate('- Item one\n- Item two\n\n1. Step one\n2. Step two', emailRfmConfig)

      expect(result.valid).toBe(true)
    })

    it('accepts :font inside a list item', () => {
      const result = parseAndValidate('- :font[bold]{font-weight="bold"}', emailRfmConfig)

      expect(result.valid).toBe(true)
    })

    it('accepts :font inside :::align block', () => {
      const result = parseAndValidate(
        ':::align{value="center"}\n\n:font[big]{font-size="24px"}\n\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(true)
    })
  })

  describe('unsupported block node types', () => {
    it('rejects headings', () => {
      const result = parseAndValidate('# Hello', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/heading/)
    })

    it('rejects h2–h6 headings', () => {
      for (let depth = 2; depth <= 6; depth++) {
        const result = parseAndValidate(`${'#'.repeat(depth)} Heading`, emailRfmConfig)

        expect(result.valid).toBe(false)
        expect(result.errors[0]?.message).toMatch(/heading/)
      }
    })

    it('rejects blockquotes', () => {
      const result = parseAndValidate('> A quote', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/blockquote/)
    })

    it('rejects fenced code blocks', () => {
      const result = parseAndValidate('```js\nconst x = 1\n```', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/fenced code block/)
    })

    it('rejects thematic breaks', () => {
      const result = parseAndValidate('---', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/thematic break/)
    })

    it('rejects raw HTML blocks', () => {
      const result = parseAndValidate('<div>hello</div>', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/raw HTML/)
    })
  })

  describe('unsupported inline marks', () => {
    it('rejects native bold', () => {
      const result = parseAndValidate('**bold**', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/native bold/)
    })

    it('rejects native italic', () => {
      const result = parseAndValidate('*italic*', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/native italic/)
    })

    it('rejects native links', () => {
      const result = parseAndValidate('[click](https://example.com)', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/native link/)
    })

    it('rejects inline code', () => {
      const result = parseAndValidate('some `code` here', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/inline code/)
    })

    it('rejects images', () => {
      const result = parseAndValidate('![alt](https://example.com/img.png)', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/image/)
    })

    it('rejects native bold in emailInlineRfmConfig too', () => {
      const result = parseAndValidate('**bold**', emailInlineRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/native bold/)
    })

    it('accepts inline hard break in emailRfmConfig', () => {
      const result = parseAndValidate('line one\\\nline two', emailRfmConfig)

      expect(result.valid).toBe(true)
    })
  })

  describe('emailInlineRfmConfig restrictions', () => {
    it('rejects bullet lists', () => {
      const result = parseAndValidate('- Item', emailInlineRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/Inline RFM/)
    })

    it('rejects ordered lists', () => {
      const result = parseAndValidate('1. Step', emailInlineRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/Inline RFM/)
    })

    it('rejects :::align', () => {
      const result = parseAndValidate(':::align{value="center"}\n\nText.\n\n:::', emailInlineRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/:::align/)
    })

    it('rejects headings', () => {
      const result = parseAndValidate('# Hello', emailInlineRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/heading/)
    })

    it('rejects hard break in emailInlineRfmConfig', () => {
      const result = parseAndValidate('line one\\\nline two', emailInlineRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/hard break/)
    })
  })

  describe(':font attribute validation', () => {
    it('rejects :font with no attributes', () => {
      const result = parseAndValidate(':font[text]{}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/at least one attribute/)
    })

    it('rejects :font with unknown attribute', () => {
      const result = parseAndValidate(':font[text]{font-weiht="bold"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/font-weiht/)
    })

    it('rejects :font with invalid font-style value', () => {
      const result = parseAndValidate(':font[text]{font-style="oblique"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/font-style/)
    })

    it('rejects :font with invalid text-decoration value', () => {
      const result = parseAndValidate(':font[text]{text-decoration="blink"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/text-decoration/)
    })

    it('rejects :font with multiple unknown attributes', () => {
      const result = parseAndValidate(':font[text]{foo="1" bar="2"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe(':link attribute validation', () => {
    it('rejects :link without href', () => {
      const result = parseAndValidate(':link[click]{target="_blank"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/href/)
    })

    it('rejects :link with empty href', () => {
      const result = parseAndValidate(':link[click]{href=""}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/href/)
    })

    it('rejects :link with unknown attribute', () => {
      const result = parseAndValidate(':link[click]{href="https://x.com" rel="noopener"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/rel/)
    })

    it('rejects :link with invalid target value', () => {
      const result = parseAndValidate(':link[click]{href="https://x.com" target="_self"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/target/)
    })

    it('rejects :link with invalid no-tracked value', () => {
      const result = parseAndValidate(':link[click]{href="https://x.com" no-tracked="yes"}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/no-tracked/)
    })

    it('rejects invalid :font nested inside :link', () => {
      const result = parseAndValidate(
        ':link[:font[click]{}]{href="https://example.com"}',
        emailRfmConfig,
      )

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/at least one attribute/)
    })
  })

  describe(':::align attribute validation', () => {
    it('rejects :::align with invalid value', () => {
      const result = parseAndValidate(':::align{value="justify"}\n\nText.\n\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/value/)
    })

    it('rejects :::align with unknown attribute', () => {
      const result = parseAndValidate(':::align{value="center" side="left"}\n\nText.\n\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
    })

    it('rejects unknown directive inside :::align block', () => {
      const result = parseAndValidate(':::align{value="center"}\n\n:::callout{}\n\nText.\n\n:::\n\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/:::callout/)
    })

    it('rejects native bold inside :::align block', () => {
      const result = parseAndValidate(':::align{value="center"}\n\n**bold**\n\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/native bold/)
    })
  })

  describe('::loop-value attribute validation', () => {
    it('rejects ::loop-value missing original', () => {
      const result = parseAndValidate('::loop-value{value="orders" index="name"}\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/original/)
    })

    it('rejects ::loop-value missing value', () => {
      const result = parseAndValidate('::loop-value{original="orders.name" index="name"}\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/value/)
    })

    it('rejects ::loop-value missing index', () => {
      const result = parseAndValidate('::loop-value{original="orders.name" value="orders"}\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/index/)
    })

    it('rejects ::loop-value with unknown attribute', () => {
      const result = parseAndValidate(
        '::loop-value{original="orders.name" value="orders" index="name" extra="x"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(false)
    })
  })

  describe('::placeholder attribute validation', () => {
    it('rejects ::placeholder with invalid type', () => {
      const result = parseAndValidate(
        '::placeholder{type="Unknown" value="x" name="X" original="[x]"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/type/)
    })

    it('rejects ::placeholder missing required name', () => {
      const result = parseAndValidate(
        '::placeholder{type="Subscriber" value="x" original="[x]"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/name/)
    })

    it('accepts ::placeholder without value (value is optional)', () => {
      const result = parseAndValidate(
        '::placeholder{type="Subscriber" name="X" original="[x]"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(true)
    })

    it('rejects ::placeholder missing required original', () => {
      const result = parseAndValidate(
        '::placeholder{type="Subscriber" value="x" name="X"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/original/)
    })

    it('rejects ::placeholder with empty name', () => {
      const result = parseAndValidate(
        '::placeholder{type="Subscriber" value="x" name="" original="[x]"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/name/)
    })

    it('rejects ::placeholder with unknown attribute', () => {
      const result = parseAndValidate(
        '::placeholder{type="Subscriber" value="x" name="X" original="[x]" extra="y"}\n:::',
        emailRfmConfig,
      )

      expect(result.valid).toBe(false)
    })
  })

  describe('unknown directives', () => {
    it('rejects unknown text directive', () => {
      const result = parseAndValidate(':badge[NEW]{}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/:badge/)
    })

    it('rejects unknown text directive in emailInlineRfmConfig', () => {
      const result = parseAndValidate(':badge[NEW]{}', emailInlineRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/:badge/)
    })

    it('rejects unknown container directive', () => {
      const result = parseAndValidate(':::callout{}\n\nContent.\n\n:::', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/:::callout/)
    })

    it('error message for unknown text directive lists supported directives', () => {
      const result = parseAndValidate(':badge[NEW]{}', emailRfmConfig)

      expect(result.errors[0]?.message).toMatch(/:font/)
      expect(result.errors[0]?.message).toMatch(/:link/)
    })

    it('error message for unknown container directive lists supported directives', () => {
      const result = parseAndValidate(':::callout{}\n\nContent.\n\n:::', emailRfmConfig)

      expect(result.errors[0]?.message).toMatch(/:::align/)
    })

    it('rejects unknown leaf directive', () => {
      const result = parseAndValidate('::unknown{}', emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toMatch(/::unknown/)
    })

    it('containerDirective inside paragraph inline content is validated', () => {
      // remark-directive can place containerDirectives inside paragraphs in edge cases;
      // construct the AST directly to exercise this code path.
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'containerDirective',
                name: 'unknown',
                attributes: {},
                children: [],
              },
            ],
          },
        ],
      }

      const result = validate(ast as Parameters<typeof validate>[0], emailRfmConfig)

      expect(result.valid).toBe(false)
    })

    it('leafDirective inside paragraph inline content is validated', () => {
      // Construct AST directly: a leafDirective as inline child of a paragraph
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'leafDirective',
                name: 'placeholder',
                attributes: { type: 'Date', value: 'v', name: 'n', original: 'o' },
                children: [],
              },
            ],
          },
        ],
      }

      const result = validate(ast as Parameters<typeof validate>[0], emailRfmConfig)

      expect(result.valid).toBe(true)
    })

    it('uses raw type name in error message when inline type is not in NODE_LABEL', () => {
      // 'imageReference' is not in NODE_LABEL, so the ?? "${type}" branch is taken
      const ast = {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'imageReference',
                identifier: 'ref',
                referenceType: 'full',
                alt: '',
                children: [],
              },
            ],
          },
        ],
      }

      const result = validate(ast as Parameters<typeof validate>[0], emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toContain('"imageReference"')
    })

    it('uses raw type name in error message when block type is not in NODE_LABEL', () => {
      // 'yaml' is a valid MDAST block node type but not in NODE_LABEL
      const ast = {
        type: 'root',
        children: [
          {
            type: 'yaml',
            value: 'key: value',
          },
        ],
      }

      const result = validate(ast as Parameters<typeof validate>[0], emailRfmConfig)

      expect(result.valid).toBe(false)
      expect(result.errors[0]?.message).toContain('"yaml"')
    })
  })

  describe('error structure', () => {
    it('error has a path property', () => {
      const result = parseAndValidate('# Heading', emailRfmConfig)

      expect(result.errors[0]).toHaveProperty('path')
      expect(typeof result.errors[0]?.path).toBe('string')
    })

    it('error path includes node type', () => {
      const result = parseAndValidate('# Heading', emailRfmConfig)

      expect(result.errors[0]?.path).toMatch(/heading/)
    })

    it('error has line number', () => {
      const result = parseAndValidate('# Heading', emailRfmConfig)

      expect(result.errors[0]?.line).toBe(1)
    })

    it('includes line number in errors', () => {
      const result = parseAndValidate('Hello.\n\n# Heading', emailRfmConfig)
      const headingError = result.errors.find((e) => e.message.includes('heading'))

      expect(headingError?.line).toBe(3)
    })

    it('includes column number in errors', () => {
      const result = parseAndValidate('**bold**', emailRfmConfig)

      expect(result.errors[0]?.column).toBeDefined()
      expect(result.errors[0]?.column).toBe(1)
    })

    it('errors from multiple paragraphs are all collected', () => {
      const result = parseAndValidate('**bold**\n\n*italic*\n\n`code`', emailRfmConfig)

      expect(result.errors.length).toBe(3)
    })
  })

  describe('multiple errors', () => {
    it('collects all errors in one pass', () => {
      const result = parseAndValidate('# Heading\n\n> Blockquote', emailRfmConfig)

      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })

    it('collects errors from both block and inline violations', () => {
      const result = parseAndValidate('# Heading\n\n**bold text**', emailRfmConfig)

      expect(result.errors.length).toBeGreaterThanOrEqual(2)
    })
  })
})

describe('formatErrors()', () => {
  it('returns null for valid content', () => {
    const { ast } = parse('Hello.')
    const result = validate(ast, emailRfmConfig)

    expect(formatErrors(result)).toBeNull()
  })

  it('returns a numbered list of errors', () => {
    const { ast } = parse('# Heading\n\n> Quote')
    const result = validate(ast, emailRfmConfig)
    const formatted = formatErrors(result)

    expect(formatted).toMatch(/Found \d+ validation error/)
    expect(formatted).toMatch(/1\./)
    expect(formatted).toMatch(/2\./)
  })

  it('includes line numbers in formatted output', () => {
    const { ast } = parse('# Heading')
    const result = validate(ast, emailRfmConfig)
    const formatted = formatErrors(result)

    expect(formatted).toMatch(/\[line \d+/)
  })

  it('includes column numbers in formatted output', () => {
    const { ast } = parse('**bold**')
    const result = validate(ast, emailRfmConfig)
    const formatted = formatErrors(result)

    expect(formatted).toMatch(/col \d+/)
  })

  it('formats a single error correctly', () => {
    const { ast } = parse('# Heading')
    const result = validate(ast, emailRfmConfig)
    const formatted = formatErrors(result)

    expect(formatted).toMatch(/^Found 1 validation error/)
    expect(formatted).toMatch(/1\./)
    expect(formatted).not.toMatch(/2\./)
  })

  it('error count matches number of violations', () => {
    const { ast } = parse('# H1\n\n## H2\n\n### H3')
    const result = validate(ast, emailRfmConfig)
    const formatted = formatErrors(result)

    expect(formatted).toMatch(/Found 3 validation error/)
  })

  it('uses 1 as column fallback when column is absent but line is present', () => {
    const result = {
      valid: false as const,
      errors: [{ path: 'root', message: 'err', line: 3 }],
    }
    const output = formatErrors(result)

    expect(output).toContain('[line 3, col 1]')
  })

  it('omits location info when line is not set', () => {
    const result = {
      valid: false as const,
      errors: [{ path: 'root', message: 'no position info' }],
    }
    const output = formatErrors(result)

    expect(output).not.toContain('[line')
  })
})

describe('custom FlavorConfig', () => {
  it('accepts a user-defined config without touching validator source', async () => {
    const { FontAttrsSchema } = await import('../schemas/font.js')
    const customConfig = {
      name: 'Custom',
      allowedBlockNodes: new Set<string>(),
      allowedTextDirectives: new Map([['font', FontAttrsSchema]] as const),
      allowedLeafDirectives: new Map<string, null>(),
      allowedContainerDirectives: new Map<string, null>(),
    }
    const { ast } = parse(':font[hi]{font-weight="bold"}')
    const result = validate(ast, customConfig)

    expect(result.valid).toBe(true)
  })

  it('rejects a directive not listed in a custom config', () => {
    const customConfig = {
      name: 'Custom',
      allowedBlockNodes: new Set<string>(),
      allowedTextDirectives: new Map<string, null>(),
      allowedLeafDirectives: new Map<string, null>(),
      allowedContainerDirectives: new Map<string, null>(),
    }
    const { ast } = parse(':font[hi]{font-weight="bold"}')
    const result = validate(ast, customConfig)

    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toMatch(/:font/)
  })

  it('uses the config name in error messages', () => {
    const customConfig = {
      name: 'My Flavor',
      allowedBlockNodes: new Set<string>(),
      allowedTextDirectives: new Map<string, null>(),
      allowedLeafDirectives: new Map<string, null>(),
      allowedContainerDirectives: new Map<string, null>(),
    }
    const { ast } = parse('# Heading')
    const result = validate(ast, customConfig)

    expect(result.errors[0]?.message).toMatch(/My Flavor/)
  })

  it('handles a directive with a null attributes object (normaliseAttrs null guard)', () => {
    // Construct an AST where attributes is null (not {} — which remark-directive uses
    // for brace-less directives). The null path exists defensively in the type.
    const ast = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'textDirective',
              name: 'font',
              attributes: null,
              children: [{ type: 'text', value: 'text' }],
            },
          ],
        },
      ],
    } as ReturnType<typeof parse>['ast']
    const result = validate(ast, emailRfmConfig)

    // null attrs → normaliseAttrs returns {} → Zod fails (no attributes set)
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toMatch(/at least one attribute/)
  })

  it('normalises a null attribute value to undefined (normaliseAttrs ?? branch)', () => {
    // Construct an AST node with a null attribute value directly — remark-directive
    // uses empty strings for boolean attrs, but the null path is valid per the type.
    const ast = {
      type: 'root',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'textDirective',
              name: 'font',
              attributes: { 'font-weight': null },
              children: [{ type: 'text', value: 'text' }],
            },
          ],
        },
      ],
    } as ReturnType<typeof parse>['ast']
    const result = validate(ast, emailRfmConfig)

    // null attr → undefined → Zod sees no attrs set → fails the refine
    expect(result.valid).toBe(false)
    expect(result.errors[0]?.message).toMatch(/at least one attribute/)
  })

  it('accepts a text directive registered with null schema (no Zod validation)', () => {
    const customConfig = {
      name: 'Custom',
      allowedBlockNodes: new Set<string>(),
      allowedTextDirectives: new Map<string, null>([['noop', null]]),
      allowedLeafDirectives: new Map<string, null>(),
      allowedContainerDirectives: new Map<string, null>(),
    }
    const { ast } = parse(':noop[text]')
    const result = validate(ast, customConfig)

    expect(result.valid).toBe(true)
  })

  it('accepts a container directive registered with null schema (no Zod validation)', () => {
    const customConfig = {
      name: 'Custom',
      allowedBlockNodes: new Set<string>(),
      allowedTextDirectives: new Map<string, null>(),
      allowedLeafDirectives: new Map<string, null>(),
      allowedContainerDirectives: new Map<string, null>([['noop', null]]),
    }
    const { ast } = parse(':::noop{}\ntext\n:::')
    const result = validate(ast, customConfig)

    expect(result.valid).toBe(true)
  })
})
