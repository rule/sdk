import { describe, it, expect } from 'vitest'
import {
  createCustomFieldPlaceholder,
  createDatePlaceholder,
  createLinkPlaceholder,
  createPlaceholderNode,
  createRemoteContentPlaceholder,
  createSubscriberPlaceholder,
  createUserPlaceholder,
} from './placeholders.js'
import { smsRfmToJson } from '../sms-rfm-to-json.js'
import type { SmsPlaceholderNode } from '../content/json-validator/types.js'

describe('createPlaceholderNode (generic)', () => {
  it('defaults value to null and omits max-length when not provided', () => {
    expect(
      createPlaceholderNode({
        type: 'Subscriber',
        original: '[Subscriber:FirstName]',
        name: 'FirstName',
      }),
    ).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'Subscriber',
        name: 'FirstName',
        original: '[Subscriber:FirstName]',
        value: null,
      },
    })
  })

  it('passes through value and maxLength when provided', () => {
    expect(
      createPlaceholderNode({
        type: 'Subscriber',
        original: '[Subscriber:email]',
        name: 'Email',
        value: 'jane@example.com',
        maxLength: '20',
      }),
    ).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'Subscriber',
        name: 'Email',
        original: '[Subscriber:email]',
        value: 'jane@example.com',
        'max-length': '20',
      },
    })
  })
})

describe('createSubscriberPlaceholder', () => {
  it('builds a [Subscriber:<field>] node with name defaulting to field', () => {
    expect(createSubscriberPlaceholder({ field: 'FirstName' })).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'Subscriber',
        name: 'FirstName',
        original: '[Subscriber:FirstName]',
        value: null,
      },
    })
  })

  it('matches the parser output shape exactly (deep-equals what smsRfmToJson produces)', () => {
    const built = createSubscriberPlaceholder({ field: 'FirstName' })
    const parsed = smsRfmToJson('[Subscriber:FirstName]').content[0]

    expect(parsed).toEqual(built)
  })

  it('respects an explicit name override', () => {
    expect(
      createSubscriberPlaceholder({ field: 'email', name: 'Email' }),
    ).toMatchObject({
      attrs: { name: 'Email', original: '[Subscriber:email]' },
    })
  })
})

describe('createUserPlaceholder', () => {
  it('builds a [User:<field>] node', () => {
    expect(createUserPlaceholder({ field: 'CompanyName' })).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'User',
        name: 'CompanyName',
        original: '[User:CompanyName]',
        value: null,
      },
    })
  })
})

describe('createCustomFieldPlaceholder', () => {
  it('joins group and name with a dot', () => {
    expect(
      createCustomFieldPlaceholder({ group: 'Order', name: 'Total' }),
    ).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'CustomField',
        name: 'Order.Total',
        original: '[CustomField:Order.Total]',
        value: null,
      },
    })
  })

  it('appends ::N suffix and sets max-length when maxLength is given', () => {
    expect(
      createCustomFieldPlaceholder({ group: 'Order', name: 'Total', maxLength: 20 }),
    ).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'CustomField',
        name: 'Order.Total',
        original: '[CustomField:Order.Total::20]',
        value: null,
        'max-length': '20',
      },
    })
  })

  it('matches parser output for the no-truncation case', () => {
    const built = createCustomFieldPlaceholder({ group: 'Order', name: 'Total' })
    const parsed = smsRfmToJson('[CustomField:Order.Total]').content[0]

    expect(parsed).toEqual(built)
  })
})

describe('createDatePlaceholder — every source variant', () => {
  it('handles literal "now"', () => {
    expect(
      createDatePlaceholder({ source: 'now', format: 'Y-m-d' }),
    ).toMatchObject({
      attrs: { type: 'Date', name: 'now', original: '[Date:now::Y-m-d]' },
    })
  })

  it('handles literal "tomorrow"', () => {
    expect(
      createDatePlaceholder({ source: 'tomorrow', format: 'd.m.Y' }),
    ).toMatchObject({ attrs: { original: '[Date:tomorrow::d.m.Y]' } })
  })

  it('handles literal "yesterday"', () => {
    expect(
      createDatePlaceholder({ source: 'yesterday', format: 'm/d/Y' }),
    ).toMatchObject({ attrs: { original: '[Date:yesterday::m/d/Y]' } })
  })

  it('handles { kind: "days-from-now", count }', () => {
    expect(
      createDatePlaceholder({
        source: { kind: 'days-from-now', count: 7 },
        format: 'Y-m-d',
      }),
    ).toMatchObject({
      attrs: {
        original: '[Date:in-7-days::Y-m-d]',
        name: 'In 7 days',
      },
    })
  })

  it('handles { kind: "days-ago", count }', () => {
    expect(
      createDatePlaceholder({
        source: { kind: 'days-ago', count: 3 },
        format: 'm-d-Y',
      }),
    ).toMatchObject({
      attrs: {
        original: '[Date:3-days-ago::m-d-Y]',
        name: '3 days ago',
      },
    })
  })

  it('handles { kind: "custom-field", group, name }', () => {
    expect(
      createDatePlaceholder({
        source: { kind: 'custom-field', group: 'Order', name: 'CreatedAt' },
        format: 'Y-m-d',
      }),
    ).toMatchObject({
      attrs: {
        original: '[Date:[CustomField:Order.CreatedAt]::Y-m-d]',
        name: 'Order.CreatedAt',
      },
    })
  })

  it('respects an explicit name override', () => {
    expect(
      createDatePlaceholder({
        source: 'tomorrow',
        format: 'd.m.Y',
        name: 'Offer expires',
      }),
    ).toMatchObject({ attrs: { name: 'Offer expires' } })
  })
})

describe('createDatePlaceholder — every format value', () => {
  const formats = ['Y-m-d', 'd.m.Y', 'm-d-Y', 'm/d/Y', 'd/m/Y'] as const

  it.each(formats)('produces a well-formed token for format %s', (format) => {
    const node = createDatePlaceholder({ source: 'now', format })

    expect(node.attrs.original).toBe(`[Date:now::${format}]`)
  })
})

describe('createRemoteContentPlaceholder', () => {
  it('builds a [RemoteContent:<url>] node with name "RemoteContent"', () => {
    expect(
      createRemoteContentPlaceholder({ url: 'https://api.example.com/promo' }),
    ).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'RemoteContent',
        name: 'RemoteContent',
        original: '[RemoteContent:https://api.example.com/promo]',
        value: null,
      },
    })
  })

  it('preserves nested tokens in the URL verbatim', () => {
    const url = 'https://api.example.com/offer?id=[CustomField:Order.Id]&email=[Subscriber:email]'

    expect(createRemoteContentPlaceholder({ url }).attrs.original).toBe(
      `[RemoteContent:${url}]`,
    )
  })
})

describe('createLinkPlaceholder', () => {
  const linkTypes = [
    'Optin',
    'Unsubscribe',
    'WebBrowser',
    'ShareLink',
    'Signup',
  ] as const

  it.each(linkTypes)('builds a [Link:%s] node', (link) => {
    expect(createLinkPlaceholder({ link })).toEqual<SmsPlaceholderNode>({
      type: 'placeholder',
      attrs: {
        type: 'Link',
        name: link,
        original: `[Link:${link}]`,
        value: null,
      },
    })
  })

  it('matches parser output shape exactly', () => {
    const built = createLinkPlaceholder({ link: 'Unsubscribe' })
    const parsed = smsRfmToJson('[Link:Unsubscribe]').content[0]

    expect(parsed).toEqual(built)
  })
})
