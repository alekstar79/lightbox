# Lightbox TS

[![npm version](https://img.shields.io/npm/v/@alekstar79/lightbox.svg)](https://www.npmjs.com/package/@alekstar79/lightbox)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-repo-green.svg?style=flat)](https://github.com/alekstar79/lightbox)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)](https://www.typescriptlang.org)
[![Coverage](https://img.shields.io/badge/coverage-91.83%25-brightgreen.svg)](https://github.com/alekstar79/lightbox)

A modern, lightweight, and dependency-free image gallery and lightbox library for the web. Built with TypeScript, it provides zoom, pan, full-screen, keyboard navigation, a flexible plugin system, and a token-based theming system with three built-in themes.

![image](review.gif)

[**LIVE DEMO**](https://alekstar79.github.io/lightbox)

---

## Features

- 🖼️ **Gallery** — responsive grid with lazy loading (IntersectionObserver or native lazy loading).
- 🔍 **Zoom & Pan** — smooth zoom with mouse wheel and drag-to-pan.
- ⌨️ **Keyboard navigation** — arrow keys to switch images, `Esc` to close.
- 🖥️ **Full-screen mode** — toggle full-screen with one click.
- 🎛️ **Plugin system** — extend the library with custom behavior via a simple API.
- 🎨 **Theming** — token-based theming with three built-in themes (`dark`, `minimal`, `glass`) and full custom-theme support.
- 🎢 **Parallax columns** — optional plugin for smooth-scroll with different column speeds and bottom-edge alignment.
- 📦 **Modular architecture** — use the high-level factory or compose your own from standalone classes.
- ⚡ **No dependencies** — pure TypeScript.
- 🧪 **Fully tested** — unit tests with Vitest and high coverage (91%+).

---

## Installation

```bash
npm install @alekstar79/lightbox
# or
yarn add @alekstar79/lightbox
```

---

## Quick Start

The easiest way to get started is using the `create` factory.

### HTML structure

Place the following elements in your page (the library expects these classes by default, but you can override them using `classMap` if needed).

```html
<!-- Include the library CSS (adjust the path) -->
<link rel="stylesheet" href="/node_modules/@alekstar79/lightbox/lib/index.css" />

<!-- Gallery container -->
<div class="wrapper"></div>

<!-- Lightbox elements (must be present) -->
<div class="shadow"></div>
<div class="preview-box">
  <div class="details">
    <span class="title"><p class="current-img"></p> / <p class="total-img"></p></span>
    <div class="actions">
      <span class="icon fas fa-expand"></span>
      <span class="icon fas fa-times"></span>
    </div>
  </div>
  <div class="image-box">
    <img src="" alt="" />
    <div class="pan-overlay"></div>
    <div class="slide prev"><i class="fas fa-angle-left"></i></div>
    <div class="slide next"><i class="fas fa-angle-right"></i></div>
  </div>
</div>
```

### JavaScript / TypeScript

```ts
import { create, ready } from '@alekstar79/lightbox'
import '@alekstar79/lightbox/lib/index.css'

const source = Array.from({ length: 28 }, (_, i) => ({
  src: `images/img-${String(i + 1).padStart(2, '0')}.jpg`,
}));

await ready()

const app = create({
  source,
  gallerySelector: '.wrapper',
  // optional: plugins: [new DirectionalHoverPlugin()],
})
```

---

## API Reference

### `create(options: LightboxOptions): LightboxApp`

Creates a fully configured gallery and lightbox instance.

| Option             | Type                         | Default      | Description                                                     |
|--------------------|------------------------------|--------------|-----------------------------------------------------------------|
| `source`           | `ImageSource[]`              | required     | Array of `{ src: string }` objects.                             |
| `thumb`            | `ImageSource[]`              | –            | Optional array of thumbnails. Falls back to `source` per index. |
| `gallerySelector`  | `string`                     | `'.wrapper'` | CSS selector for the gallery container.                         |
| `scaleSensitivity` | `number`                     | `50`         | Zoom sensitivity (higher = slower).                             |
| `minScale`         | `number`                     | `0.1`        | Minimum zoom scale.                                             |
| `maxScale`         | `number`                     | `30`         | Maximum zoom scale.                                             |
| `setupFn`          | `(gallery: Gallery) => void` | –            | Callback for custom gallery setup.                              |
| `plugins`          | `Plugin[]`                   | `[]`         | Plugins to apply to the gallery/lightbox.                       |

### `LightboxApp`

The object returned by `create`:

```ts
interface LightboxApp {
  destroy(): void
  gallery: Gallery
  setPlugins(plugins: Plugin[]): void
  reapplyPlugins(): void
}
```

- `destroy()` — cleans up all event listeners and removes DOM.
- `gallery` — direct access to the `Gallery` instance (e.g. to call `render()`).
- `setPlugins()` — dynamically replace active plugins (useful for toggling features).
- `reapplyPlugins()` — re-apply current plugins after a gallery re-render.

### `ready(): Promise<void>`

Resolves when the DOM is fully loaded.

---

## Plugin System

Plugins allow you to extend any part of the library without modifying the core.

### Interfaces

```ts
export interface PluginContext {
  gallery: Gallery
  lightbox: Lightbox
  renderer: Renderer
  emitter: Emitter
  root: HTMLElement
}

export interface Plugin {
  name: string
  apply(context: PluginContext): void
  destroy?(): void
}
```

### Writing a Custom Plugin

```ts
import { Plugin, PluginContext } from '@alekstar79/lightbox'

export class MyPlugin implements Plugin {
  name = 'my-plugin'

  apply(context: PluginContext): void {
    const galleryEl = context.gallery.galleryElement
    // attach event listeners, add DOM, etc.
  }

  destroy() {
    // cleanup
  }
}
```

### Built-in Plugins

#### `DirectionalHoverPlugin`

Adds a 3D hover effect to gallery items. On mouse enter/leave the image rotates in from the edge closest to the cursor.

**Import:**
```ts
import { DirectionalHoverPlugin } from '@alekstar79/lightbox'
import '@alekstar79/lightbox/lib/directional-hover.css'
```

```ts
const app = create({
  source,
  plugins: [new DirectionalHoverPlugin()],
})
```

#### `ParallaxColumnsPlugin`

Adds smooth wheel-based scrolling and lets each gallery column scroll at its own speed. Taller columns move faster so that, by the time the user reaches the end of the gallery, the bottom edge of every column lines up.

Includes a self-contained `SmoothScroll` implementation (no external smooth-scroll library needed).

**Import:**
```ts
import { ParallaxColumnsPlugin } from '@alekstar79/lightbox'
```

**Options (`ParallaxColumnsOptions`):**

| Option           | Type                    | Default     | Description                                                          |
|------------------|-------------------------|-------------|----------------------------------------------------------------------|
| `smoothScroll`   | `boolean`               | `true`      | Enable wheel-based smooth scrolling.                                 |
| `scrollDuration` | `number`                | `3`         | Animation duration in seconds.                                       |
| `scrollEasing`   | `(t: number) => number` | easeOutExpo | Custom easing function, receives `t ∈ [0, 1]`.                       |
| `clipMargin`     | `number`                | `60`        | Extra px of `overflow-clip-margin`, so edge card shadows aren't cut. |

```ts
import { create } from '@alekstar79/lightbox'
import { ParallaxColumnsPlugin } from '@alekstar79/lightbox'

const app = create({
  source,
  plugins: [
    new ParallaxColumnsPlugin({
      smoothScroll: true,
      scrollDuration: 3,
      clipMargin: 60,
    }),
  ],
})
```

**Notes:**

- The plugin uses `ResizeObserver` on the grid to re-measure columns when images finish loading or the layout changes.
- It re-subscribes on every `list:created` event, so it works correctly after `gallery.render()`.
- Smooth scrolling is wheel-only; touch devices keep native scroll, matching common smooth-scroll library defaults.
- Zoom inside the lightbox still works — the plugin skips `wheel` events while `body.overflow === 'hidden'`.

---

## Themes

The library ships with a **base** theme and three optional themes: **dark**, **minimal**, and **glass**.

Theming is done entirely through CSS custom properties — there is no JavaScript theme manager. You activate a theme by importing its stylesheet and setting a `data-theme` attribute on a root element.

### Activation

```html
<!-- 1. Import the base stylesheet (always required) -->
<link rel="stylesheet" href="/node_modules/@alekstar79/lightbox/lib/index.css" />

<!-- 2. Import the theme you want -->
<link rel="stylesheet" href="/node_modules/@alekstar79/lightbox/lib/theme-dark.css" />
```

Or via a bundler:

```ts
import '@alekstar79/lightbox/lib/index.css'
import '@alekstar79/lightbox/themes/dark.css'
```

Then set the attribute on the `<html>` element:

```ts
document.documentElement.dataset.theme = 'dark'
// or, in markup:
// <html data-theme="dark">
```

To use the base theme, omit the theme stylesheet and remove the attribute.

### Built-in themes

| Theme       | File                       | Attribute value        | Idea                                                                  |
|-------------|----------------------------|------------------------|-----------------------------------------------------------------------|
| **base**    | `lib/index.css` (built-in) | *(none)*               | Photo prints: white cards with padding, soft shadow, framed images.   |
| **dark**    | `lib/theme-dark.css`       | `data-theme="dark"`    | Night mode: near-black canvas, luminous card outlines, indigo accent. |
| **minimal** | `lib/theme-minimal.css`    | `data-theme="minimal"` | Editorial grid: no cards, seamless image mosaic, monochrome accent.   |
| **glass**   | `lib/theme-glass.css`      | `data-theme="glass"`   | Light gradient-mesh canvas, frosted translucent panels with blur.     |

> **Note on `glass`:** This theme relies on `backdrop-filter`. Browsers without support automatically fall back to opaque panels via a `@supports` guard — no action needed on your side.

### Theme tokens

Every visual aspect of the library is driven by CSS custom properties prefixed with `--lb-`. Override any of them to build a custom theme.

**Colors**

| Token                     | Purpose                                                     |
|---------------------------|-------------------------------------------------------------|
| `--lb-color-bg`           | Page background.                                            |
| `--lb-color-surface`      | Gallery card background.                                    |
| `--lb-color-preview-bg`   | Lightbox panel background.                                  |
| `--lb-color-overlay`      | Backdrop behind the lightbox.                               |
| `--lb-color-text`         | Primary text.                                               |
| `--lb-color-text-muted`   | Secondary text (header tagline).                            |
| `--lb-color-accent`       | Accent color (icons, hover states).                         |
| `--lb-color-shimmer`      | Placeholder shimmer while images load.                      |
| `--lb-color-border`       | Reserved border color.                                      |
| `--lb-color-slide-bg`     | Prev/next slide button background.                          |
| `--lb-color-slide-fg`     | Prev/next slide button foreground (icon).                   |

**Shadows**

| Token                     | Purpose                                                     |
|---------------------------|-------------------------------------------------------------|
| `--lb-shadow-card`        | Gallery card box-shadow.                                    |
| `--lb-shadow-lightbox`    | Lightbox panel box-shadow.                                  |
| `--lb-slide-shadow`       | Prev/next slide button box-shadow.                          |

**Radii**

| Token                     | Purpose                                                     |
|---------------------------|-------------------------------------------------------------|
| `--lb-radius-sm`          | Lightbox panel corner radius.                               |
| `--lb-radius-card`        | Gallery card corner radius.                                 |
| `--lb-radius-slide`       | Slide button corner radius (defaults to a circle).          |
| `--lb-image-radius`       | Image corner radius inside a card.                          |

**Layout**

| Token                     | Purpose                                                     |
|---------------------------|-------------------------------------------------------------|
| `--lb-wrapper-padding`    | Padding around the gallery grid.                            |
| `--lb-card-padding`       | Padding inside each gallery card.                           |
| `--lb-gallery-gap`        | Gap between gallery cards.                                  |

**Frosted glass (progressive enhancement)**

| Token                     | Purpose                                                     |
|---------------------------|-------------------------------------------------------------|
| `--lb-card-backdrop`      | `backdrop-filter` for gallery cards (`none` to disable).    |
| `--lb-preview-backdrop`   | `backdrop-filter` for the lightbox panel.                   |
| `--lb-overlay-backdrop`   | `backdrop-filter` for the backdrop overlay.                 |

**Image hover behavior**

| Token                          | Purpose                                                |
|--------------------------------|--------------------------------------------------------|
| `--lb-image-hover-transform`   | Transform applied to images on hover (`scale(1.12)`).  |
| `--lb-image-hover-filter`      | Filter applied to images on hover (`brightness(...)`). |

**Lightbox chrome**

| Token                          | Purpose                                                |
|--------------------------------|--------------------------------------------------------|
| `--lb-preview-padding`         | Padding inside the lightbox panel.                     |
| `--lb-details-padding`         | Padding of the top details bar (title, icons).         |
| `--lb-details-border-bottom`   | Separator line under the details bar.                  |
| `--lb-title-size`              | Font size of the image counter.                        |
| `--lb-title-weight`            | Font weight of the image counter.                      |
| `--lb-title-letter-spacing`    | Letter spacing of the counter.                         |
| `--lb-title-transform`         | `text-transform` of the counter.                       |
| `--lb-slide-size`              | Width and height of prev/next slide buttons.           |
| `--lb-slide-margin`            | Margin around prev/next slide buttons.                 |

**Motion**

| Token                     | Purpose                                                     |
|---------------------------|-------------------------------------------------------------|
| `--lb-transition-fast`    | Short transitions (e.g. button hover).                      |
| `--lb-transition-base`    | Standard transitions (image hover, lightbox fade-in).       |

### Writing a custom theme

Create a stylesheet that overrides only the tokens you want to change. No need to re-declare the entire base.

```scss
/* my-brand-theme.scss */
:root[data-theme="brand"] {
  /* Colors */
  --lb-color-bg: #f4f1ea;
  --lb-color-surface: #ffffff;
  --lb-color-preview-bg: #ffffff;
  --lb-color-accent: #ff5a1f;

  /* Geometry */
  --lb-radius-card: 20px;
  --lb-radius-sm: 20px;
  --lb-image-radius: 20px;
  --lb-card-padding: 0em;

  /* Motion */
  --lb-image-hover-transform: scale(1.08);
}
```

Then import it alongside the base stylesheet and set the attribute:

```ts
import '@alekstar79/lightbox/lib/index.css'
import './my-brand-theme.scss'

document.documentElement.dataset.theme = 'brand'
```

> **Tip:** Do not import the base theme tokens separately — `lib/index.css` already includes them under `:root`. Your custom theme only needs to override the values it changes.

---

## Gallery & Lightbox Low-Level Classes

If you need more control, you can use the individual classes directly.

- `Gallery` — manages the grid and image loading.
- `Lightbox` — manages the overlay and navigation.
- `Renderer` — handles zoom/pan transformations.
- `Bindings` — global keyboard shortcuts.
- `Fullscreen` — vendor-prefixed full-screen API.
- `emitter` — global event bus.

---

## Styling

The library ships its CSS separately. Two files are typically imported:

1. **`lib/index.css`** — the base stylesheet with all tokens and component styles (required).
2. **A theme file** — `lib/theme-dark.css`, `lib/theme-minimal.css`, or `lib/theme-glass.css` (optional).

```ts
import '@alekstar79/lightbox/lib/index.css'
import '@alekstar79/lightbox/themes/dark.css'
```

All colors, radii, shadows, spacing, and motion are driven by `--lb-*` custom properties. To rebrand the library without writing a full theme, override those variables in your own stylesheet — see the [Themes](#themes) section for the full token reference.

To use the plugin-specific styles, import their stylesheets:

```ts
import '@alekstar79/lightbox/lib/directional-hover.css'
```

---

## Development

```bash
git clone https://github.com/alekstar79/lightbox.git
cd lightbox
yarn install
```

### Scripts

- `yarn dev` — start dev server with hot reload.
- `yarn build` — build both the library and the demo.
- `yarn test` — run unit tests.
- `yarn coverage` — run tests with coverage report.
- `node generate-readme.mjs` — regenerate this README.

---

## License

[MIT](LICENSE) © alekstar79
