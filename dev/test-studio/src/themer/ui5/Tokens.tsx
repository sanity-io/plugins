import {Badge, Box, Card, Flex, Heading, Stack, Text, useRootTheme} from '@sanity/ui'
import type {ThemeColorSchemeKey} from '@sanity/ui/theme'
import * as ui5 from 'ui5'

import {
  type PreviewSettings,
  previewRevision,
  PreviewScope,
  SCHEMES,
  SchemeLabel,
  SourceBadges,
  StockReference,
} from './Preview'
import {probe, type ProbeProperty, useProbeReadings} from './probes'
import {getUi5Stylesheet, scaleHue, type TokenSource, type Ui5Token} from './stylesheet'

import {hueLabel, mono, outlineSwatch, shadowSwatch, strip, swatch, tokenRow} from './Ui5Tool.css'

type Readings = ReadonlyMap<string, string> | undefined
type Variant = 'current' | 'stock'

/** The sources that come from a Themer option, as opposed to a stock hue or a fixed color */
const THEMER_SOURCES: ReadonlySet<TokenSource> = new Set(['accent', 'text', 'background'])

function readsThemer(token: Ui5Token): boolean {
  return token.sources.some((source) => THEMER_SOURCES.has(source))
}

function isFixed(token: Ui5Token): boolean {
  return token.sources.every((source) => source === 'fixed')
}

function probeProperty(token: Ui5Token): ProbeProperty {
  if (/\bsolid\b/.test(token.value)) return 'outline-color'
  if (token.name.startsWith('--shadow-')) return 'box-shadow'

  return 'background-color'
}

function tokenProbeId(name: string, scheme: ThemeColorSchemeKey, variant: Variant, tone = 'root') {
  return `token:${tone}:${name}:${scheme}:${variant}`
}

/** A token painted the way it is used — as a background, an outline or a shadow — which is also its probe */
function TokenSwatch({id, token}: {id: string; token: Ui5Token}) {
  const property = probeProperty(token)
  const value = `var(${token.name})`

  if (property === 'outline-color') {
    return <span className={outlineSwatch} style={{outline: value}} {...probe(id, property)} />
  }
  if (property === 'box-shadow') {
    return <span className={shadowSwatch} style={{boxShadow: value}} {...probe(id, property)} />
  }

  return <span className={swatch} style={{backgroundColor: value}} {...probe(id, property)} />
}

function differsFromStock(readings: Readings, token: Ui5Token, tone?: string): boolean {
  return SCHEMES.some(
    (scheme) =>
      readings?.get(tokenProbeId(token.name, scheme, 'current', tone)) !==
      readings?.get(tokenProbeId(token.name, scheme, 'stock', tone)),
  )
}

function TokenStatus({readings, token}: {readings: Readings; token: Ui5Token}) {
  if (isFixed(token)) {
    return (
      <Badge fontSize={0} tone="caution">
        fixed
      </Badge>
    )
  }
  if (!readsThemer(token)) return <Badge fontSize={0}>stock hue</Badge>
  if (!readings) return null

  return differsFromStock(readings, token) ? (
    <Badge fontSize={0} tone="positive">
      themed
    </Badge>
  ) : (
    <Badge fontSize={0}>stock</Badge>
  )
}

function TokenCell({
  readings,
  scheme,
  token,
}: {
  readings: Readings
  scheme: ThemeColorSchemeKey
  token: Ui5Token
}) {
  const current = readings?.get(tokenProbeId(token.name, scheme, 'current'))
  const stock = readings?.get(tokenProbeId(token.name, scheme, 'stock'))
  const isShadow = probeProperty(token) === 'box-shadow'

  return (
    <Card padding={2} radius={2} scheme={scheme}>
      <Flex align="center" gap={2}>
        <TokenSwatch id={tokenProbeId(token.name, scheme, 'current')} token={token} />
        {!isShadow && (
          <Stack gap={1}>
            <code className={mono}>{current ?? '…'}</code>
            {stock !== undefined && stock !== current && (
              <code className={mono}>stock {stock}</code>
            )}
          </Stack>
        )}
      </Flex>
    </Card>
  )
}

function TokenTable({
  description,
  readings,
  title,
  tokens,
}: {
  description: string
  readings: Readings
  title: string
  tokens: readonly Ui5Token[]
}) {
  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Heading as="h3" size={0}>
          {title}
        </Heading>
        <Text muted size={1}>
          {description}
        </Text>
      </Stack>
      <div className={tokenRow}>
        <Text muted size={0} weight="medium">
          Token
        </Text>
        <Text muted size={0} weight="medium">
          Source
        </Text>
        {SCHEMES.map((scheme) => (
          <SchemeLabel key={scheme} scheme={scheme} />
        ))}
        <Text muted size={0} weight="medium">
          Status
        </Text>
      </div>
      {tokens.map((token) => (
        <div className={tokenRow} key={token.name}>
          <Stack gap={2}>
            <Text size={1} weight="medium">
              <code>{token.name}</code>
            </Text>
            <code className={mono}>{token.value}</code>
          </Stack>
          <SourceBadges sources={token.sources} />
          {SCHEMES.map((scheme) => (
            <TokenCell key={scheme} readings={readings} scheme={scheme} token={token} />
          ))}
          <Box>
            <TokenStatus readings={readings} token={token} />
          </Box>
        </div>
      ))}
    </Stack>
  )
}

