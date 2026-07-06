# @rule/template-engine

Minimal, XML-native template engine that powers the ready-made email templates in the vendor packages (`@rule/vendor-shopify`, etc.). Pure, synchronous, no JS runtime inside templates, no filesystem access from the compiler itself.

```ts
import {
  compileTemplate,
  loadTemplate,
  loadCopy,
  createEmailTemplate,
  customField,
  loopValue,
} from '@rule/template-engine'
```

This README is the entry-point **for template authors** — it explains the layers, the file pattern, and the authoring flow. For the low-level API surface, see the JSDoc on each export.

---

## Layers

A ready-made email template spans three packages:

- **`@rule/template-engine`** (this package) — XML compiler, runtime loaders, and email template factory.
  - `compileTemplate({ template, copy, context, serializer? })` → `{ xml }`.
  - `loadTemplate(import.meta.url, './foo.xml')` → XML source string.
  - `loadCopy<T>(import.meta.url, './foo.json')` → parsed JSON, typed as `T`.
  - `createEmailTemplate<TCopy, TContext>({ baseUrl, templatePath, copyPath })` — bundles the full render pipeline (load + compile + theme projection + `xmlToRcml` + `applyTheme`).
  - Types: `EmailTemplate<TCopy, TContext>`, `EmailTemplateRenderArgs<TCopy, TContext>`.
  - Typed refs: `customField(group, name, id?)`, `loopValue(key)`; types `CustomFieldRef`, `LoopValueRef`, `TemplateRef`. Serializer surface: `TemplateRefSerializer`, `defaultTemplateRefSerializer`, `serializeRef`, `isTemplateRef`.
  - Errors: `TemplateCompileError`.
- **`@rule/rcml`** — RCML element factories, validators, converters, and theme API.
- **Vendor packages** (e.g. `@rule/vendor-shopify`) — one folder per template, each with four files.

---

## Template syntax (v3)

Quick reference — everything the XML uses:

- `<?copy key p1=expr p2=expr …?>` — emit a localized copy entry. Placeholders inside the copy string (`{{p1}}`) get filled from the PI params.
- `@{expr}` — dynamic attribute-value binding. Only valid inside attribute quotes.
- `<?if expr?> … <?elseif expr?> … <?else?> … <?endif?>` — structural branches.
- `<?for let item of expr?> … <?endfor?>` — iterate an array.
- Text nodes are static; `@{…}` in text content is a compile error (use `<?copy?>` instead).

Expression grammar is intentionally small: dotted paths, literals, `&&` / `||` / `!`, `==` / `!=`, `<` / `<=` / `>` / `>=`, grouping. No function calls, no arithmetic, no optional chaining.

Truthiness (for `<?if?>`): only `false` / `null` / `undefined` are falsy. Empty string and empty array are **truthy** — omit the field rather than passing `''` or `[]` when you want a gate to fail.

---

## The four-file pattern

For a template called `name`, the vendor directory looks like:

```
vendor-foo/src/templates/name/
├── name.xml         # layout
├── name-copy.json   # default copy
├── name.ts          # types + factory
└── name.test.ts     # tests
```

### 1. `name.xml` — layout

Pure v3 XML. `<?copy?>` for text, `@{…}` for attribute bindings, `<?if?>` / `<?for?>` for control flow.

```xml
<rc-section>
  <rc-column padding="0 20px">
    <rc-heading rc-class="rcml-h1-style">
      <?copy greetingHeading firstNameCustomField=recipient.firstName?>
    </rc-heading>
  </rc-column>
</rc-section>

<?if cart.products?>
  <rc-loop loop-type="custom-field" loop-value="@{cart.products.source.id}">
    <rc-text><?copy itemNameLine itemNameLoopValue=cart.products.itemName?></rc-text>
    <?if cart.products.itemSku?>
      <rc-text><?copy itemSkuLine itemSkuLoopValue=cart.products.itemSku?></rc-text>
    <?endif?>
  </rc-loop>
<?endif?>

<?if socialLinks?>
  <rc-social align="center">
    <?for let link of socialLinks?>
      <rc-social-element name="@{link.type}" href="@{link.url}"/>
    <?endfor?>
  </rc-social>
<?endif?>
```

### 2. `name-copy.json` — default copy

Plain JSON. `{{slot}}` tokens get filled from `<?copy?>` PI params at render time.

```json
{
  "greetingHeading": "Hi {{firstNameCustomField}}!",
  "itemNameLine": "{{itemNameLoopValue}}",
  "itemSkuLine": "SKU: {{itemSkuLoopValue}}",
  "ctaButton": "Return to Cart"
}
```

### 3. `name.ts` — types + factory

Exports three public contracts: a context interface, a copy interface, and a thin factory over `createEmailTemplate`.

