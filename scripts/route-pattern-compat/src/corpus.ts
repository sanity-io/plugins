/**
 * Route patterns a Presentation `defineDocuments` config can contain, together with the pathnames
 * they are matched against. Shared by the parity tests and the report generator so the findings in
 * the README stay reproducible.
 */
export interface CorpusEntry {
  pattern: string
  description: string
  inputs: string[]
}

/** Patterns written for path-to-regexp v6, i.e. what studios configured before the v8 bump. */
export const V6_CORPUS: CorpusEntry[] = [
  {
    pattern: '/',
    description: 'Root',
    inputs: ['/', '/about'],
  },
  {
    pattern: '/about',
    description: 'Literal segment',
    inputs: ['/about', '/about/', '/About', '/about/us'],
  },
  {
    pattern: '/course/:slug',
    description: 'Named param',
    inputs: ['/course/intro', '/course/intro/', '/course', '/course/intro/extra'],
  },
  {
    pattern: '/:prefix(.*)/course/:slug',
    description: 'Custom regexp param spanning segments (reported in SAPP-4118)',
    inputs: ['/no/course/intro', '/a/b/c/course/intro', '/course/intro', '/no/course/intro/'],
  },
  {
    pattern: '/:locale(en|no|se)/blog/:slug',
    description: 'Custom regexp param restricted to an enum',
    inputs: ['/en/blog/hello', '/no/blog/hello', '/de/blog/hello'],
  },
  {
    pattern: '/:id(\\d+)',
    description: 'Custom regexp param restricted to digits',
    inputs: ['/123', '/abc', '/123/'],
  },
  {
    pattern: '/(\\d+)',
    description: 'Unnamed custom regexp group',
    inputs: ['/123', '/abc'],
  },
  {
    pattern: '/(.*)',
    description: 'Catch-all',
    inputs: ['/', '/about', '/a/b/c', '/about/'],
  },
  {
    pattern: '/(.*)/end',
    description: 'Catch-all followed by a literal',
    inputs: ['/a/b/end', '/end', '/a/end'],
  },
  {
    pattern: '/blog/:slug?',
    description: 'Optional param',
    inputs: ['/blog', '/blog/', '/blog/hello', '/blog/a/b'],
  },
  {
    pattern: '/:locale?/product/:slug',
    description: 'Optional param before literals',
    inputs: ['/product/x', '/en/product/x', '/en/no/product/x'],
  },
  {
    pattern: '/:path*',
    description: 'Zero or more segments',
    inputs: ['/', '/about', '/a/b/c', '/a/b/c/'],
  },
  {
    pattern: '/blog/:slug+',
    description: 'One or more segments',
    inputs: ['/blog', '/blog/hello', '/blog/a/b'],
  },
  {
    pattern: '{/:parts}*',
    description: 'Zero or more segments in a group',
    inputs: ['/', '/a', '/a/b'],
  },
  {
    pattern: '/prefix{/:rest}*',
    description: 'Literal followed by an optional repeated group',
    inputs: ['/prefix', '/prefix/a/b'],
  },
  {
    pattern: '/:attr1?{-:attr2}?',
    description: 'Optional group with a non-slash prefix',
    inputs: ['/', '/about', '/about-us'],
  },
  {
    pattern: '{-:attr}+',
    description: 'Repeated group joined by a non-slash prefix',
    inputs: ['-a', '-a-b'],
  },
  {
    pattern: '/api/v:version(\\d+)/items',
    description: 'Param embedded mid-segment',
    inputs: ['/api/v2/items', '/api/v/items'],
  },
  {
    pattern: '/:slug([a-z0-9-]+)',
    description: 'Custom regexp param with a character class',
    inputs: ['/about', '/ABOUT', '/a_b'],
  },
  {
    pattern: '/books{/:id}',
    description: 'Group without a modifier (required in v6, optional in v8)',
    inputs: ['/books', '/books/1'],
  },
  {
    pattern: '/files/:name.:ext',
    description: 'Two params separated by a dot',
    inputs: ['/files/report.pdf', '/files/report'],
  },
  {
    pattern: '/search/:query',
    description: 'Param carrying percent-encoded characters',
    inputs: ['/search/hello%20world', '/search/a%2Fb', '/search/caf%C3%A9'],
  },
]

/** Patterns written for path-to-regexp v8, i.e. the migration studios were told to make. */
export const V8_CORPUS: CorpusEntry[] = [
  {
    pattern: '/*prefix/course/:slug',
    description: 'v8 wildcard (the SAPP-4118 workaround)',
    inputs: ['/no/course/intro', '/a/b/course/intro', '/course/intro', '/no/course/intro/'],
  },
  {
    pattern: '/*splat',
    description: 'v8 catch-all wildcard',
    inputs: ['/', '/a', '/a/b', '/a/'],
  },
  {
    pattern: '/:locale/blog/*rest',
    description: 'v8 wildcard after named params',
    inputs: ['/en/blog/a/b', '/en/blog'],
  },
  {
    pattern: '/course/:slug',
    description: 'Named param (unchanged between v6 and v8)',
    inputs: ['/course/intro', '/course/intro/'],
  },
]
