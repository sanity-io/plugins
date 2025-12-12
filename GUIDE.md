How to develop on the `sanity` package while testing on this studio, with hot reloading:

1. In the https://github.com/sanity-io/sanity git checkout, `cd packages/sanity && pnpm turbo run build && pnpm link`
2. In this monorepo, `pnpm link sanity` from the root.
3. It creates an entry in `devDependnecies` like this:
   ```json
     "devDependencies": {
       "sanity": "link:../../Library/pnpm/global/5/node_modules/sanity"
     },
   ```
4. First off, the `link:` protocol is not ideal, you might've seen pnpm warns about it when doing `pnpm link` in step 1. So we'll fix it. Copy the value of `sanity` and paste it to `pnpm-workspace.yaml` as an `overrides` entry, and replace the protocol with `file:` as recommend by pnpm:
   ```yaml
    overrides:
      sanity: link:../../Library/pnpm/global/5/node_modules/sanity
   ```
5. Delete `sanity` from `devDependencies` in this monorepo's `package.json`
6. Finally run `pnpm install && pnpm dev` in this monorepo and you should be able to see the changes in the test studio.