```ts
import {
  createEmailTemplate,
  type EmailTemplate,
  type EmailTemplateRenderArgs,
  type CustomFieldRef,
  type LoopValueRef,
} from '@rule/template-engine'

/**
 * Typed data the XML consumes. Structural presence is the contract:
 * optional sections are gated on the presence of their backing fields,
 * never on parallel `has*` flags.
 */
export interface NameTemplateContext {
  recipient: { firstName: CustomFieldRef }
  cart: {
    url: string
    products?: {
      source: CustomFieldRef
      itemName: LoopValueRef
      itemSku?: LoopValueRef
    }
  }
  footer: { fontSize: string; textColor: string }
}

/** Default copy tree — matches the JSON file one-to-one. */
export interface NameTemplateCopy {
  readonly greetingHeading: string
  readonly itemNameLine: string
  readonly itemSkuLine: string
  readonly ctaButton: string
}

export type NameTemplate = EmailTemplate<NameTemplateCopy, NameTemplateContext>
export type NameRenderOptions = EmailTemplateRenderArgs<NameTemplateCopy, NameTemplateContext>

export function createNameTemplate(): NameTemplate {
  return createEmailTemplate<NameTemplateCopy, NameTemplateContext>({
    baseUrl: import.meta.url,
    templatePath: './name.xml',
    copyPath: './name-copy.json',
  })
}
```

### 4. `name.test.ts` — tests

Drives the public `render({ context, theme, copy? })` path; no direct imports of the XML or JSON modules.

---

## What the factory does for you

`createEmailTemplate` bundles these steps so the `name.ts` file stays contract-sized:

- **Load** the XML via `loadTemplate` and the copy JSON via `loadCopy` at construction.
- **Merge** the caller's `copy?: Partial<TCopy>` over the defaults at each `render` call.
- **Project theme fields** into the compile context:
  - `theme.images.logo?.url` → `logoUrl` (XML sees it via `<?if logoUrl?>` / `@{logoUrl}`).
  - Non-empty `Object.values(theme.links)` → `socialLinks` (XML sees it via `<?if socialLinks?>` / `<?for let link of socialLinks?>`).
- **Serialize `TemplateRef` values** at the stringify step via a pluggable `TemplateRefSerializer`. The default emits the RFM `::placeholder{…}` / `::loop-value{…}` strings Rule.io's backend expects; pass `render({ serializer })` to target a different format.
- **Parse and theme** — `xmlToRcml(xml)` then `applyTheme(doc, theme)`. The theme contributes element-level stylings via `<rc-class>` bindings (`rcml-logo-style`, `rcml-brand-color`, `rcml-h1-style`, etc.) — so templates that declare `rc-class="rcml-brand-color"` pick up the theme's secondary color automatically, without carrying it through context.

Net effect: the caller-facing context is the **minimum data the template actually needs**. Theme-derived things stay in the theme. Copy stays in JSON. Refs stay as descriptors until the last possible moment.

---

## Consuming a template

```ts
import { createAbandonedCartTemplate } from '@rule/vendor-shopify'
import { customField, loopValue } from '@rule/template-engine'

const template = createAbandonedCartTemplate()

const doc = template.render({
  context: {
    recipient: { firstName: customField('Subscriber', 'FirstName', 200001) },
    cart: {
      url: 'https://shop.example.com/cart',
      products: {
        source: customField('Order', 'Products', 200014),
        itemName: loopValue('name'),
        itemSku: loopValue('sku'),
      },
    },
    footer: { fontSize: '10px', textColor: '#666666' },
  },
  theme,                              // EmailTheme from @rule/rcml
  copy: { ctaButton: 'Check out' },   // optional partial override
})
```

`doc` is an `RcmlDocument` — send it through `@rule/client` to create a campaign or automation email in Rule.io.

---

## Design invariants

- **Structural presence.** Optional sections are gated on the presence of their backing fields (`<?if cart.products?>`, `<?if cart.products.itemSku?>`). No `has*` flags. Context and guards can't drift.
- **Typed refs.** `CustomFieldRef` / `LoopValueRef` carry identifiers; the compiler serializes them at the end. Callers never hand-write `::placeholder{…}` strings.
- **Theme is the source of truth for theme things.** Logo URL, social links, brand colors — they flow from `theme`, not from caller-assembled context. Callers curate their theme to change them.
- **Copy is data.** Labels, slot-bearing sentences, and inline RFM snippets (like styled footer links) live in the JSON. Translation and copy-tweaks happen there; no TS recompile.

---

## Worked example

`packages/vendor-shopify/src/templates/abandoned-cart/` is the reference implementation. Its four files demonstrate every pattern above:

- `abandoned-cart.xml` — structural `<?if?>` guards on `cart.products` / `cart.totalPrice` / `logoUrl` / `socialLinks`; inline RFM footer link in a `<?copy?>` call.
- `abandoned-cart-copy.json` — English default copy with RFM atoms inline in `footerLinks`.
- `abandoned-cart.ts` — ~140 lines of mostly JSDoc + interfaces; the factory body is four lines.
- `abandoned-cart.test.ts` — exercises the public `render` API end-to-end.

Copy that shape when adding a new vendor template.
