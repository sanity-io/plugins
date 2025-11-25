# sanity-plugin-workspace-home

This plugin adds a "Home" Tool to your Studio with a listing of all available workspaces. Useful as the first page of your Studio to quickly navigate to the workspace of your choice.

![plugin inside sanity studio showing workspaces](https://user-images.githubusercontent.com/9684022/227136123-ec1908dd-fc60-4832-9079-6f5ed5892923.png)

## Installation

```sh
npm install sanity-plugin-workspace-home
```

## Usage

For simple installation, import the predefined workspace config from the plugin and use it as the first config in your `sanity.config.ts` (or .js) file.

```ts
import {defineConfig} from 'sanity'
import {workspaceHomeConfig} from 'sanity-plugin-workspace-home'

export default defineConfig([
  workspaceHomeConfig({
    // projectId and dataset are required, but not used by the plugin
    projectId: 'replace-with-your-project-id',
    dataset: 'replace-with-your-dataset-name',    
  }),
  // ...all other workspaces
])
```

Alternatively, define your own workspace config for the plugin. This plugin is designed to be used in a workspace where it is the only plugin. This should be the first workspace configured in `sanity.config.ts` (or .js).

```ts
import {defineConfig} from 'sanity'
import {workspaceHome} from 'sanity-plugin-workspace-home'

export default defineConfig([{
  {
    name: 'home',
    title: 'Home',
    basePath: '/home',
    icon: HomeIcon,
    plugins: [workspaceHome()],
    // projectId and dataset are required, but not used by the plugin
    projectId: 'replace-with-your-project-id',
    dataset: 'replace-with-your-dataset-name',
  },
  // ...all other workspaces
}])
```

## License

[MIT](LICENSE) © Sanity
