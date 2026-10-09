import {buildPalette} from '@sanity/themer'
import type {Tone} from 'ui5'

import ui5StylesCss from 'ui5/styles.css?raw'

/**
 * Where a v5 color token gets its color from, in Themer's terms: from a scale
 * a Themer palette replaces — `--blue-*` for the accent, `--gray-*` for the
 * text, `--white`/`--black` for the backgrounds — from a scale Themer leaves
 * stock (the other hues), or from a color written straight into the
 * stylesheet, which no palette reaches.
 */
export type TokenSource = 'accent' | 'text' | 'background' | 'stock' | 'fixed'

export type CustomPropertyName = `--${string}`

export interface Ui5Token {
  name: CustomPropertyName
  /** The token's definition, as `ui5/styles.css` declares it */
  value: string
  sources: TokenSource[]
}

export interface Ui5Stylesheet {
  /** The scales: `--white`, `--black` and every `--<hue>-<tint>` */
  scales: Ui5Token[]
  /** The color tokens declared on `:root` that are not scales */
  semantic: Ui5Token[]
  /** The `--tone-*` scale of each tone class */
  tones: {tone: Tone; tokens: Ui5Token[]}[]
  /** Every custom property declared on `:root`, colors or not, as declared */
  root: ReadonlyMap<CustomPropertyName, string>
  /** The color tokens the rules of the given classes read, directly or through their own custom properties */
  readBy: (classNames: readonly string[]) => Ui5Token[]
}

export const TONES = [
  'neutral',
  'positive',
  'suggest',
  'caution',
  'critical',
] as const satisfies readonly Tone[]

/** The scales a Themer palette replaces, and the option that replaces them */
const THEMER_SCALES: Partial<Record<string, TokenSource>> = {
  blue: 'accent',
  gray: 'text',
  white: 'background',
  black: 'background',
}

/** The hues of a Themer palette, in its order — the same as v5's: both come from `@sanity/color` */
const PALETTE_ORDER = Object.keys(buildPalette().light)
const PALETTE_HUES = new Set(PALETTE_ORDER)

