# Theme

A theme is a set of brand values — colours, logo URL, social-link URLs, and font styles — that `applyTheme()` stamps onto an RCML document in a single call. The result is a predictable set of default-attribute nodes and named `rc-class` entries written into `rc-head`.

Without a theme, every brand colour, font setting, and social link URL would need to be set on individual elements scattered across every template. Changing a primary colour would mean finding every button in every template and updating it. A theme collects brand values into a single object. `applyTheme()` writes those values into `rc-head` as default-attribute nodes and named classes — elements then inherit those values automatically.

The mechanism works in two ways. Default-attribute nodes inside `rc-attributes` act like CSS property defaults: an `rc-button` node with `background-color: "#05CC87"` makes every button in the document inherit that colour unless it overrides it explicitly. Named classes (`rcml-brand-color`, `rcml-p-style`, etc.) require elements to opt in via their `rc-class` attribute, which gives more targeted control over which elements use the branded typography or accent colour.

## What `rc-head` looks like after `applyTheme()`

After calling `applyTheme(doc, theme)`, `rc-head` always contains these nodes in this fixed order:

```
rc-head
  ├── rc-brand-style                       ← always first
  ├── rc-attributes                        ← always second
  │    ├── rc-body                         ← background color (background slot)
  │    ├── rc-section                      ← body color (body slot)
  │    ├── rc-button                       ← primary color (primary slot)
  │    ├── rc-class "rcml-brand-color"     ← secondary color
  │    ├── rc-class "rcml-logo-style"      ← logo URL (only if a logo is set)
  │    ├── rc-class "rcml-p-style"         ┐
  │    ├── rc-class "rcml-h1-style"        │
  │    ├── rc-class "rcml-h2-style"        │ font-style slots
  │    ├── rc-class "rcml-h3-style"        │
  │    ├── rc-class "rcml-h4-style"        │
  │    ├── rc-class "rcml-label-style"     ┘
  │    └── rc-social                       ← social link URLs (6 children, always present)
  └── rc-font ...                          ← one per web font (absent if no custom fonts)
```

Here is a complete annotated example of the resulting `rc-head`:

```jsonc
{
  "tagName": "rc-head",
  "children": [

    // ─── ① Brand style reference — always first ────────────────────────────
    {
      "tagName": "rc-brand-style",
      "attributes": { "brand-style-id": 10457 }
    },

    // ─── ② rc-attributes — always second ───────────────────────────────────
    {
      "tagName": "rc-attributes",
      "children": [

        // Color: background slot → default background-color for every rc-body
        { "tagName": "rc-body",    "attributes": { "background-color": "#F3F3F3" } },

        // Color: body slot → default background-color for every rc-section
        { "tagName": "rc-section", "attributes": { "background-color": "#FFFFFF" } },

        // Color: primary slot → default background-color for every rc-button
        { "tagName": "rc-button",  "attributes": { "background-color": "#05CC87" } },

        // Color: secondary slot — apply manually with rc-class="rcml-brand-color"
        { "tagName": "rc-class", "attributes": { "name": "rcml-brand-color", "background-color": "#F6F8F9" } },

        // Image: logo slot — also patches src onto body rc-logo elements (see below)
        { "tagName": "rc-class", "attributes": { "name": "rcml-logo-style", "src": "https://cdn.example.com/logo.png" } },

        // Font style: p slot
        {
          "tagName": "rc-class",
          "attributes": {
            "name": "rcml-p-style",
            "font-family": "'Helvetica', sans-serif",
            "font-size": "16px", "color": "#0F0F1F", "line-height": "120%",
            "letter-spacing": "0em", "font-style": "normal", "font-weight": "400", "text-decoration": "none"
          }
        },

        // Font style: h1 slot
        {
          "tagName": "rc-class",
          "attributes": {
            "name": "rcml-h1-style",
            "font-family": "'Helvetica', sans-serif",
            "font-size": "36px", "color": "#0F0F1F", "line-height": "120%",
            "letter-spacing": "0em", "font-style": "normal", "font-weight": "700", "text-decoration": "none"
          }
        },

        // Font style: h2 slot
        {
          "tagName": "rc-class",
          "attributes": {
            "name": "rcml-h2-style",
            "font-family": "'Helvetica', sans-serif",
            "font-size": "28px", "color": "#0F0F1F", "line-height": "120%",
            "letter-spacing": "0em", "font-style": "normal", "font-weight": "700", "text-decoration": "none"
          }
        },

        // Font style: h3 slot
        {
          "tagName": "rc-class",
          "attributes": {
            "name": "rcml-h3-style",
            "font-family": "'Helvetica', sans-serif",
            "font-size": "24px", "color": "#0F0F1F", "line-height": "120%",
            "letter-spacing": "0em", "font-style": "normal", "font-weight": "700", "text-decoration": "none"
          }
        },

        // Font style: h4 slot
        {
          "tagName": "rc-class",
          "attributes": {
            "name": "rcml-h4-style",
            "font-family": "'Helvetica', sans-serif",
            "font-size": "18px", "color": "#0F0F1F", "line-height": "120%",
            "letter-spacing": "0em", "font-style": "normal", "font-weight": "700", "text-decoration": "none"
          }
        },

        // Font style: label slot (note: default color is #FFFFFF, not #0F0F1F)
        {
          "tagName": "rc-class",
          "attributes": {
            "name": "rcml-label-style",
            "font-family": "'Helvetica', sans-serif",
            "font-size": "14px", "color": "#FFFFFF", "line-height": "120%",
            "letter-spacing": "0em", "font-style": "normal", "font-weight": "400", "text-decoration": "none"
          }
        },

        // Social links — always exactly 6 children, one per network slot
        {
          "tagName": "rc-social",
          "children": [
            { "tagName": "rc-social-element", "attributes": { "name": "facebook",  "href": "https://facebook.com/yourbrand" } },
            { "tagName": "rc-social-element", "attributes": { "name": "instagram", "href": "https://instagram.com/yourbrand" } },
            { "tagName": "rc-social-element", "attributes": { "name": "linkedin",  "href": "https://linkedin.com/company/yourbrand" } },
            { "tagName": "rc-social-element", "attributes": { "name": "tiktok",    "href": "https://tiktok.com/@yourbrand" } },
            { "tagName": "rc-social-element", "attributes": { "name": "x",         "href": "https://x.com/yourbrand" } },
            { "tagName": "rc-social-element", "attributes": { "name": "web",       "href": "https://example.com" } }
          ]
        }
      ]
    },

    // ─── ③ Web font declarations — one per font, after rc-attributes ────────
    // Absent when no custom fonts are included in the theme.
    {
      "tagName": "rc-font",
      "attributes": { "name": "'Lato'", "href": "https://fonts.googleapis.com/css2?family=Lato" }
    }

  ]
}
```

