import {CheckmarkCircleIcon} from '@sanity/icons/CheckmarkCircle'
import {DocumentIcon} from '@sanity/icons/Document'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {WarningOutlineIcon} from '@sanity/icons/WarningOutline'
import type {BuildThemeOptions} from '@sanity/themer'
import {Box, Card, Flex, Grid, Heading, Stack, Text, useRootTheme} from '@sanity/ui'
import type {ThemeColorSchemeKey} from '@sanity/ui/theme'
import type {ComponentType, ReactNode} from 'react'
import * as ui5 from 'ui5'

import {rootTokensReadingScales, scaleProperties, toStyle, ui5Properties} from './palette'
import {
  ColorValue,
  ColumnLabel,
  type PreviewSettings,
  previewRevision,
  PreviewScope,
  SCHEMES,
  SchemeCard,
  SchemeLabel,
  StockReference,
  ThemedBadge,
} from './Preview'
import {probe, type ProbeProperty, useProbeReadings} from './probes'
import {getUi5Stylesheet} from './stylesheet'

import {usageRow} from './Ui5Tool.css'

type ProbeAttributes = ReturnType<typeof probe>

interface Specimen {
  probeProps: ProbeAttributes
}

/**
 * A specimen of how the Studio renders with `ui5`, next to the v4 component
 * it replaced. Counted in sanity-io/sanity@12b7afd (2026-10-09), where 707
 * files import from `ui5`: Flex in 468 of them, Box in 365, VStack in 273,
 * Text in 126, Grid in 40, Icon in 38 and Container in 36 — the layout
 * components only bring color through their `border*` props.
 */
interface UsageRow {
  id: string
  label: string
  usage: string
  property: ProbeProperty
  V4: ComponentType<Specimen> | null
  V5: ComponentType<Specimen>
}

function V4Text({probeProps}: Specimen) {
  return (
    <Text size={1} {...probeProps}>
      Document title
    </Text>
  )
}

function V5Text({probeProps}: Specimen) {
  return (
    <ui5.Text size={1} {...probeProps}>
      Document title
    </ui5.Text>
  )
}

function V4MutedText({probeProps}: Specimen) {
  return (
    <Text muted size={1} {...probeProps}>
      Edited 2 hours ago
    </Text>
  )
}

function V5MutedText({probeProps}: Specimen) {
  return (
    <ui5.Text muted size={1} {...probeProps}>
      Edited 2 hours ago
    </ui5.Text>
  )
}

function V5CriticalText({probeProps}: Specimen) {
  return (
    <ui5.Text size={1} tone="critical" {...probeProps}>
      Validation error
    </ui5.Text>
  )
}

function V4Icon({probeProps}: Specimen) {
  return (
    <Text size={1}>
      <DocumentIcon {...probeProps} />
    </Text>
  )
}

function V5Icon({probeProps}: Specimen) {
  return <ui5.Icon aria-hidden icon={DocumentIcon} size={1} {...probeProps} />
}

function V4MutedIcon({probeProps}: Specimen) {
  return (
    <Text muted size={1}>
      <DocumentIcon {...probeProps} />
    </Text>
  )
}

function V5MutedIcon({probeProps}: Specimen) {
  return <ui5.Icon aria-hidden icon={DocumentIcon} muted size={1} {...probeProps} />
}

function V4Border({probeProps}: Specimen) {
  return (
    <Card border padding={2} radius={2} {...probeProps}>
      <Text size={1}>Pane</Text>
    </Card>
  )
}

function V5Border({probeProps}: Specimen) {
  return (
    <ui5.Box border padding={2} radius={2} {...probeProps}>
      <ui5.Text size={1}>Pane</ui5.Text>
    </ui5.Box>
  )
}

const USAGE_ROWS: UsageRow[] = [
  {
    id: 'text',
    label: 'Text',
    usage: '231 renders',
    property: 'color',
    V4: V4Text,
    V5: V5Text,
  },
  {
    id: 'text-muted',
    label: 'Text muted',
    usage: '110 renders',
    property: 'color',
    V4: V4MutedText,
    V5: V5MutedText,
  },
  {
    id: 'text-tone',
    label: 'Text tone',
    usage: '37 renders: critical, caution, suggest — hues Themer keeps stock',
    property: 'color',
    V4: null,
    V5: V5CriticalText,
  },
  {
    id: 'icon',
    label: 'Icon',
    usage: '62 renders',
    property: 'color',
    V4: V4Icon,
    V5: V5Icon,
  },
  {
    id: 'icon-muted',
    label: 'Icon muted',
    usage: '14 renders',
    property: 'color',
    V4: V4MutedIcon,
    V5: V5MutedIcon,
  },
  {
    id: 'border',
    label: 'Box border',
    usage: '17 `border*` props across Box, Flex, VStack, Grid and Container',
    property: 'border-top-color',
    V4: V4Border,
    V5: V5Border,
  },
]

