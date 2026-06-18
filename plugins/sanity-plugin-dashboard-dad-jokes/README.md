# sanity-plugin-dashboard-dad-jokes

> This is a **Sanity Studio v3+** plugin.

A dashboard widget for [Sanity Content Studio](https://www.sanity.io/) that fetches a random dad joke from [icanhazdadjoke.com](https://icanhazdadjoke.com/).

## Installation

```sh
npm install sanity-plugin-dashboard-dad-jokes
```

This widget is rendered by [`@sanity/dashboard`](https://github.com/sanity-io/plugins/tree/main/plugins/%40sanity/dashboard), so install that too if you haven't already:

```sh
npm install @sanity/dashboard
```

## Usage

Add `dashboardTool` to your plugins and pass `jokesWidget()` as one of its widgets in `sanity.config.ts` (or `.js`):

```ts
import {defineConfig} from 'sanity'
import {dashboardTool} from '@sanity/dashboard'
import {jokesWidget} from 'sanity-plugin-dashboard-dad-jokes'

export default defineConfig({
  // ...
  plugins: [
    dashboardTool({
      widgets: [jokesWidget()],
    }),
  ],
})
```

### Configuration

`jokesWidget` accepts an optional config object:

| Property | Type           | Description                                                  |
| -------- | -------------- | ------------------------------------------------------------ |
| `layout` | `LayoutConfig` | Controls the widget's size. Defaults to `{width: 'medium'}`. |

```ts
jokesWidget({layout: {width: 'small'}})
```

## License

[MIT](LICENSE) © Sachin Sancheti
