# `<rc-video>`

Video thumbnail block. Renders a static preview image with a play-button overlay that links to the video URL. Full video playback is not supported in most email clients.

## Attributes

| Attribute | Default | Constraint | Example | Description |
|-----------|---------|------------|---------|-------------|
| `align` | `center` | `left` \| `center` \| `right` | `center` | Horizontal alignment of the thumbnail. |
| `align-on-mobile` | — | `left` \| `center` \| `right` | `left` | Alignment override on mobile. |
| `alt` | `""` | String | `Product demo video` | Alt text for the thumbnail image. |
| `border` | — | CSS border shorthand | `1px solid #cccccc` | Border around the thumbnail. |
| `border-bottom` | — | CSS border shorthand | `2px solid #000000` | Bottom border only. |
| `border-left` | — | CSS border shorthand | `1px solid #cccccc` | Left border only. |
| `border-right` | — | CSS border shorthand | `1px solid #cccccc` | Right border only. |
| `border-top` | — | CSS border shorthand | `2px solid #000000` | Top border only. |
| `border-radius` | — | px or %, 1–4 values | `8px` | Rounded corners on the thumbnail. |
| `button-url` | — | URL | `https://youtu.be/abc123` | URL of the video to open when the play button is clicked. |
| `container-background-color` | — | CSS color value | `#000000` | Background colour of the containing table cell. |
| `css-class` | — | String | `video-block` | HTML class names on the rendered element. |
| `fluid-on-mobile` | — | `true` \| `false` | `true` | Stretch the thumbnail to full width on mobile. |
| `font-size` | `14px` | Pixel value | `14px` | Font size for the alt-text fallback display. |
| `height` | `auto` | Pixel value or `auto` | `auto` | Thumbnail height. |
| `href` | — | URL | `https://example.com/video` | URL to navigate to when the thumbnail image (not the play button) is clicked. May contain placeholder tokens. |
| `max-height` | — | px or percentage | `400px` | Maximum thumbnail height. |
| `name` | — | String | `product-demo` | Tracking name. |
| `padding` | `0 0 20px` | px, 1–4 values | `0 0 20px` | Outer padding around the video cell. |
| `padding-top` | — | px or percentage | `10px` | Top outer padding. |
| `padding-bottom` | — | px or percentage | `20px` | Bottom outer padding. |
| `padding-left` | — | px or percentage | `0` | Left outer padding. |
| `padding-right` | — | px or percentage | `0` | Right outer padding. |
| `padding-on-mobile` | — | px, 1–4 values | `0 0 16px` | Padding override on mobile. |
| `rel` | — | String | `noopener noreferrer` | HTML `rel` attribute on the anchor. |
| `src` | — | URL | `https://cdn.example.com/video-thumb.jpg` | URL of the thumbnail image displayed as the video preview. |
| `target` | `_blank` | `_blank` \| `_self` \| `_parent` \| `_top` | `_blank` | HTML anchor target. |
| `title` | — | String | `Watch the demo` | Tooltip on hover. |
| `width` | — | Pixel value | `600px` | Thumbnail width in pixels. |

## Children

None.

## Parents

- [`<rc-column>`](../layout/rc-column.md)

## JSON

```json
{
  "tagName": "rc-video",
  "attributes": {
    "src": "https://cdn.example.com/video-thumb.jpg",
    "button-url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "alt": "Watch our product demo",
    "width": "600px"
  }
}
```

## XML

```xml
<rc-video src="https://cdn.example.com/video-thumb.jpg" button-url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" alt="Watch our product demo" width="600px"></rc-video>
```

## Building

Templates can be built using factory functions from `@rule/rcml`, or the JSON structure above can be generated directly by an AI model — pass [`rcmlSpec`](/api/rcml/src/variables/rcmlSpec) as context when prompting.

```typescript
import { createVideoElement } from '@rule/rcml';

createVideoElement({
  attrs: {
    src: 'https://cdn.example.com/video-thumb.jpg',
    'button-url': 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    alt: 'Watch our product demo',
    width: '600px',
  },
})
```

## API Reference

- [createVideoElement](/api/rcml/src/functions/createVideoElement)
- [rcmlSpec](/api/rcml/src/variables/rcmlSpec)