type Version = 'v4' | 'v5'
type Variant = 'current' | 'stock'

function usageProbeId(
  row: UsageRow,
  scheme: ThemeColorSchemeKey,
  version: Version,
  variant: Variant,
) {
  return `usage:${row.id}:${scheme}:${version}:${variant}`
}

function UsageCell({
  readings,
  row,
  scheme,
  version,
}: {
  readings: ReadonlyMap<string, string> | undefined
  row: UsageRow
  scheme: ThemeColorSchemeKey
  version: Version
}) {
  const Specimen = version === 'v4' ? row.V4 : row.V5

  if (!Specimen) {
    return (
      <Text muted size={1}>
        —
      </Text>
    )
  }

  const current = readings?.get(usageProbeId(row, scheme, version, 'current'))
  const stock = readings?.get(usageProbeId(row, scheme, version, 'stock'))

  return (
    <Stack gap={2}>
      <Box>
        <Specimen probeProps={probe(usageProbeId(row, scheme, version, 'current'), row.property)} />
      </Box>
      <Flex align="center" gap={2} wrap="wrap">
        <ColorValue value={current} />
        <ThemedBadge current={current} stock={stock} />
      </Flex>
    </Stack>
  )
}

function UsageReferences({scheme}: {scheme: ThemeColorSchemeKey}) {
  return (
    <StockReference>
      <SchemeCard scheme={scheme}>
        {USAGE_ROWS.map((row) => (
          <Box key={row.id}>
            {row.V4 && (
              <row.V4 probeProps={probe(usageProbeId(row, scheme, 'v4', 'stock'), row.property)} />
            )}
            <row.V5 probeProps={probe(usageProbeId(row, scheme, 'v5', 'stock'), row.property)} />
          </Box>
        ))}
      </SchemeCard>
    </StockReference>
  )
}

function StudioUsage({
  readings,
  settings,
}: {
  readings: ReadonlyMap<string, string> | undefined
  settings: PreviewSettings
}) {
  return (
    <Stack gap={4}>
      <Stack gap={3}>
        <Heading as="h2" size={1}>
          What the Studio renders with ui5
        </Heading>
        <Text muted size={1}>
          In sanity-io/sanity, 707 files import from <code>ui5</code> (Oct 2026): Flex (468), Box
          (365), VStack (273), Text (126), Grid (40), Icon (38) and Container (36). Only Text, Icon
          and the <code>border*</code> props of the layout components bring color — each is shown
          next to the v4 component it replaced, and compared with its stock color.
        </Text>
      </Stack>

      <PreviewScope settings={settings}>
        <Grid gap={3} gridTemplateColumns={[1, 1, 2]}>
          {SCHEMES.map((scheme) => (
            <SchemeCard key={scheme} scheme={scheme}>
              <Stack gap={2}>
                <div className={usageRow}>
                  <SchemeLabel scheme={scheme} />
                  <ColumnLabel>v4</ColumnLabel>
                  <ColumnLabel>v5</ColumnLabel>
                </div>
                {USAGE_ROWS.map((row) => (
                  <div className={usageRow} key={row.id}>
                    <Stack gap={2}>
                      <Text size={1} weight="medium">
                        {row.label}
                      </Text>
                      <Text muted size={0}>
                        {row.usage}
                      </Text>
                    </Stack>
                    <UsageCell readings={readings} row={row} scheme={scheme} version="v4" />
                    <UsageCell readings={readings} row={row} scheme={scheme} version="v5" />
                  </div>
                ))}
              </Stack>
            </SchemeCard>
          ))}
        </Grid>
      </PreviewScope>

      {SCHEMES.map((scheme) => (
        <UsageReferences key={scheme} scheme={scheme} />
      ))}
    </Stack>
  )
}

/** A theme that only changes the text color, to show where a replaced scale reaches */
const SCOPE_DEMO_OPTIONS: BuildThemeOptions = {
  light: {text: '#d42a2a'},
  dark: {text: '#d42a2a'},
}

/**
 * The same v5 Text with the demo theme's scales applied below where the
 * tokens are declared — alone, with the tokens declared again, and inside a
 * toned element — and without, to tell which of them actually reach it
 */
function ScopeProbes() {
  return (
    <StockReference>
      <ui5.Text {...probe('scope:stock', 'color')}>Aa</ui5.Text>
      <div style={toStyle(scaleProperties(SCOPE_DEMO_OPTIONS))}>
        <ui5.Text {...probe('scope:scales', 'color')}>Aa</ui5.Text>
        <ui5.Box tone="neutral">
          <ui5.Text {...probe('scope:tone', 'color')}>Aa</ui5.Text>
        </ui5.Box>
      </div>
      <div style={toStyle(ui5Properties(SCOPE_DEMO_OPTIONS, 'tokens'))}>
        <ui5.Text {...probe('scope:tokens', 'color')}>Aa</ui5.Text>
      </div>
    </StockReference>
  )
}

