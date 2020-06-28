[![NPM Version](https://img.shields.io/npm/v/kea-window-values.svg)](https://www.npmjs.com/package/kea-window-values)
[![minified](https://badgen.net/bundlephobia/min/kea-window-values)](https://bundlephobia.com/result?p=kea-window-values)
[![minified + gzipped](https://badgen.net/bundlephobia/minzip/kea-window-values)](https://bundlephobia.com/result?p=kea-window-values)
[![Backers on Open Collective](https://opencollective.com/kea/backers/badge.svg)](#backers)
[![Sponsors on Open Collective](https://opencollective.com/kea/sponsors/badge.svg)](#sponsors)

# kea-window-values

- Sync `window.whatever` with `values.anything`.
- Sync on window onscroll & onresize events.


## Installation 

```javascript
  import { windowValuesPlugin } from 'kea-window-values'

  resetContext({
    plugins: [windowValuesPlugin({ window: window })]
  }),
```

## Usage

```javascript
  kea({
    windowValues: {
      isSmallScreen: window => window.innerWidth < 640,
      isRetina: window => window.devicePixelRatio > 2,
      scrollBarWidth: window => window.innerWidth - window.body.clientWidth
    }
  })
```

## Sample usage

[Read the documentation](https://kea.js.org/docs/plugins/window-values)
