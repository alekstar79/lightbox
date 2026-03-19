# Lightbox TS

[![npm version](https://img.shields.io/npm/v/@alekstar79/lightbox.svg)](https://www.npmjs.com/package/@alekstar79/lightbox)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)
[![GitHub](https://img.shields.io/badge/github-repo-green.svg?style=flat)](https://github.com/alekstar79/lightbox)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat-square)](https://www.typescriptlang.org)
[![Coverage](https://img.shields.io/badge/coverage-97.83%25-brightgreen.svg)](https://github.com/alekstar79/lightbox)

A modern, lightweight, and dependency‑free lightbox library for images. Built with TypeScript, it provides slide, fit, zoom, pan, fullscreen, and keyboard navigation out of the box.

![image](review.gif)

[LIVE DEMO](https://alekstar79.github.io/lightbox)

<!-- TOC -->
* [Lightbox TS](#lightbox-ts)
  * [Features](#features)
  * [Installation](#installation)
  * [Quick Start](#quick-start)
  * [API Reference](#api-reference)
    * [`createLightbox(options: LightboxOptions): LightboxApp`](#createlightboxoptions-lightboxoptions-lightboxapp)
    * [`LightboxApp`](#lightboxapp)
  * [Low‑level API](#lowlevel-api)
    * [`Gallery`](#gallery)
    * [`Lightbox`](#lightbox)
    * [`Renderer`](#renderer)
    * [`Bindings`](#bindings)
    * [`Fullscreen`](#fullscreen)
    * [`emitter`](#emitter)
  * [Examples](#examples)
    * [Basic usage with custom events](#basic-usage-with-custom-events)
    * [Building a custom gallery with full control](#building-a-custom-gallery-with-full-control)
  * [Development](#development)
  * [License](#license)
<!-- TOC -->

## Features

- 🖼️ **Image gallery** – display a grid of thumbnails with lazy loading.
- 🔍 **Zoom & Pan** – smooth zooming with mouse wheel and panning via drag.
- ⌨️ **Keyboard navigation** – arrow keys to switch images, Esc to close.
- 🖥️ **Full‑screen mode** – toggle full‑screen with one click.
- 🎛️ **Event system** – subscribe to open/close events using a global emitter.
- 📦 **Modular architecture** – use the high‑level factory or compose your own from standalone classes.
- ⚡ **No dependencies** – pure TypeScript/JavaScript.
- 🧪 **Fully tested** – unit tests with Vitest and high coverage.

## Installation

```bash
npm install @alekstar79/lightbox
# or
yarn add @alekstar79/lightbox
```

## Quick Start

The easiest way to get started is using the createLightbox factory.
Add the following HTML to your page (the required structure is explained below).

```html
<!-- Include the CSS (adjust the path if you import styles differently) -->
<link rel="stylesheet" href="/node_modules/@alekstar79/lightbox/lib/styles.css" />

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

<!-- Optional toggle and refresh button -->
<div class="toggler">
  <div class="justify-center">
    <input type="checkbox" id="theme" checked />
    <label for="theme">IMG</label>
  </div>
  <div class="btn refresh-btn"><span class="fas fa-sync-alt"></span></div>
</div>
```

```js
import { createLightbox } from '@alekstar79/lightbox'

const source = Array.from({ length: 28 }, (_, i) => ({
  src: `img-${String(i + 1).padStart(2, '0')}.jpg`
}))

createLightbox({
  source,
  gallerySelector: '.wrapper',
  scaleSensitivity: 50,
  minScale: 0.1,
  maxScale: 30
})
```

Place your thumbnail images in images/thumb/ and full‑size images in images/ (or adjust the paths in the Gallery class – see advanced usage).

## API Reference

### `createLightbox(options: LightboxOptions): LightboxApp`

Creates a fully configured lightbox instance.

Options

| Property           | Type            | Default      | Description                               |
|--------------------|-----------------|--------------|-------------------------------------------|
| `source`           | `ImageSource[]` | required     | Array of image objects `{ src: string }`. |
| `gallerySelector`  | `string`        | `'.wrapper'` | CSS selector for the gallery container.   |
| `scaleSensitivity` | `number`        | `50`         | Sensitivity of zoom (higher = slower).    |
| `minScale`         | `number`        | `0.1`        | Minimum zoom scale.                       |
| `maxScale`         | `number`        | `30`         | Maximum zoom scale.                       |


### `LightboxApp`

Instance returned by createLightbox. Provides a destroy() method to clean up event listeners and remove the overlay handlers.

```ts
const app = createLightbox(options)
app.destroy() // call when you no longer need the lightbox
```

## Low‑level API

If you need more control, you can compose the lightbox from individual classes.

### `Gallery`

```ts
import { Gallery } from '@alekstar79/lightbox'

new Gallery(
  containerSelector: string,      // e.g. '.wrapper'
  checkboxSelector: string,       // e.g. 'input[type="checkbox"]' – toggles between images/links
  refreshBtnSelector: string,     // e.g. '.refresh-btn' – reshuffles the gallery
  source: ImageSource[]           // array of { src: string }
)
```

### `Lightbox`

```ts
import { Lightbox, Bindings, Fullscreen } from '@alekstar79/lightbox'

const bindings = Bindings.init()      // keyboard handler (singleton)
const fullscreen = new Fullscreen()   // full‑screen manager
const lightbox = Lightbox.init(bindings, fullscreen)

lightbox.open(index: number, list: string[])   // open with image at `index` from `list`
lightbox.close()                               // close the lightbox
```

### `Renderer`

Handles zoom and pan of the preview image.

```ts
import { Renderer } from '@alekstar79/lightbox'

const renderer = new Renderer({
  element: document.querySelector('.preview-box img') as HTMLElement,
  scaleSensitivity: 50,
  minScale: 0.1,
  maxScale: 30
})

renderer.zoom({ deltaScale: 1, x: 100, y: 100 })
renderer.pan({ originX: 10, originY: 10 })
renderer.panTo({ originX: 0, originY: 0, scale: 1 })
```

### `Bindings`

Global keyboard binding manager.

```ts
import { Bindings } from '@alekstar79/lightbox'

const bindings = Bindings.init()
bindings.bind([{ keys: 'ArrowRight', handler: () => next() }])
bindings.track()   // start listening
bindings.untrack() // stop listening
bindings.dispose() // remove all handlers
```

### `Fullscreen`

Encapsulates the Fullscreen API with vendor prefixes.

```ts
import { Fullscreen } from '@alekstar79/lightbox'

const fs = new Fullscreen()
await fs.toggle(element)
fs.on('change', callback)
fs.off('change', callback)
```

### `emitter`

Global event bus. Emits `'window:loaded'`, `'list:created'`, `'open'`, `'close'`.

```ts
import { emitter } from '@alekstar79/lightbox'

emitter.on('open', ({ currentIdx, list }) => { ... })
emitter.once('close', () => { ... })
```

## Examples

### Basic usage with custom events

```js
import { createLightbox, emitter } from '@alekstar79/lightbox'

const app = createLightbox({
  source: [{ src: 'image1.jpg' }, { src: 'image2.jpg' }]
})

// Listen to open/close events via the global emitter
emitter.on('open', (data) => console.log('opened', data))
emitter.on('close', () => console.log('closed'))
```

### Building a custom gallery with full control

See the [src/main.ts](src/main.ts) file for a complete example that uses all classes directly.

## Development

Clone the repository and install dependencies:

```bash
git clone https://github.com/alekstar79/lightbox.git
cd lightbox
yarn install
```

Available scripts:

- `yarn dev` – start development server with live reload.
- `yarn build` – build both the demo and the library.
- `yarn test` – run unit tests.
- `yarn coverage` – run tests with coverage report.

## License

[MIT](LICENSE) © alekstar79
