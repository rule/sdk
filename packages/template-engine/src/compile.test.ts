import { describe, expect, it } from 'vitest'

import {
  compileTemplate,
  customField,
  loopValue,
  type TemplateRefSerializer,
} from './index.js'

describe('compileTemplate — end-to-end', () => {
  it('compiles a trivial static template', () => {
    const { xml } = compileTemplate({
      template: '<a>hello</a>',
      copy: {},
      context: {},
    })

    expect(xml).toBe('<a>hello</a>')
  })

  it('emits a <?copy?> message into text', () => {
    const { xml } = compileTemplate({
      template: '<a><?copy greeting?></a>',
      copy: { greeting: 'Hello' },
      context: {},
    })

    expect(xml).toBe('<a>Hello</a>')
  })

  it('binds a data path into an attribute via @{…}', () => {
    const { xml } = compileTemplate({
      template: '<a href="@{user.url}">x</a>',
      copy: {},
      context: { user: { url: 'https://example.com' } },
    })

    expect(xml).toBe('<a href="https://example.com">x</a>')
  })

  it('supports mixed literal + binding inside an attribute', () => {
    const { xml } = compileTemplate({
      template: '<a href="/u/@{id}?q=@{query}">x</a>',
      copy: {},
      context: { id: '42', query: 'hi' },
    })

    expect(xml).toBe('<a href="/u/42?q=hi">x</a>')
  })

  it('looks up a dotted message key', () => {
    const { xml } = compileTemplate({
      template: '<h><?copy hero.title?></h>',
      copy: { hero: { title: 'Welcome' } },
      context: {},
    })

    expect(xml).toBe('<h>Welcome</h>')
  })

  it('substitutes <?copy?> params into message placeholders', () => {
    const { xml } = compileTemplate({
      template: '<h><?copy greetingHeading firstNameLabel=fieldNames.firstName?></h>',
      copy: { greetingHeading: 'Hi {{firstNameLabel}}' },
      context: { fieldNames: { firstName: 'FirstName' } },
    })

    expect(xml).toBe('<h>Hi FirstName</h>')
  })

  it('compiles a canonical v3 example', () => {
    const template = `<title><?copy hero.title?></title>
<?if user.premium?><premium-banner color="@{theme.primary}"/><?else?><regular-banner/><?endif?>`
    const { xml } = compileTemplate({
      template,
      copy: { hero: { title: 'Welcome' } },
      context: { user: { premium: true }, theme: { primary: '#4F46E5' } },
    })

    expect(xml).toContain('<title>Welcome</title>')
    expect(xml).toContain('<premium-banner color="#4F46E5"/>')
    expect(xml).not.toContain('<regular-banner')
  })

  it('renders `{ xml }` shape — object return', () => {
    const result = compileTemplate({
      template: '<a>x</a>',
      copy: {},
      context: {},
    })

    expect(Object.keys(result)).toEqual(['xml'])
    expect(typeof result.xml).toBe('string')
  })

  it('handles nested elements + attribute bindings', () => {
    const { xml } = compileTemplate({
      template: '<wrap><a id="@{x}"><b><?copy y?></b></a></wrap>',
      copy: { y: 'two' },
      context: { x: '1' },
    })

    expect(xml).toBe('<wrap><a id="1"><b>two</b></a></wrap>')
  })

  it('passes through self-closing tags', () => {
    const { xml } = compileTemplate({
      template: '<a><br/><c/></a>',
      copy: {},
      context: {},
    })

    expect(xml).toBe('<a><br/><c/></a>')
  })

  it('preserves static text verbatim, including literal braces', () => {
    const { xml } = compileTemplate({
      template: '<a>Hello, "world" — & ::placeholder{name="x"}</a>',
      copy: {},
      context: {},
    })

    expect(xml).toBe('<a>Hello, "world" — & ::placeholder{name="x"}</a>')
  })

  it('strips XML comments from output', () => {
    const { xml } = compileTemplate({
      template: '<a><!-- a note -->hi</a>',
      copy: {},
      context: {},
    })

    expect(xml).toBe('<a>hi</a>')
  })

  it('emits attribute with empty value when value is omitted', () => {
    const { xml } = compileTemplate({
      template: '<a disabled>x</a>',
      copy: {},
      context: {},
    })

    expect(xml).toBe('<a disabled="">x</a>')
  })

  it('rejects @{…} in text content (spec §5.1)', () => {
    expect(() =>
      compileTemplate({
        template: '<a>@{foo}</a>',
        copy: {},
        context: { foo: 'x' },
      }),
    ).toThrow(/'@\{…\}' binding is not valid in text content/)
  })
})

/**
 * RFM-atom-strategy scenarios.
 *
 * The canonical shopify use case: a translation message carries the
 * full RFM `::placeholder{…}` atom with `{{paramName}}` placeholders
 * for the field path + value. The template hands in the dynamic
 * pieces via `<?copy?>` params. The compiler's context-aware escape
 * rules (text-node context: escape `& < >`, preserve `" '`) ensure
 * the RFM atom's `"` delimiters survive intact.
 */
