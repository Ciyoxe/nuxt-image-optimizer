# Nuxt Image Optimizer

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

On‑demand image optimization for Nuxt. Serves responsive, cached images with CLS‑safe placeholders via a simple `<o-img>` component and HTTP endpoints powered by Sharp.

## Features

- In‑process image optimization (via Sharp) and caching with background auto‑refresh and LRU‑like eviction.
- Responsive `srcset`/`sizes` with configurable media keys (`xs`–`xxl`)
- CLS‑safe placeholders and preloading
- SSR-time sizes and aspect-ratio probing
- Domain allow‑list for remote images, supports local files from `public/`

## Quick Start

Install:

```bash
npm i nuxt-image-optimizer
```

Enable and minimally configure in `nuxt.config`:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [
    'nuxt-image-optimizer',
  ],
  cachedImageOptimizer: {
    domains: ['images.example.com'],
  },
});
```

## How it works:

- Nitro server proxies all image requests to the custom endpoint.
- The endpoint validates parameters, then:
  - If cached, serves the optimized image.
  - If not cached, returns the original image immediately and adds optimization task to queue.
- Background maintenance periodically refreshes old cached images (background tasks are also queued).
- Eviction removes the least-used cached images using aging algorithm to fit in cache size limit.

## Component usage

```vue
<template>
  <o-img
    src="https://images.example.com/photo.jpg"
    alt="A photo"
    role="img"
    format="webp"
    quality="75"
    srcset="320,640,1024"
    sizes="sm:100vw,50vw"
    placeholder="30,320"
    @load="onLoad"
    @load:placeholder="onPlaceholder"
    @error="onError"
  />
</template>
```

Props:
- `src`: Image URL. Local `/...` paths work out of the box; remote hosts must be allowed in config.
- `format`: Desired output format (webp/avif/jpeg/png). If omitted, server uses `conversion.format` from config.
- `quality`: Image quality (1–100). If omitted, server uses `conversion.quality` from config.
- `srcset`: Comma‑separated widths for responsive images, e.g. "320, 640, 1024".
- `sizes`: How wide the image should be at different breakpoints, e.g. "sm:100vw, 50vw". Breakpoints are defined in `sizes` section of config.
- `placeholder`: Low‑quality preview to show first, in format "quality, width, height", e.g. "30,320". If prop omitted, no placeholder will be shown. Width and height are optional, if omitted, the placeholder will use size constraints from config.
- `preload`: Adds preload link to page head.

Events:
- `load:placeholder` — fired when the placeholder finished loading (if placeholder prop defined)
- `load` — fired when the final image finished loading
- `error` — fired if the final image fails to load (note, that placeholder loading error will be ignored, only the final image triggers it)

Styles:
- `data-status` attribute — "placeholder", "completed" or "error".
- `--original-width` var — original image width (not sized down by optimizer)
- `--original-height` var — original image height
- `--aspect-ratio` var — original image aspect ratio

Some behaviour diffs from default image component:
- If no `alt` or `role` attributes provided, the component will use `role="presentation"`.
- Loading and error events are always emitted, even if Vue was not initialized before. In such case, they will be triggered in `onMounted` hook.


## Configuration

```ts
// defaults
{
  cache: {
    // if queue is full, new optimization tasks will be rejected
    queueSize: 1000,
    // pause between optimization works to reduce CPU load, format can be like '5s', '100ms', '1m', '2h'
    queueTimeout: '5s',
    // 'in-memory' for memory cache, or storage path for filesystem cache, like '.cache/oimgs'
    storagePath: 'in-memory',
    // max cache size, format can be like '100KB', '122MB', '14GB'
    maxSize: '20MB',
    // max number of cached image sizes (only width and height caching for ssr sizes probing)
    sizeCacheMaxCount: 10000,
  },
  // background image refreshing, active only if main queue is empty
  autoRefresh: {
    // background refresh interval, cached images will be refreshed every 30 minutes by default
    // WARN: avif images processing can be very slow (up to 10 seconds for large ones) and may occur queue overflows
    maxAge: '30m',
    // if queue is full, new refresh tasks will be rejected
    queueSize: 10,
    // pause between refresh works to reduce CPU load
    queueTimeout: '5s',
  },
  conversion: {
    // 'webp' | 'avif' | 'jpeg' | 'png', overwritten by component prop
    format: 'webp',
    // 1..100, overwritten by component prop
    quality: 75,
    // default width, overwritten by component prop
    width: 4096,
    // default height, overwritten by component prop
    height: 4096,
    // codec effort, 0..10 - higher is slower but smaller file sizes
    cpuEffort: 6,
  },
  // media queries list to use in 'sizes' prop
  sizes: {
    xs: '(width < 320px)',
    sm: '(width < 640px)',
    md: '(width < 768px)',
    lg: '(width < 1024px)',
    xl: '(width < 1280px)',
    xxl: '(width < 1280px)',
  },
  // allow‑list for remote hosts
  domains: [],
}
```

## Development

```bash
# Install dependencies
npm install

# Develop with playground
npm run dev

# Type check
npm run test:types

# Lint
npm run lint
```

## License

MIT

<!-- Badges -->

[npm-version-src]: https://img.shields.io/npm/v/nuxt-image-optimizer/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-image-optimizer
[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-image-optimizer.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npm.chart.dev/nuxt-image-optimizer
[license-src]: https://img.shields.io/npm/l/nuxt-image-optimizer.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: ./LICENSE
[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
