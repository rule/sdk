import { Ajv2020 } from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'
import { RcmlTagNamesEnum } from '../schema/index.js'
import { RCML_JSON_SCHEMA } from './json-schema.js'

/**
 * Unit tests for the generated JSON Schema. These assert the schema's
 * top-level shape, confirm coverage of every tag, and exercise a smoke-test
 * compile through AJV. Deeper behavioural coverage (error codes, paths)
 * lives in `./ajv-validate.test.ts`.
 */

describe('RCML_JSON_SCHEMA — top-level shape', () => {
  it('is a Draft 2020-12 schema', () => {
    expect(RCML_JSON_SCHEMA['$schema']).toBe(
      'https://json-schema.org/draft/2020-12/schema',
    )
  })

  it('carries a stable `$id`', () => {
    expect(RCML_JSON_SCHEMA['$id']).toBe('rcml-email-template')
  })

  it('roots at `#/$defs/rcml`', () => {
    expect(RCML_JSON_SCHEMA['$ref']).toBe('#/$defs/rcml')
  })

  it('exposes a `$defs` object', () => {
    expect(typeof RCML_JSON_SCHEMA['$defs']).toBe('object')
    expect(RCML_JSON_SCHEMA['$defs']).not.toBeNull()
  })
})

describe('RCML_JSON_SCHEMA — $defs coverage', () => {
  it('contains an entry for every RcmlTagNamesEnum value', () => {
    const $defs = RCML_JSON_SCHEMA['$defs'] as Record<string, unknown>

    for (const tagName of Object.values(RcmlTagNamesEnum)) {
      expect($defs[tagName]).toBeDefined()
    }
  })
})

describe('RCML_JSON_SCHEMA — rc-section fragment', () => {
  it('constrains rc-section to at most 20 columns', () => {
    const $defs = RCML_JSON_SCHEMA['$defs'] as Record<string, Record<string, unknown>>
    const section = $defs['rc-section'] as Record<string, unknown>
    const properties = section['properties'] as Record<string, Record<string, unknown>>
    const children = properties['children'] as Record<string, unknown>

    expect(children['type']).toBe('array')
    expect(children['maxItems']).toBe(20)
  })

  it('pins rc-section `tagName` to a const', () => {
    const $defs = RCML_JSON_SCHEMA['$defs'] as Record<string, Record<string, unknown>>
    const section = $defs['rc-section'] as Record<string, unknown>
    const properties = section['properties'] as Record<string, Record<string, unknown>>

    expect(properties['tagName']).toEqual({ const: 'rc-section' })
  })

  it('rejects unknown attributes on rc-section (additionalProperties: false)', () => {
    const $defs = RCML_JSON_SCHEMA['$defs'] as Record<string, Record<string, unknown>>
    const section = $defs['rc-section'] as Record<string, unknown>
    const properties = section['properties'] as Record<string, Record<string, unknown>>
    const attributes = properties['attributes'] as Record<string, unknown>

    expect(attributes['additionalProperties']).toBe(false)
  })
})

describe('RCML_JSON_SCHEMA — AJV compile smoke test', () => {
  it('compiles cleanly under strict mode with allErrors + allowUnionTypes', () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true, discriminator: true })

    expect(() => ajv.compile(RCML_JSON_SCHEMA)).not.toThrow()
  })

  it('validates a minimal document', () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true, discriminator: true })
    const validate = ajv.compile(RCML_JSON_SCHEMA)
    const doc = {
      tagName: 'rcml',
      children: [
        { tagName: 'rc-head', children: [] },
        { tagName: 'rc-body', children: [] },
      ],
    }

    expect(validate(doc)).toBe(true)
  })

  it('rejects a totally wrong shape', () => {
    const ajv = new Ajv2020({ strict: true, allErrors: true, allowUnionTypes: true, discriminator: true })
    const validate = ajv.compile(RCML_JSON_SCHEMA)

    expect(validate({ notRcml: true })).toBe(false)
  })
})