## Logo propagation into the body

`applyTheme()` also walks the body and patches `src` onto every `rc-logo` whose `rc-class` is `"rcml-logo-style"` or `"rc-initial-logo"`. If `width` is not already set, it adds `"width": "96px"` as a default. Logos without one of these class names are left unchanged.

## Slot-to-node reference

| Theme slot | Node path in the output |
|-----------|-------------------------|
| `brandStyleId` | `rc-head > rc-brand-style > attributes.brand-style-id` |
| Color `background` | `rc-head > rc-attributes > rc-body > attributes.background-color` |
| Color `body` | `rc-head > rc-attributes > rc-section > attributes.background-color` |
| Color `primary` | `rc-head > rc-attributes > rc-button > attributes.background-color` |
| Color `secondary` | `rc-head > rc-attributes > rc-class[name="rcml-brand-color"] > attributes.background-color` |
| Image `logo` | `rc-head > rc-attributes > rc-class[name="rcml-logo-style"] > attributes.src` + body `rc-logo` |
| Font style `p` | `rc-head > rc-attributes > rc-class[name="rcml-p-style"]` |
| Font style `h1`–`h4` | `rc-head > rc-attributes > rc-class[name="rcml-{h1..h4}-style"]` |
| Font style `label` | `rc-head > rc-attributes > rc-class[name="rcml-label-style"]` |
| Social links | `rc-head > rc-attributes > rc-social > rc-social-element` children |
| Custom fonts | `rc-head > rc-font` (direct children, after `rc-attributes`) |

## API

Three functions form the theme API:

| Function | Purpose |
|----------|---------|
| `createEmailTheme(overrides?)` | Build a fresh `EmailTheme` from defaults plus optional overrides. |
| `applyTheme(doc, theme)` | Write theme values into a document's `rc-head`; returns a new document (input not mutated). |
| `getTheme(doc)` | Extract the current `EmailTheme` from a document's `rc-head`. |

See the API reference pages for full parameter details and default values.

## Related

- [`createEmailTheme`](/api/rcml/src/functions/createEmailTheme)
- [`applyTheme`](/api/rcml/src/functions/applyTheme)
- [`getTheme`](/api/rcml/src/functions/getTheme)
- [`EmailTheme`](/api/rcml/src/interfaces/EmailTheme)
- [`EmailThemePatch`](/api/rcml/src/interfaces/EmailThemePatch)
- [`<rc-brand-style>` reference](/packages/rcml/email/rcml/head/rc-brand-style)