type CheckStatus = 'pass' | 'gap' | 'info'

interface Finding {
  title: string
  status: CheckStatus
  check?: string
  children: ReactNode
}

const STATUS_ICONS = {
  pass: CheckmarkCircleIcon,
  gap: WarningOutlineIcon,
  info: InfoOutlineIcon,
} as const satisfies Record<CheckStatus, ComponentType>

const STATUS_TONES = {
  pass: 'positive',
  gap: 'caution',
  info: 'default',
} as const satisfies Record<CheckStatus, string>

function FindingCard({check, children, status, title}: Finding) {
  const StatusIcon = STATUS_ICONS[status]

  return (
    <Card border padding={3} radius={2} tone={STATUS_TONES[status]}>
      <Flex gap={3}>
        <Text size={1}>
          <StatusIcon />
        </Text>
        <Stack flex={1} gap={3}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
          <Text muted size={1}>
            {children}
          </Text>
          {check && (
            <Text size={1} weight="medium">
              {check}
            </Text>
          )}
        </Stack>
      </Flex>
    </Card>
  )
}

function names(tokens: readonly {name: string}[]): string {
  return tokens.map((token) => token.name).join(', ')
}

/** `#fff` and `#ffffff` alike, as `#ffffff` — the stylesheet comes minified */
function normalizeHex(color: string | undefined): string | undefined {
  return color
    ?.trim()
    .toLowerCase()
    .replace(/^#(\w)(\w)(\w)$/, '#$1$1$2$2$3$3')
}

function stockScaleMismatches(): string[] {
  const {root} = getUi5Stylesheet()

  return Array.from(scaleProperties({}))
    .filter(([name, color]) => normalizeHex(root.get(name)) !== normalizeHex(color))
    .map(([name]) => name)
}

function themingCheck(
  readings: ReadonlyMap<string, string> | undefined,
): Omit<Finding, 'children' | 'title'> {
  if (!readings) return {status: 'info'}

  const differs = (version: Version) =>
    USAGE_ROWS.some(
      (row) =>
        (version === 'v4' ? row.V4 : row.V5) &&
        SCHEMES.some(
          (scheme) =>
            readings.get(usageProbeId(row, scheme, version, 'current')) !==
            readings.get(usageProbeId(row, scheme, version, 'stock')),
        ),
    )

  if (differs('v5')) {
    return {status: 'pass', check: 'v5 follows the previewed theme'}
  }
  if (differs('v4')) {
    return {status: 'gap', check: 'v4 follows the previewed theme, v5 stays stock'}
  }

  return {
    status: 'info',
    check: 'The previewed theme is the stock theme: apply a theme in Themer, or pick a preset',
  }
}

function Findings({readings}: {readings: ReadonlyMap<string, string> | undefined}) {
  const {semantic} = getUi5Stylesheet()
  const scaleMismatches = stockScaleMismatches()
  const scaleCount = scaleProperties({}).size
  const rootTokens = rootTokensReadingScales()
  const fixedTokens = semantic.filter((token) =>
    token.sources.every((source) => source === 'fixed'),
  )
  const accentTokens = semantic.filter((token) => token.sources.includes('accent'))
  const nestedLightDark = CSS.supports(
    'color',
    'light-dark(light-dark(#000, #111), light-dark(#222, #333))',
  )

  const scopeStock = readings?.get('scope:stock')
  const scopeScales = readings?.get('scope:scales')
  const scopeTokens = readings?.get('scope:tokens')
  const scopeTone = readings?.get('scope:tone')
  const rootGotcha = scopeScales === scopeStock && scopeTokens !== scopeStock

  const textRow = USAGE_ROWS.find((row) => row.id === 'text')
  const v5Light = textRow && readings?.get(usageProbeId(textRow, 'light', 'v5', 'current'))
  const v5Dark = textRow && readings?.get(usageProbeId(textRow, 'dark', 'v5', 'current'))

  return (
    <Stack gap={3}>
      <Heading as="h2" size={1}>
        What theming v5 takes
      </Heading>
      <Grid gap={3} gridTemplateColumns={[1, 1, 2]}>
        <FindingCard title="v5 doesn't read the Studio theme" {...themingCheck(readings)}>
          v5 has no <code>ThemeProvider</code>, so the v4 theme Themer builds never reaches it: its
          colors come from the CSS custom properties in <code>ui5/styles.css</code>, which nothing
          in the Studio sets.
        </FindingCard>

        <FindingCard
          check={
            scaleMismatches.length === 0
              ? `All ${scaleCount} v5 scale tokens are @sanity/color's`
              : `Differ from @sanity/color: ${scaleMismatches.join(', ')}`
          }
          status={scaleMismatches.length === 0 ? 'pass' : 'gap'}
          title="Themer's palettes map onto v5's scales"
        >
          v5's stock scales are the palette Themer starts from, so the accent can replace{' '}
          <code>--blue-*</code>, the text color <code>--gray-*</code>, and the backgrounds{' '}
          <code>--white</code> and <code>--black</code>, like they replace those scales for v4.
        </FindingCard>

        <FindingCard
          check={
            nestedLightDark
              ? 'This browser resolves nested light-dark()'
              : "This browser can't nest light-dark()"
          }
          status={nestedLightDark ? 'pass' : 'gap'}
          title="One palette per scheme becomes light-dark() per tint"
        >
          Themer generates a light and a dark palette, while v5 has one set of scales that its{' '}
          <code>light-dark()</code>s pick from. A tint that differs between the palettes becomes{' '}
          <code>light-dark(&lt;light&gt;, &lt;dark&gt;)</code>, nested in v5&apos;s own.
        </FindingCard>

        <FindingCard
          check={
            readings
              ? rootGotcha
                ? `Scales alone leave Text stock (${scopeScales}), declared tokens theme it (${scopeTokens}), so does a toned element (${scopeTone})`
                : `Scales: ${scopeScales}, declared tokens: ${scopeTokens}, toned element: ${scopeTone}, stock: ${scopeStock}`
              : undefined
          }
          status={rootGotcha ? 'gap' : 'info'}
          title="v5's tokens resolve once, on :root"
        >
          {rootTokens.size} tokens read the scales from <code>:root</code> (
          <code>--foreground-high</code>, <code>--separator-low</code>, …) and resolve there, so
          scales replaced on an element further down don&apos;t reach them. A theme has to go on{' '}
          <code>:root</code>, or declare these tokens again where it goes — which Themer&apos;s
          theme cards and split preview need. Only toned elements (<code>sui-tone-*</code>) resolve
          them anew.
        </FindingCard>

        <FindingCard
          check={`Fixed: ${names(fixedTokens)}`}
          status={fixedTokens.length > 0 ? 'gap' : 'pass'}
          title="Some colors no palette reaches"
        >
          These tokens are written as colors rather than read from a scale. Dialog and Popover
          surfaces set no background either, and fall back to the browser&apos;s <code>Canvas</code>{' '}
          and <code>CanvasText</code>.
        </FindingCard>

        <FindingCard
          check={`Read the accent: ${names(accentTokens)}`}
          status="info"
          title="The accent reaches less of v5"
        >
          Primary buttons are neutral in v5 — <code>--background-high-emphasized</code> reads the
          text scale — and links inherit the text color. The accent only colors checked controls,
          selected list items, focus rings and some code tokens.
        </FindingCard>

        <FindingCard
          check={
            v5Light && v5Dark
              ? v5Light === v5Dark
                ? `v5 Text is ${v5Light} in both schemes: light-dark() isn't following color-scheme`
                : `v5 Text follows the cards' schemes (${v5Light} / ${v5Dark})`
              : undefined
          }
          status={v5Light && v5Dark && v5Light === v5Dark ? 'gap' : 'pass'}
          title="Forced schemes need native light-dark()"
        >
          A v4 <code>Card scheme</code> sets <code>color-scheme</code>, which v5&apos;s{' '}
          <code>light-dark()</code> follows — as long as builds keep it native: Lightning CSS
          down-levels it to <code>prefers-color-scheme</code>, which ignores{' '}
          <code>color-scheme</code>. Themer&apos;s split preview relies on it.
        </FindingCard>

        <FindingCard status="info" title="Configured themes stay v4-only">
          <code>defineConfig({'{theme}'})</code> takes a v4 theme, which doesn&apos;t carry its
          palette: a theme made permanent with Themer&apos;s snippet can&apos;t reach v5 until the
          Studio accepts v5 tokens (or a palette) too.
        </FindingCard>

        <FindingCard status="info" title="Themer keeps its palette to itself">
          Themer applies its theme from <code>ThemerProvider</code> and doesn&apos;t expose the
          palette, so the v5 mapping on this screen previews presets. Theming v5 for real means
          applying the scales next to the v4 <code>ThemeProvider</code> there — on{' '}
          <code>:root</code> for the Studio, scoped for theme cards and the split preview.
        </FindingCard>
      </Grid>
    </Stack>
  )
}

export function Overview({settings}: {settings: PreviewSettings}) {
  const {theme} = useRootTheme()
  const [ref, readings] = useProbeReadings(previewRevision(settings), theme)

  return (
    <Stack gap={5} ref={ref}>
      <Findings readings={readings} />
      <StudioUsage readings={readings} settings={settings} />
      <ScopeProbes />
    </Stack>
  )
}