describe('RFM atom strategy', () => {
  it('produces a literal `::placeholder{…}` atom with dynamic name + value', () => {
    const { xml } = compileTemplate({
      template:
        '<rc-text><?copy welcome name=fieldNames.firstName value=customFieldsById.firstName?></rc-text>',
      copy: {
        welcome:
          'Hello, ::placeholder{name="{{name}}" value="{{value}}" type="CustomField"}',
      },
      context: {
        fieldNames: { firstName: 'Subscriber.FirstName' },
        customFieldsById: { firstName: 169233 },
      },
    })

    expect(xml).toBe(
      '<rc-text>Hello, ::placeholder{name="Subscriber.FirstName" value="169233" type="CustomField"}</rc-text>',
    )
  })

  it('preserves RFM atom when nested inside `<?if?>`', () => {
    const { xml } = compileTemplate({
      template: `<?if show?><rc-text><?copy hi name=fieldNames.firstName value=customFieldsById.firstName?></rc-text><?endif?>`,
      copy: { hi: '::placeholder{name="{{name}}" value="{{value}}"}' },
      context: {
        show: true,
        fieldNames: { firstName: 'Subscriber.FirstName' },
        customFieldsById: { firstName: 42 },
      },
    })

    expect(xml).toContain('::placeholder{name="Subscriber.FirstName" value="42"}')
  })

  it('emits a loop-value atom per iteration', () => {
    const { xml } = compileTemplate({
      template:
        '<?for let item of items?><rc-text><?copy line key=item.key?></rc-text><?endfor?>',
      copy: { line: '::loop-value{original="[LoopValue:{{key}}.1]" value="{{key}}" index="1"}' },
      context: {
        items: [{ key: 'name' }, { key: 'quantity' }],
      },
    })

    expect(xml).toContain(
      '::loop-value{original="[LoopValue:name.1]" value="name" index="1"}',
    )
    expect(xml).toContain(
      '::loop-value{original="[LoopValue:quantity.1]" value="quantity" index="1"}',
    )
  })
})

/**
 * TemplateRef serialization — typed references flowing through the
 * context as objects get serialized into placeholder strings at
 * render time, with no caller involvement.
 */
describe('TemplateRef serialization', () => {
  it('serializes a CustomFieldRef inside a <?copy?> param', () => {
    const { xml } = compileTemplate({
      template: '<rc-heading><?copy greet first=recipient.firstName?></rc-heading>',
      copy: { greet: 'Hi {{first}}' },
      context: {
        recipient: { firstName: customField('Subscriber', 'FirstName', 200001) },
      },
    })

    expect(xml).toBe(
      '<rc-heading>Hi ::placeholder{type="CustomField" name="Subscriber.FirstName" value="200001" original="[CustomField:200001]"}</rc-heading>',
    )
  })

  it('serializes a LoopValueRef inside a <?copy?> param', () => {
    const { xml } = compileTemplate({
      template: '<rc-text><?copy line value=product.itemName?></rc-text>',
      copy: { line: '{{value}}' },
      context: { product: { itemName: loopValue('name') } },
    })

    expect(xml).toContain(
      '::loop-value{original="[LoopValue:name.1]" value="name" index="1"}',
    )
  })

  it('serializes a TemplateRef inside an @{…} attribute binding', () => {
    const { xml } = compileTemplate({
      template: '<rc-text data-field="@{recipient.firstName}"/>',
      copy: {},
      context: {
        recipient: { firstName: customField('Subscriber', 'FirstName', 42) },
      },
    })

    // Attribute escape turns `"` into `&quot;` in the serialized output.
    expect(xml).toContain('data-field="::placeholder{type=&quot;CustomField&quot;')
    expect(xml).toContain('[CustomField:42]')
  })

  it('lets a path traverse into a ref (e.g. .id) before serialization', () => {
    // `cart.items.id` drills into the ref — resolves to the raw id,
    // no serialization happens because the result is a number, not a
    // ref. Useful for rc-loop which wants the bare id, not the atom.
    const { xml } = compileTemplate({
      template: '<rc-loop loop-value="@{cart.items.id}"/>',
      copy: {},
      context: {
        cart: { items: customField('Order', 'Products', 200014) },
      },
    })

    expect(xml).toBe('<rc-loop loop-value="200014"/>')
  })

  it('honours a caller-supplied custom serializer', () => {
    const upperSerializer: TemplateRefSerializer = {
      serializeCustomField: (r) => `CF(${r.group}.${r.name}=${String(r.id)})`,
      serializeLoopValue: (r) => `LV(${r.key})`,
    }

    const { xml } = compileTemplate({
      template: '<a><?copy m a=x b=y?></a>',
      copy: { m: '{{a}}/{{b}}' },
      context: {
        x: customField('G', 'N', 1),
        y: loopValue('k'),
      },
      serializer: upperSerializer,
    })

    expect(xml).toBe('<a>CF(G.N=1)/LV(k)</a>')
  })

  it('non-ref objects still fall through to JSON.stringify', () => {
    // Sanity check: an ordinary object in the context does NOT get
    // treated as a ref — hits the JSON fallback as before.
    const { xml } = compileTemplate({
      template: '<a title="@{obj}"/>',
      copy: {},
      context: { obj: { k: 1 } },
    })

    expect(xml).toBe('<a title="{&quot;k&quot;:1}"/>')
  })
})
