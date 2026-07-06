/**
 * JSON Schema Draft 2020-12 definition for SMS content JSON.
 *
 * The SMS content model is a flat sequence of top-level nodes:
 * `message` (text segments), `link` (hyperlinks), and `placeholder` (dynamic values).
 * There are no intermediate block nodes or marks.
 *
 * @internal
 */
export const smsContentJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'sms-content-json',
  $ref: '#/$defs/sms',

  $defs: {
    sms: {
      type: 'object',
      properties: {
        type: { const: 'sms' },
        content: {
          type: 'array',
          items: { $ref: '#/$defs/node' },
        },
      },
      required: ['type', 'content'],
      additionalProperties: false,
    },

    node: {
      type: 'object',
      oneOf: [
        { $ref: '#/$defs/message' },
        { $ref: '#/$defs/link' },
        { $ref: '#/$defs/placeholder' },
      ],
    },

    message: {
      type: 'object',
      properties: {
        type: { const: 'message' },
        text: { type: 'string' },
        attrs: {
          type: 'object',
          properties: {
            'is-unsubscribe': { const: true },
          },
          required: ['is-unsubscribe'],
          additionalProperties: false,
        },
      },
      required: ['type', 'text'],
      additionalProperties: false,
    },

    link: {
      type: 'object',
      properties: {
        type: { const: 'link' },
        text: { type: 'string', minLength: 1 },
        attrs: {
          type: 'object',
          properties: {
            track: { type: 'boolean' },
            shorten: { type: 'boolean' },
          },
          required: ['track', 'shorten'],
          additionalProperties: false,
          if: { properties: { track: { const: true } } },
          then: { properties: { shorten: { const: true } } },
        },
      },
      required: ['type', 'text', 'attrs'],
      additionalProperties: false,
    },

    placeholder: {
      type: 'object',
      properties: {
        type: { const: 'placeholder' },
        attrs: {
          type: 'object',
          oneOf: [
            {
              // Normal placeholder: CustomField, Subscriber, User, RemoteContent, Date
              properties: {
                type: { enum: ['CustomField', 'Subscriber', 'User', 'RemoteContent', 'Date'] },
                original: { type: 'string' },
                name: { type: 'string' },
                value: { type: ['string', 'number', 'null'] },
                'max-length': { type: ['string', 'null'] },
              },
              required: ['type', 'original', 'name', 'value'],
              additionalProperties: false,
            },
            {
              // Unsubscribe placeholder: type Link, is-unsubscribe: true required
              properties: {
                type: { const: 'Link' },
                original: { type: 'string' },
                name: { type: 'string' },
                value: { type: ['string', 'number', 'null'] },
                'is-unsubscribe': { const: true },
              },
              required: ['type', 'original', 'name', 'value', 'is-unsubscribe'],
              additionalProperties: false,
            },
          ],
        },
      },
      required: ['type', 'attrs'],
      additionalProperties: false,
    },
  },
} as const