function ToneTable({readings}: {readings: Readings}) {
  const {tones} = getUi5Stylesheet()

  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Heading as="h3" size={0}>
          Tones
        </Heading>
        <Text muted size={1}>
          Each <code>sui-tone-*</code> class maps a scale onto <code>--tone-50</code> to{' '}
          <code>--tone-950</code>, and the surface tokens of toned elements read those. Only the
          neutral tone reads a scale Themer replaces.
        </Text>
      </Stack>
      {tones.map(({tone, tokens}) => {
        const themed = tokens.some((token) => differsFromStock(readings, token, tone))

        return (
          <div className={tokenRow} key={tone}>
            <Text size={1} weight="medium">
              <code>.sui-tone-{tone}</code>
            </Text>
            <SourceBadges sources={Array.from(new Set(tokens.flatMap((token) => token.sources)))} />
            {SCHEMES.map((scheme) => (
              <Card key={scheme} padding={2} radius={2} scheme={scheme}>
                <ui5.Box tone={tone}>
                  <div className={strip}>
                    {tokens.map((token) => (
                      <TokenSwatch
                        id={tokenProbeId(token.name, scheme, 'current', tone)}
                        key={token.name}
                        token={token}
                      />
                    ))}
                  </div>
                </ui5.Box>
              </Card>
            ))}
            <Box>
              {readings &&
                (themed ? (
                  <Badge fontSize={0} tone="positive">
                    themed
                  </Badge>
                ) : (
                  <Badge fontSize={0}>stock</Badge>
                ))}
            </Box>
          </div>
        )
      })}
    </Stack>
  )
}

function StockHues({tokens}: {tokens: readonly Ui5Token[]}) {
  const hues = new Map<string, Ui5Token[]>()
  for (const token of tokens) {
    const hue = scaleHue(token.name) ?? token.name
    hues.set(hue, [...(hues.get(hue) ?? []), token])
  }

  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Heading as="h3" size={0}>
          Hues Themer leaves stock
        </Heading>
        <Text muted size={1}>
          Themer only replaces the accent, text and background scales; v5 reads these hues for its
          tones, errors and code tokens.
        </Text>
      </Stack>
      <Card border padding={3} radius={2}>
        <Stack gap={2}>
          {Array.from(hues, ([hue, hueTokens]) => (
            <Flex align="center" gap={3} key={hue}>
              <Box className={hueLabel}>
                <Text muted size={1}>
                  {hue}
                </Text>
              </Box>
              <div className={strip}>
                {hueTokens.map((token) => (
                  <span
                    className={swatch}
                    key={token.name}
                    style={{backgroundColor: `var(${token.name})`}}
                    title={`${token.name}: ${token.value}`}
                  />
                ))}
              </div>
            </Flex>
          ))}
        </Stack>
      </Card>
    </Stack>
  )
}

/** The stock reading of every probe, in each scheme */
function TokenReferences({tokens}: {tokens: readonly Ui5Token[]}) {
  const {tones} = getUi5Stylesheet()

  return (
    <StockReference>
      {SCHEMES.map((scheme) => (
        <Card key={scheme} scheme={scheme}>
          {tokens.map((token) => (
            <TokenSwatch
              id={tokenProbeId(token.name, scheme, 'stock')}
              key={token.name}
              token={token}
            />
          ))}
          {tones.map(({tone, tokens: toneTokens}) => (
            <ui5.Box key={tone} tone={tone}>
              {toneTokens.map((token) => (
                <TokenSwatch
                  id={tokenProbeId(token.name, scheme, 'stock', tone)}
                  key={token.name}
                  token={token}
                />
              ))}
            </ui5.Box>
          ))}
        </Card>
      ))}
    </StockReference>
  )
}

export function Tokens({settings}: {settings: PreviewSettings}) {
  const {theme} = useRootTheme()
  const [ref, readings] = useProbeReadings(previewRevision(settings), theme)
  const {scales, semantic} = getUi5Stylesheet()
  const themerScales = scales.filter(readsThemer)
  const stockHues = scales.filter((token) => !readsThemer(token))
  const fixedTokens = semantic.filter(isFixed)
  const scaleReaders = semantic.filter((token) => !isFixed(token))
  const themerTokens = [...themerScales, ...semantic].filter(readsThemer)
  const themedCount = themerTokens.filter((token) => differsFromStock(readings, token)).length

  return (
    <Stack gap={5} ref={ref}>
      <Stack gap={3}>
        <Heading as="h2" size={1}>
          v5 color tokens
        </Heading>
        <Text muted size={1}>
          Read from the <code>ui5/styles.css</code> this Studio loads, and classified by the scales
          they read in the end. Each color is probed in the preview — light and dark — and compared
          with its stock color.
        </Text>
        {readings && (
          <Text size={1} weight="medium">
            {themedCount} of {themerTokens.length} tokens that read a scale Themer replaces follow
            the previewed theme.
          </Text>
        )}
      </Stack>

      <PreviewScope settings={settings}>
        <Stack gap={5}>
          <TokenTable
            description="The accent replaces the blue scale, the text color the gray scale, and the backgrounds white and black."
            readings={readings}
            title="Scales Themer replaces"
            tokens={themerScales}
          />
          <TokenTable
            description="The tokens v5's components read, declared on :root with the scales they read."
            readings={readings}
            title="Tokens on :root"
            tokens={scaleReaders}
          />
          <TokenTable
            description="Declared on :root as colors rather than read from a scale, so no palette reaches them."
            readings={readings}
            title="Fixed colors"
            tokens={fixedTokens}
          />
          <ToneTable readings={readings} />
        </Stack>
      </PreviewScope>

      <StockHues tokens={stockHues} />

      <TokenReferences tokens={[...themerScales, ...semantic]} />
    </Stack>
  )
}
