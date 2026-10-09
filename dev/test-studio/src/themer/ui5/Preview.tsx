import {buildTheme, type ThemePreset} from '@sanity/themer'
import {Badge, Card, Flex, Text, ThemeProvider, useRootTheme} from '@sanity/ui'
import type {ThemeColorSchemeKey} from '@sanity/ui/theme'
import type {ReactNode} from 'react'

import {stockProperties, toStyle, type Ui5Mapping, ui5Properties} from './palette'
import type {TokenSource} from './stylesheet'

import {mono, reference, scope, swatch} from './Ui5Tool.css'

export interface PreviewSettings {
  /** The preset the preview applies, or `null` for the theme the Studio applies */
  preset: ThemePreset | null
  mapping: Ui5Mapping
}

export const SCHEMES: ThemeColorSchemeKey[] = ['light', 'dark']

const STOCK_THEME = buildTheme()

/** What the preview renders, for the probes to tell their readings apart */
export function previewRevision(settings: PreviewSettings): string {
  return `${settings.preset?.slug ?? 'applied'}:${settings.mapping}`
}

/**
 * Applies the screen's theme to what it wraps. For the theme the Studio
 * applies there is nothing to add: v4 already follows it, and v5 would if
 * anything themed it. A preset gets its `buildTheme` theme for v4 and, with
 * a mapping, its palette for v5.
 */
export function PreviewScope({
  children,
  settings,
}: {
  children: ReactNode
  settings: PreviewSettings
}) {
  const {scheme} = useRootTheme()
  const {mapping, preset} = settings

  if (!preset) return children

  return (
    <ThemeProvider scheme={scheme} theme={buildTheme(preset.options)}>
      <div className={scope} style={toStyle(ui5Properties(preset.options, mapping))}>
        {children}
      </div>
    </ThemeProvider>
  )
}

/**
 * Renders what it wraps the way it looks with no theme at all — the stock v4
 * theme and v5 put back to stock — out of sight, for probes to compare with
 */
export function StockReference({children}: {children: ReactNode}) {
  const {scheme} = useRootTheme()

  return (
    <div aria-hidden className={reference} inert style={toStyle(stockProperties())}>
      <ThemeProvider scheme={scheme} theme={STOCK_THEME}>
        {children}
      </ThemeProvider>
    </div>
  )
}

/**
 * A v4 card in the given scheme: the scheme's v4 colors, and the
 * `color-scheme` that v5's `light-dark()`s pick their side with
 */
export function SchemeCard({children, scheme}: {children: ReactNode; scheme: ThemeColorSchemeKey}) {
  return (
    <Card border padding={3} radius={2} scheme={scheme}>
      {children}
    </Card>
  )
}

export function SchemeLabel({scheme}: {scheme: ThemeColorSchemeKey}) {
  return (
    <Text muted size={0} weight="medium">
      {scheme === 'light' ? 'Light' : 'Dark'}
    </Text>
  )
}

/** A color as a probe read it — a swatch and its hex — or a placeholder until it has */
export function ColorValue({value}: {value: string | undefined}) {
  return (
    <Flex align="center" gap={2}>
      <span className={swatch} style={{backgroundColor: value}} />
      <code className={mono}>{value ?? '…'}</code>
    </Flex>
  )
}

/** Whether a color differs from what it is without a theme */
export function ThemedBadge({
  current,
  stock,
}: {
  current: string | undefined
  stock: string | undefined
}) {
  if (current === undefined || stock === undefined) return null

  return current === stock ? (
    <Badge fontSize={0}>stock</Badge>
  ) : (
    <Badge fontSize={0} tone="positive">
      themed
    </Badge>
  )
}

const SOURCE_LABELS: Record<TokenSource, string> = {
  accent: 'accent',
  text: 'text',
  background: 'background',
  stock: 'stock hue',
  fixed: 'fixed',
}

const SOURCE_TONES = {
  accent: 'primary',
  text: 'default',
  background: 'suggest',
  stock: 'neutral',
  fixed: 'caution',
} as const satisfies Record<TokenSource, string>

/**
 * Where a token gets its color from: the Themer option whose scale it reads
 * (accent, text, background), a hue Themer leaves stock, or a fixed color
 */
export function SourceBadges({sources}: {sources: readonly TokenSource[]}) {
  return (
    <Flex gap={1} wrap="wrap">
      {sources.map((source) => (
        <Badge fontSize={0} key={source} tone={SOURCE_TONES[source]}>
          {SOURCE_LABELS[source]}
        </Badge>
      ))}
    </Flex>
  )
}
