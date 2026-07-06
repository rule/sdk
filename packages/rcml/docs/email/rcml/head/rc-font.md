# `<rc-font>`

Declares a custom web font to embed via `@font-face`, making it available to all content nodes in the email.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `name` | — | String | `Inter` | Font family name used to reference the font in style attributes. |
| `href` | — | URL | `https://fonts.googleapis.com/css2?family=Inter:wght@400;700` | URL of the font stylesheet (e.g. Google Fonts CSS URL). |

## Children

None.

## Parents

- [`<rc-head>`](../root/rc-head.md)

## JSON

```json
{
  "tagName": "rc-font",
  "attributes": {
    "name": "Inter",
    "href": "https://fonts.googleapis.com/css2?family=Inter:wght@400;700"
  }
}
```

## XML

```xml
<rc-font name="Inter" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700"></rc-font>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createFontElement } from '@rule/rcml';

createFontElement({
  attrs: {
    name: 'Inter',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;700',
  },
})
```

## API Reference

- [createFontElement](/api/rcml/src/functions/createFontElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
