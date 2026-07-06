import { describe, expect, it } from 'vitest'

import {
  createCustomField,
  createFont,
  createLink,
  createLoopValue,
} from './email-rfm-builders.js'

describe('createCustomField', () => {
  it('produces a CustomField placeholder with group.name joined and id in value + original', () => {
    expect(
      createCustomField({ group: 'Subscriber', name: 'FirstName', id: 200001 }),
    ).toBe(
      '::placeholder{type="CustomField" name="Subscriber.FirstName" value="200001" original="[CustomField:200001]"}',
    )
  })

  it('supports multi-segment group strings verbatim', () => {
    expect(
      createCustomField({ group: 'Order', name: 'TotalPrice', id: 200005 }),
    ).toBe(
      '::placeholder{type="CustomField" name="Order.TotalPrice" value="200005" original="[CustomField:200005]"}',
    )
  })

  it('omits the leading dot when group is an empty string', () => {
    expect(createCustomField({ group: '', name: 'Email', id: 42 })).toBe(
      '::placeholder{type="CustomField" name="Email" value="42" original="[CustomField:42]"}',
    )
  })
})

describe('createLoopValue', () => {
  it('reuses the key for value and index when no index supplied', () => {
    expect(createLoopValue({ key: 'name' })).toBe(
      '::loop-value{original="[LoopValue:name]" value="name" index="name"}',
    )
  })

  it('respects a distinct index override', () => {
    expect(createLoopValue({ key: 'content.1', index: 'row-1' })).toBe(
      '::loop-value{original="[LoopValue:content.1]" value="content.1" index="row-1"}',
    )
  })
})

describe('createLink', () => {
  it('emits href-only link when no optional attrs are supplied', () => {
    expect(createLink({ label: 'Click me', href: 'https://example.com' })).toBe(
      ':link[Click me]{href="https://example.com"}',
    )
  })

  it('includes target and no-tracked when supplied', () => {
    expect(
      createLink({
        label: 'View in Browser',
        href: '[Link:WebBrowser]',
        target: '_blank',
        noTracked: true,
      }),
    ).toBe(
      ':link[View in Browser]{href="[Link:WebBrowser]" target="_blank" no-tracked="true"}',
    )
  })

  it('omits no-tracked when the flag is false', () => {
    expect(
      createLink({
        label: 'Plain',
        href: 'https://example.com',
        target: '_blank',
        noTracked: false,
      }),
    ).toBe(':link[Plain]{href="https://example.com" target="_blank"}')
  })
})

describe('createFont', () => {
  it('produces an empty attr block when no style options are supplied', () => {
    expect(createFont({ content: 'hello' })).toBe(':font[hello]{}')
  })

  it('emits kebab-cased attr names for each style option', () => {
    expect(
      createFont({
        content: 'styled',
        fontSize: '12px',
        color: '#333333',
        textDecoration: 'underline',
        fontFamily: "'Helvetica', sans-serif",
        fontWeight: '700',
        fontStyle: 'italic',
        letterSpacing: '0.02em',
        lineHeight: '140%',
        textTransform: 'uppercase',
      }),
    ).toBe(
      ':font[styled]{font-size="12px" color="#333333" text-decoration="underline" font-family="\'Helvetica\', sans-serif" font-weight="700" font-style="italic" letter-spacing="0.02em" line-height="140%" text-transform="uppercase"}',
    )
  })
})

describe('nested composition — font inside link', () => {
  it('supports createFont output as the label of createLink', () => {
    const nested = createLink({
      label: createFont({ content: 'View in Browser', textDecoration: 'underline' }),
      href: '[Link:WebBrowser]',
      target: '_blank',
      noTracked: true,
    })

    expect(nested).toBe(
      ':link[:font[View in Browser]{text-decoration="underline"}]{href="[Link:WebBrowser]" target="_blank" no-tracked="true"}',
    )
  })
})