const SCALE_TOKEN = /^--([a-z]+)(?:-(\d+))?$/
const VAR_REFERENCE = /var\(\s*(--[\w-]+)/g
/** A color written as a literal — a relative color (`rgb(from …)`) reads another color instead */
const LITERAL_COLOR =
  /#[\da-f]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\((?!\s*from\b)/i

function isCustomPropertyName(name: string): name is CustomPropertyName {
  return name.startsWith('--')
}

/** The hue of a scale token — `white`, `black`, or the hue of a `--<hue>-<tint>` — or `null` for any other token */
export function scaleHue(name: string): string | null {
  const [, hue, tint] = SCALE_TOKEN.exec(name) ?? []

  if (!hue || !PALETTE_HUES.has(hue)) return null
  if (hue === 'white' || hue === 'black') return tint === undefined ? hue : null

  return tint === undefined ? null : hue
}

/** Orders scale tokens like a palette: by hue, then by tint — the stylesheet sorts them as text */
function compareScales(a: Ui5Token, b: Ui5Token): number {
  const tint = (name: string) => Number(SCALE_TOKEN.exec(name)?.[2] ?? 0)

  return (
    PALETTE_ORDER.indexOf(scaleHue(a.name) ?? '') - PALETTE_ORDER.indexOf(scaleHue(b.name) ?? '') ||
    tint(a.name) - tint(b.name)
  )
}

function references(value: string): string[] {
  return Array.from(value.matchAll(VAR_REFERENCE), (match) => match[1] ?? '')
}

/**
 * Resolves the sources of every token in `declarations` through the `var()`s
 * they read, down to the scales. A token that reads no color and writes none
 * either — a space, a radius, a transition — has no sources: it is not a
 * color token.
 */
function resolveSources(declarations: ReadonlyMap<string, string>) {
  const resolved = new Map<string, Set<TokenSource>>()

  const resolve = (name: string, visiting: Set<string>): Set<TokenSource> => {
    const hue = scaleHue(name)
    if (hue) return new Set([THEMER_SCALES[hue] ?? 'stock'])

    const cached = resolved.get(name)
    if (cached) return cached

    const value = declarations.get(name)
    if (value === undefined || visiting.has(name)) return new Set()

    visiting.add(name)
    const sources = new Set<TokenSource>()
    for (const reference of references(value)) {
      for (const source of resolve(reference, visiting)) sources.add(source)
    }
    if (LITERAL_COLOR.test(value)) sources.add('fixed')
    visiting.delete(name)

    resolved.set(name, sources)

    return sources
  }

  return (name: string) => resolve(name, new Set())
}

function colorTokens(
  names: Iterable<CustomPropertyName>,
  declarations: ReadonlyMap<string, string>,
): Ui5Token[] {
  const sourcesOf = resolveSources(declarations)
  const tokens: Ui5Token[] = []

  for (const name of names) {
    const sources = sourcesOf(name)
    if (sources.size > 0) {
      tokens.push({name, value: declarations.get(name) ?? '', sources: Array.from(sources)})
    }
  }

  return tokens
}

function collectStyleRules(rules: CSSRuleList, into: CSSStyleRule[]): void {
  for (const rule of Array.from(rules)) {
    if (rule instanceof CSSStyleRule) {
      into.push(rule)
      collectStyleRules(rule.cssRules, into)
    } else if (rule instanceof CSSGroupingRule) {
      collectStyleRules(rule.cssRules, into)
    }
  }
}

function customProperties(rule: CSSStyleRule): Map<CustomPropertyName, string> {
  const properties = new Map<CustomPropertyName, string>()

  for (let index = 0; index < rule.style.length; index++) {
    const name = rule.style.item(index)
    if (isCustomPropertyName(name)) properties.set(name, rule.style.getPropertyValue(name).trim())
  }

  return properties
}

/**
 * Matches the selectors that style a class, as a class selector or a
 * `[class*=…]` attribute selector: `sui-Text` matches `.sui-Text-<hash>` but
 * not `.sui-TextInput-<hash>`
 */
function classPattern(className: string): RegExp {
  return new RegExp(`\\.${className}(?!\\w)|\\[class\\*=["']?${className}`)
}

/**
 * Reads the tokens out of the `ui5/styles.css` this Studio loads, with the
 * browser's own CSS parser — so the screen always shows what the installed
 * v5 alpha declares, rather than a copy that goes stale with the next one.
 */
function parseUi5Stylesheet(css: string): Ui5Stylesheet {
  const sheet = new CSSStyleSheet()
  sheet.replaceSync(css)

  const rules: CSSStyleRule[] = []
  collectStyleRules(sheet.cssRules, rules)

  const root = new Map<CustomPropertyName, string>()
  const toned = new Map<CustomPropertyName, string>()
  const toneClasses = new Map<string, Map<CustomPropertyName, string>>()

  for (const rule of rules) {
    const selector = rule.selectorText.replaceAll(/["']/g, '')

    if (selector === ':root') {
      for (const [name, value] of customProperties(rule)) root.set(name, value)
    } else if (selector === '[class*=sui-tone]') {
      for (const [name, value] of customProperties(rule)) toned.set(name, value)
    } else if (selector.startsWith('.sui-tone-')) {
      toneClasses.set(selector.slice('.sui-tone-'.length), customProperties(rule))
    }
  }

  const rootTokens = colorTokens(root.keys(), root)

  const tones = TONES.map((tone) => {
    const own = toneClasses.get(tone) ?? new Map<CustomPropertyName, string>()
    const declarations = new Map<string, string>([...root, ...toned, ...own])

    return {tone, tokens: colorTokens(own.keys(), declarations)}
  })

  // What a component reads, classified the way it renders without a tone:
  // the `:root` definitions, the tokens only toned elements declare, and the
  // `--tone-*` scale — whose source depends on the tone, so it gets them all
  const globalTokens = new Map<string, Ui5Token>(rootTokens.map((token) => [token.name, token]))
  const tonedOnly = Array.from(toned.keys()).filter((name) => !root.has(name))
  for (const token of colorTokens(tonedOnly, new Map([...root, ...toned]))) {
    globalTokens.set(token.name, token)
  }
  for (const {tokens} of tones) {
    for (const token of tokens) {
      const sources = new Set([...(globalTokens.get(token.name)?.sources ?? []), ...token.sources])
      globalTokens.set(token.name, {...token, sources: Array.from(sources)})
    }
  }

  const readBy = (classNames: readonly string[]): Ui5Token[] => {
    const patterns = classNames.map(classPattern)
    const matched = rules.filter((rule) =>
      patterns.some((pattern) => pattern.test(rule.selectorText)),
    )
    // A component's own custom properties (`--background-color`, …) only
    // pass a global token on, so they are followed through to it
    const local = new Map<string, string>()
    for (const rule of matched) {
      for (const [name, value] of customProperties(rule)) {
        if (!globalTokens.has(name)) local.set(name, value)
      }
    }

    const read = new Map<CustomPropertyName, Ui5Token>()
    const follow = (value: string, visiting: Set<string>) => {
      for (const reference of references(value)) {
        const token = globalTokens.get(reference)
        if (token) {
          read.set(token.name, token)
        } else if (!visiting.has(reference)) {
          visiting.add(reference)
          follow(local.get(reference) ?? '', visiting)
        }
      }
    }
    for (const rule of matched) follow(rule.style.cssText, new Set())

    return Array.from(read.values())
  }

  return {
    scales: rootTokens.filter((token) => scaleHue(token.name) !== null).toSorted(compareScales),
    semantic: rootTokens.filter((token) => scaleHue(token.name) === null),
    tones,
    root,
    readBy,
  }
}

let parsed: Ui5Stylesheet | undefined

export function getUi5Stylesheet(): Ui5Stylesheet {
  parsed ??= parseUi5Stylesheet(ui5StylesCss)

  return parsed
}
