# @sanity/lexorank

An ESM-compatible TypeScript implementation of the LexoRank algorithm for maintaining
lexicographically ordered lists.

This package preserves the rank format and behavior of `lexorank@1.0.5`, including existing values
such as `0|000000:`. It is maintained in the Sanity plugins monorepo so Sanity Studio plugins can use
LexoRank during browser builds and server-side schema extraction without loading legacy CommonJS.

## Usage

```ts
import {LexoRank} from '@sanity/lexorank'

const first = LexoRank.min()
const last = LexoRank.max()
const middle = first.between(last)

console.log(middle.toString()) // 0|hzzzzz:
```

See [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md) for the origin and license of the underlying
implementation.
