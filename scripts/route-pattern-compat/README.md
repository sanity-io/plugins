# Can `URLPattern` cover `path-to-regexp` v6 route patterns?

Spike for [SAPP-4118](https://linear.app/sanity/issue/SAPP-4118). Two customers had Presentation
break after `sanity` bumped `path-to-regexp` from v6 to v8: patterns such as
`/:prefix(.*)/course/:slug` no longer compile, and because the throw happens while the tool resolves
the main document, the whole Presentation tool fails to load. The workaround they were given was to
rewrite the config as `['/course/:slug', '/*prefix/course/:slug']`.

This workspace answers whether `URLPattern` is a better place to land than v8.

**Answer: yes.** `URLPattern`'s pathname syntax _is_ `path-to-regexp` v6's syntax, so every pattern in
the v6 corpus below compiles and matches identically once four documented defaults are re-applied.
It also still accepts the v8-era patterns customers have already migrated to, so nobody has to be
broken a second time. `sanity` already depends on `urlpattern-polyfill` and already uses `URLPattern`
in `presentation/actors/resolve-allow-patterns.ts`; `path-to-regexp` has exactly one call site left
(`presentation/useMainDocument.ts`), so it can be dropped entirely.

There is one real gotcha that a naive swap would hit, and it is not obvious: see
[Custom regexps must be `v`-flag safe](#3-custom-regexps-must-be-v-flag-safe) and
[v8 wildcards fail silently](#2-v8-wildcards-fail-silently-under-urlpattern).

## Running it

```bash
pnpm --filter @sanity/route-pattern-compat test       # 187 assertions
pnpm --filter @sanity/route-pattern-compat report     # regenerates the matrix below
```

The suite is run against both `URLPattern` implementations — native (Node >= 24) and
`urlpattern-polyfill` (Node < 24), the same lazy fallback Presentation already uses — and passes on
both. `path-to-regexp` v6 and v8 are installed side by side as the oracles.

## What is in here

| File                       | Purpose                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| `src/corpus.ts`            | Route patterns to compare, for both the v6 and v8 eras                                    |
| `src/parseRoutePattern.ts` | Walks a route pattern to recover group metadata and rewrite v8-only syntax                |
| `src/vFlagSafeRegexp.ts`   | Makes a custom regexp group compile under both the `u` and `v` RegExp flags               |
| `src/matchRoute.ts`        | `match()` from `path-to-regexp` v6, reimplemented on `URLPattern`                         |
| `src/getRouteContext.ts`   | Drop-in replacement for `getRouteContext` in `sanity/src/presentation/useMainDocument.ts` |
| `src/v6Parity.test.ts`     | Asserts the matcher equals v6 on the v6 corpus and v8 on the v8 corpus                    |
| `src/divergences.test.ts`  | Pins the differences that remain, so they are documented and not discovered               |

## Findings

### 1. v8 rejects most patterns that studios already have

16 of the 23 v6 patterns in the corpus throw under v8. v8 removed custom regexp groups
(`:id(\d+)`), the `?`, `+` and `*` modifiers, and unnamed groups — the whole vocabulary a studio
would reach for to express "a locale prefix of unknown depth". Every one of them compiles under
`URLPattern`.

### 2. v8 wildcards fail silently under `URLPattern`

`URLPattern` has no `*name` syntax. It reads `/*prefix/course/:slug` as a wildcard followed by the
_literal text_ `prefix`, which means the pattern compiles, stops matching `/no/course/intro`, and
starts matching `/marketingprefix/course/intro` instead. A wrong match is worse than a throw, so
`parseRoutePattern` rewrites `*name` to `:name(.*)` and remembers that the group repeats, which
reproduces v8's array-of-segments params exactly (`{prefix: ["a", "b"]}`).

This is the reason a bare `new URLPattern({pathname: route})` is not a safe drop-in.

### 3. Custom regexps must be `v`-flag safe

Native `URLPattern` compiles a pattern's custom regexp groups with the RegExp `v` (`unicodeSets`)
flag; `urlpattern-polyfill@10` still uses `u`. Under `v`, the characters `( ) [ ] { } / - |` are
reserved inside a character class, so patterns that v6 accepted throw on a native implementation
while working on the polyfill:

| Custom regexp | Polyfill (`u`) | Native (`v`) |
| ------------- | -------------- | ------------ |
| `[a-z0-9-]+`  | compiles       | **throws**   |
| `[^/]+`       | compiles       | **throws**   |
| `[\w-]+`      | compiles       | **throws**   |
| `[a-z0-9\-]+` | compiles       | compiles     |

Slug patterns like `/:slug([a-z0-9-]+)` are common, so this would have been a steady trickle of
"works locally, throws in Chrome" reports. `makeVFlagSafe` escapes exactly those characters —
preserving ranges, so `[a-z]` is left alone while `[a-z0-9-]` becomes `[a-z0-9\-]` — and the result
compiles under both flags and matches the same input. `src/vFlagSafeRegexp.test.ts` asserts that
equivalence over a sample of regexps and inputs.

Worth flagging beyond this spike: the same divergence means a route pattern can compile in one
browser and throw in another, depending on which flag that engine's `URLPattern` uses. Normalizing
the regexp before constructing the pattern removes that variable.

### 4. Four `path-to-regexp` defaults have to be re-applied

`getRouteContext` calls `match(path, {decode: decodeURIComponent})`, which brings along defaults
`URLPattern` does not share:

| `path-to-regexp` default                  | `URLPattern` behaviour      | How the matcher re-applies it                                       |
| ----------------------------------------- | --------------------------- | ------------------------------------------------------------------- |
| `sensitive: false`                        | case-sensitive              | `new URLPattern(…, {ignoreCase: true})`                             |
| `strict: false` (optional trailing slash) | exact                       | append `{/}?` to the pathname pattern                               |
| `decode: decodeURIComponent`              | raw, percent-encoded groups | decode each group, falling back to the raw value on malformed input |
| unmatched optional params are absent      | reported as `undefined`     | skip `undefined` groups                                             |

Appending `{/}?` is a faithful translation: it is the `URLPattern` spelling of the `(?:\/)?` that
`strict: false` appends to the generated regexp, and it adds no capturing group. It also fixes the
root case, where `/:path*` has to match `/`.

### 5. `URLPattern` fixes a latent bug

`getRouteContext` matches against `url.pathname`, which is always percent-encoded, so a route pattern
containing non-ASCII text — `/kurs/programmerings-oversikt-på-nett` — could never match under
`path-to-regexp`. `URLPattern` canonicalizes both the pattern and the input, so it matches either
spelling.

### 6. Group order is not stable across implementations, so build params in pattern order

Native `URLPattern` and the polyfill disagree on the key order of `exec()` groups. Presentation
forwards these params straight into a GROQ query, so the matcher iterates its own parsed group list
rather than the `groups` object.

### 7. `{…}` means different things in v6 and v8; `URLPattern` agrees with v6

v8 made a group without a modifier optional, so `/books{/:id}` matches `/books`. In v6 and in
`URLPattern` the group is required, and `{…}?` is how you make it optional. A studio that adopted
`{…}`-as-optional while on v8 needs to add the `?`. This is the only row in the matrix below where
the matcher deliberately follows v6 over v8.

### 8. Remaining limits

- **Duplicate group names throw.** `path-to-regexp` accepts `/:id/:id` (last one wins);
  `URLPattern` rejects it. No plausible route pattern does this, and it fails loudly.
- **Capturing groups inside a custom regexp throw**, e.g. `/:id((\d+))` — as they did in v6, which
  reported `Capturing groups are not allowed`.
- **`urlpattern-polyfill@10.1.0` mishandles pathnames starting with `//`.** It reads
  `//course/intro` as authority `course` plus pathname `/intro`, so `/(.*)` matches the wrong text
  instead of failing. Native `URLPattern` and `path-to-regexp` agree with each other. Worth
  reporting upstream; in practice it needs a preview URL with a doubled slash.
- **Doubled `v`-mode punctuators inside a character class** (`[a&&b]`) are not normalized, because no
  escaping of them is valid under both `u` and `v`. No route pattern has been seen using them.

## Recommendation

Replace `path-to-regexp` in `presentation/useMainDocument.ts` with a `URLPattern`-backed matcher
along the lines of `src/matchRoute.ts` and `src/getRouteContext.ts`. Concretely:

1. Port `parseRoutePattern`, `vFlagSafeRegexp` and `matchRoute` into `sanity/src/presentation/util/`
   and swap the `match()` call in `getRouteContext`.
2. Drop the `path-to-regexp` dependency — `useMainDocument.ts` is its only consumer.
3. Reuse the lazy polyfill import that `resolve-allow-patterns.ts` already performs, so
   `getRouteContext` cannot run before `URLPattern` exists.
4. Keep the compiled matchers in a `Map`, as `src/getRouteContext.ts` does: Presentation resolves the
   route again on every preview URL change, and today it recompiles the pattern each time.
5. Release as a fix, and document that `{…}` without a modifier is required again (finding 7) — the
   only intentional break for studios that migrated to v8 syntax.

Why this beats the alternatives:

- **Staying on v8** keeps asking every affected studio to rewrite working config, and the rewrite is
  not always expressible: v8 has no equivalent of `:locale(en|no|se)`.
- **Pinning v6** works but keeps an unmaintained dependency (v6.3.0 is the last release, published to
  patch a ReDoS advisory) and leaves the encoding bug in finding 5 in place.
- **`URLPattern`** is Baseline Newly available (Chrome/Edge 95, Firefox 142, Safari 26, Node 24),
  needs no new dependency here, and restores the syntax studios wrote in the first place.

## Compatibility matrix

<!-- Generated by `pnpm report` on native URLPattern, v24.19.0 -->

### Which patterns compile

#### Patterns written for path-to-regexp v6

| Pattern                           | path-to-regexp v6 | path-to-regexp v8 | URLPattern matcher |
| --------------------------------- | ----------------- | ----------------- | ------------------ |
| `/`                               | compiles          | compiles          | compiles           |
| `/about`                          | compiles          | compiles          | compiles           |
| `/course/:slug`                   | compiles          | compiles          | compiles           |
| `/:prefix(.*)/course/:slug`       | compiles          | **throws**        | compiles           |
| `/:locale(en\|no\|se)/blog/:slug` | compiles          | **throws**        | compiles           |
| `/:id(\d+)`                       | compiles          | **throws**        | compiles           |
| `/(\d+)`                          | compiles          | **throws**        | compiles           |
| `/(.*)`                           | compiles          | **throws**        | compiles           |
| `/(.*)/end`                       | compiles          | **throws**        | compiles           |
| `/blog/:slug?`                    | compiles          | **throws**        | compiles           |
| `/:locale?/product/:slug`         | compiles          | **throws**        | compiles           |
| `/:path*`                         | compiles          | **throws**        | compiles           |
| `/blog/:slug+`                    | compiles          | **throws**        | compiles           |
| `{/:parts}*`                      | compiles          | **throws**        | compiles           |
| `/prefix{/:rest}*`                | compiles          | **throws**        | compiles           |
| `/:attr1?{-:attr2}?`              | compiles          | **throws**        | compiles           |
| `{-:attr}+`                       | compiles          | **throws**        | compiles           |
| `/api/v:version(\d+)/items`       | compiles          | **throws**        | compiles           |
| `/:slug([a-z0-9-]+)`              | compiles          | **throws**        | compiles           |
| `/books{/:id}`                    | compiles          | compiles          | compiles           |
| `/files/:name.:ext`               | compiles          | compiles          | compiles           |
| `/search/:query`                  | compiles          | compiles          | compiles           |

#### Patterns written for path-to-regexp v8

| Pattern                 | path-to-regexp v6 | path-to-regexp v8 | URLPattern matcher |
| ----------------------- | ----------------- | ----------------- | ------------------ |
| `/*prefix/course/:slug` | **throws**        | compiles          | compiles           |
| `/*splat`               | **throws**        | compiles          | compiles           |
| `/:locale/blog/*rest`   | **throws**        | compiles          | compiles           |
| `/course/:slug`         | compiles          | compiles          | compiles           |

### What they match

#### Patterns written for path-to-regexp v6

| Pattern                           | Pathname                | path-to-regexp v6                  | path-to-regexp v8              | URLPattern matcher                 |
| --------------------------------- | ----------------------- | ---------------------------------- | ------------------------------ | ---------------------------------- |
| `/`                               | `/`                     | `{}`                               | `{}`                           | `{}`                               |
| `/`                               | `/about`                | —                                  | —                              | —                                  |
| `/about`                          | `/about`                | `{}`                               | `{}`                           | `{}`                               |
| `/about`                          | `/about/`               | `{}`                               | `{}`                           | `{}`                               |
| `/about`                          | `/About`                | `{}`                               | `{}`                           | `{}`                               |
| `/about`                          | `/about/us`             | —                                  | —                              | —                                  |
| `/course/:slug`                   | `/course/intro`         | `{slug: "intro"}`                  | `{slug: "intro"}`              | `{slug: "intro"}`                  |
| `/course/:slug`                   | `/course/intro/`        | `{slug: "intro"}`                  | `{slug: "intro"}`              | `{slug: "intro"}`                  |
| `/course/:slug`                   | `/course`               | —                                  | —                              | —                                  |
| `/course/:slug`                   | `/course/intro/extra`   | —                                  | —                              | —                                  |
| `/:prefix(.*)/course/:slug`       | `/no/course/intro`      | `{prefix: "no", slug: "intro"}`    | _throws_                       | `{prefix: "no", slug: "intro"}`    |
| `/:prefix(.*)/course/:slug`       | `/a/b/c/course/intro`   | `{prefix: "a/b/c", slug: "intro"}` | _throws_                       | `{prefix: "a/b/c", slug: "intro"}` |
| `/:prefix(.*)/course/:slug`       | `/course/intro`         | —                                  | _throws_                       | —                                  |
| `/:prefix(.*)/course/:slug`       | `/no/course/intro/`     | `{prefix: "no", slug: "intro"}`    | _throws_                       | `{prefix: "no", slug: "intro"}`    |
| `/:locale(en\|no\|se)/blog/:slug` | `/en/blog/hello`        | `{locale: "en", slug: "hello"}`    | _throws_                       | `{locale: "en", slug: "hello"}`    |
| `/:locale(en\|no\|se)/blog/:slug` | `/no/blog/hello`        | `{locale: "no", slug: "hello"}`    | _throws_                       | `{locale: "no", slug: "hello"}`    |
| `/:locale(en\|no\|se)/blog/:slug` | `/de/blog/hello`        | —                                  | _throws_                       | —                                  |
| `/:id(\d+)`                       | `/123`                  | `{id: "123"}`                      | _throws_                       | `{id: "123"}`                      |
| `/:id(\d+)`                       | `/abc`                  | —                                  | _throws_                       | —                                  |
| `/:id(\d+)`                       | `/123/`                 | `{id: "123"}`                      | _throws_                       | `{id: "123"}`                      |
| `/(\d+)`                          | `/123`                  | `{0: "123"}`                       | _throws_                       | `{0: "123"}`                       |
| `/(\d+)`                          | `/abc`                  | —                                  | _throws_                       | —                                  |
| `/(.*)`                           | `/`                     | `{0: ""}`                          | _throws_                       | `{0: ""}`                          |
| `/(.*)`                           | `/about`                | `{0: "about"}`                     | _throws_                       | `{0: "about"}`                     |
| `/(.*)`                           | `/a/b/c`                | `{0: "a/b/c"}`                     | _throws_                       | `{0: "a/b/c"}`                     |
| `/(.*)`                           | `/about/`               | `{0: "about/"}`                    | _throws_                       | `{0: "about/"}`                    |
| `/(.*)/end`                       | `/a/b/end`              | `{0: "a/b"}`                       | _throws_                       | `{0: "a/b"}`                       |
| `/(.*)/end`                       | `/end`                  | —                                  | _throws_                       | —                                  |
| `/(.*)/end`                       | `/a/end`                | `{0: "a"}`                         | _throws_                       | `{0: "a"}`                         |
| `/blog/:slug?`                    | `/blog`                 | `{}`                               | _throws_                       | `{}`                               |
| `/blog/:slug?`                    | `/blog/`                | `{}`                               | _throws_                       | `{}`                               |
| `/blog/:slug?`                    | `/blog/hello`           | `{slug: "hello"}`                  | _throws_                       | `{slug: "hello"}`                  |
| `/blog/:slug?`                    | `/blog/a/b`             | —                                  | _throws_                       | —                                  |
| `/:locale?/product/:slug`         | `/product/x`            | `{slug: "x"}`                      | _throws_                       | `{slug: "x"}`                      |
| `/:locale?/product/:slug`         | `/en/product/x`         | `{locale: "en", slug: "x"}`        | _throws_                       | `{locale: "en", slug: "x"}`        |
| `/:locale?/product/:slug`         | `/en/no/product/x`      | —                                  | _throws_                       | —                                  |
| `/:path*`                         | `/`                     | `{}`                               | _throws_                       | `{}`                               |
| `/:path*`                         | `/about`                | `{path: ["about"]}`                | _throws_                       | `{path: ["about"]}`                |
| `/:path*`                         | `/a/b/c`                | `{path: ["a","b","c"]}`            | _throws_                       | `{path: ["a","b","c"]}`            |
| `/:path*`                         | `/a/b/c/`               | `{path: ["a","b","c"]}`            | _throws_                       | `{path: ["a","b","c"]}`            |
| `/blog/:slug+`                    | `/blog`                 | —                                  | _throws_                       | —                                  |
| `/blog/:slug+`                    | `/blog/hello`           | `{slug: ["hello"]}`                | _throws_                       | `{slug: ["hello"]}`                |
| `/blog/:slug+`                    | `/blog/a/b`             | `{slug: ["a","b"]}`                | _throws_                       | `{slug: ["a","b"]}`                |
| `{/:parts}*`                      | `/`                     | `{}`                               | _throws_                       | `{}`                               |
| `{/:parts}*`                      | `/a`                    | `{parts: ["a"]}`                   | _throws_                       | `{parts: ["a"]}`                   |
| `{/:parts}*`                      | `/a/b`                  | `{parts: ["a","b"]}`               | _throws_                       | `{parts: ["a","b"]}`               |
| `/prefix{/:rest}*`                | `/prefix`               | `{}`                               | _throws_                       | `{}`                               |
| `/prefix{/:rest}*`                | `/prefix/a/b`           | `{rest: ["a","b"]}`                | _throws_                       | `{rest: ["a","b"]}`                |
| `/:attr1?{-:attr2}?`              | `/`                     | `{}`                               | _throws_                       | `{}`                               |
| `/:attr1?{-:attr2}?`              | `/about`                | `{attr1: "about"}`                 | _throws_                       | `{attr1: "about"}`                 |
| `/:attr1?{-:attr2}?`              | `/about-us`             | `{attr1: "about", attr2: "us"}`    | _throws_                       | `{attr1: "about", attr2: "us"}`    |
| `{-:attr}+`                       | `-a`                    | `{attr: ["a"]}`                    | _throws_                       | `{attr: ["a"]}`                    |
| `{-:attr}+`                       | `-a-b`                  | `{attr: ["a","b"]}`                | _throws_                       | `{attr: ["a","b"]}`                |
| `/api/v:version(\d+)/items`       | `/api/v2/items`         | `{version: "2"}`                   | _throws_                       | `{version: "2"}`                   |
| `/api/v:version(\d+)/items`       | `/api/v/items`          | —                                  | _throws_                       | —                                  |
| `/:slug([a-z0-9-]+)`              | `/about`                | `{slug: "about"}`                  | _throws_                       | `{slug: "about"}`                  |
| `/:slug([a-z0-9-]+)`              | `/ABOUT`                | `{slug: "ABOUT"}`                  | _throws_                       | `{slug: "ABOUT"}`                  |
| `/:slug([a-z0-9-]+)`              | `/a_b`                  | —                                  | _throws_                       | —                                  |
| `/books{/:id}`                    | `/books`                | —                                  | `{}`                           | —                                  |
| `/books{/:id}`                    | `/books/1`              | `{id: "1"}`                        | `{id: "1"}`                    | `{id: "1"}`                        |
| `/files/:name.:ext`               | `/files/report.pdf`     | `{name: "report", ext: "pdf"}`     | `{name: "report", ext: "pdf"}` | `{name: "report", ext: "pdf"}`     |
| `/files/:name.:ext`               | `/files/report`         | —                                  | —                              | —                                  |
| `/search/:query`                  | `/search/hello%20world` | `{query: "hello world"}`           | `{query: "hello world"}`       | `{query: "hello world"}`           |
| `/search/:query`                  | `/search/a%2Fb`         | `{query: "a/b"}`                   | `{query: "a/b"}`               | `{query: "a/b"}`                   |
| `/search/:query`                  | `/search/caf%C3%A9`     | `{query: "café"}`                  | `{query: "café"}`              | `{query: "café"}`                  |

#### Patterns written for path-to-regexp v8

| Pattern                 | Pathname            | path-to-regexp v6 | path-to-regexp v8                    | URLPattern matcher                   |
| ----------------------- | ------------------- | ----------------- | ------------------------------------ | ------------------------------------ |
| `/*prefix/course/:slug` | `/no/course/intro`  | _throws_          | `{prefix: ["no"], slug: "intro"}`    | `{prefix: ["no"], slug: "intro"}`    |
| `/*prefix/course/:slug` | `/a/b/course/intro` | _throws_          | `{prefix: ["a","b"], slug: "intro"}` | `{prefix: ["a","b"], slug: "intro"}` |
| `/*prefix/course/:slug` | `/course/intro`     | _throws_          | —                                    | —                                    |
| `/*prefix/course/:slug` | `/no/course/intro/` | _throws_          | `{prefix: ["no"], slug: "intro"}`    | `{prefix: ["no"], slug: "intro"}`    |
| `/*splat`               | `/`                 | _throws_          | —                                    | —                                    |
| `/*splat`               | `/a`                | _throws_          | `{splat: ["a"]}`                     | `{splat: ["a"]}`                     |
| `/*splat`               | `/a/b`              | _throws_          | `{splat: ["a","b"]}`                 | `{splat: ["a","b"]}`                 |
| `/*splat`               | `/a/`               | _throws_          | `{splat: ["a",""]}`                  | `{splat: ["a",""]}`                  |
| `/:locale/blog/*rest`   | `/en/blog/a/b`      | _throws_          | `{locale: "en", rest: ["a","b"]}`    | `{locale: "en", rest: ["a","b"]}`    |
| `/:locale/blog/*rest`   | `/en/blog`          | _throws_          | —                                    | —                                    |
| `/course/:slug`         | `/course/intro`     | `{slug: "intro"}` | `{slug: "intro"}`                    | `{slug: "intro"}`                    |
| `/course/:slug`         | `/course/intro/`    | `{slug: "intro"}` | `{slug: "intro"}`                    | `{slug: "intro"}`                    |
