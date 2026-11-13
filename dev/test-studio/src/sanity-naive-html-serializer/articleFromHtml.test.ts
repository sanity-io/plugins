import {expect, test, vi} from 'vitest'

import {articleFromHtml} from './articleFromHtml'
import {formatHtml} from './formatHtml'

vi.spyOn(console, 'warn').mockImplementation(() => {})

const linkKey = 'link-key'
const mark = encodeURIComponent(
  JSON.stringify({
    _key: linkKey,
    _type: 'link',
    href: 'https://example.com/old',
    blank: true,
  }),
)

const html = `<html><head>
<meta name="_id" content="article-1">
<meta name="_rev" content="1">
<meta name="_type" content="naiveHtmlSerializerArticle">
</head><body>
<div class="naiveHtmlSerializerArticle" id="article-1" data-type="object">
<span class="title">Hello</span>
<span class="snippet">A short snippet</span>
<div class="content" data-type="array">
<p id="block-1"><a href="https://example.com/old" data-pt-mark="${mark}">First</a> middle <a href="https://example.com/old" data-pt-mark="${mark}">Second</a></p>
</div>
</div>
</body></html>`

test('article HTML imports onto title, snippet, and content', () => {
  const result = articleFromHtml(html)
  expect(result.ok).toBe(true)
  if (!result.ok) return

  expect(result.fields.title).toBe('Hello')
  expect(result.fields.snippet).toBe('A short snippet')
  expect(result.fields).not.toHaveProperty('_id')
  expect(result.fields).not.toHaveProperty('_rev')
  expect(result.fields.content).toHaveLength(1)
  expect(result.fields.content?.[0]).toMatchObject({
    _key: 'block-1',
    markDefs: [{_key: linkKey, _type: 'link', href: 'https://example.com/old', blank: true}],
  })
})

test('pretty-printed HTML keeps an edited href and one shared mark', () => {
  const edited = formatHtml(html).replaceAll(
    'href="https://example.com/old"',
    'href="https://translated.example/nueva"',
  )
  const result = articleFromHtml(edited)
  expect(result.ok).toBe(true)
  if (!result.ok) return

  expect(result.fields.content?.[0]).toMatchObject({
    markDefs: [
      {_key: linkKey, _type: 'link', href: 'https://translated.example/nueva', blank: true},
    ],
  })
})

test('empty and foreign HTML are rejected', () => {
  expect(articleFromHtml('  ').ok).toBe(false)
  expect(articleFromHtml('<p>Just a paragraph</p>').ok).toBe(false)

  const foreign = html.replace(
    'name="_type" content="naiveHtmlSerializerArticle"',
    'name="_type" content="lesson"',
  )
  const result = articleFromHtml(foreign)
  expect(result.ok).toBe(false)
  if (result.ok) return
  expect(result.message).toContain('lesson')
})
