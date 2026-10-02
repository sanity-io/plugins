import {COLOR_HUES, COLOR_TINTS, type ColorHueKey} from '@sanity/color'
import {buildPalette, type BuildThemeOptions, type GeneratedColorPalette} from '@sanity/themer'
import {Box, Card, Flex, Grid, Heading, Stack, Text, useRootTheme} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {getContrastRatio, hexToRgb, rgbToHsl} from '@sanity/ui/theme'
import {ToastProvider, useToast} from '@sanity/ui/toast'
import type {ReactNode} from 'react'
import {styled} from 'styled-components'

import {AA_CONTRAST_THRESHOLD, AAA_CONTRAST_THRESHOLD} from './contrast'

function ucfirst(str: string) {
  return str.slice(0, 1).toUpperCase() + str.slice(1)
}

/**
 * The palette that `buildPalette` from `@sanity/themer` generates from the options for the color
 * scheme the story renders in: `black` and `white` are the scheme's backgrounds, `blue` the accent
 * scale and `gray` the text scale.
 */
export function ColorPalette(props: {options: BuildThemeOptions}): ReactNode {
  const {options} = props
  const {scheme} = useRootTheme()
  const palette = buildPalette(options)[scheme]

  return (
    <ToastProvider>
      <Card>
        <Grid
          gridTemplateColumns={[1, 1, 2, 3]}
          gapX={[4, 4, 5]}
          gapY={[5, 5, 6]}
          padding={[4, 5, 6]}
        >
          <ColorHuePreview
            hueKey="background"
            palette={palette}
            tints={[
              {title: 'black', hex: palette.black},
              {title: 'white', hex: palette.white},
            ]}
          />
          {COLOR_HUES.map((hueKey) => (
            <ColorHuePreview
              hueKey={hueKey}
              key={hueKey}
              palette={palette}
              tints={getTints(palette, hueKey)}
            />
          ))}
        </Grid>
      </Card>
    </ToastProvider>
  )
}

interface Tint {
  title: string
  hex: string
}

function getTints(palette: GeneratedColorPalette, hueKey: ColorHueKey): Tint[] {
  return COLOR_TINTS.map((tintKey) => ({
    title: `${hueKey} ${tintKey}`,
    hex: palette[hueKey][tintKey],
  }))
}

function ColorHuePreview(props: {hueKey: string; palette: GeneratedColorPalette; tints: Tint[]}) {
  const {hueKey, palette, tints} = props

  return (
    <Box>
      <Heading as="h2" size={1}>
        {ucfirst(hueKey)}
      </Heading>

      <Stack marginTop={[3, 3, 4]} gap={1}>
        {tints.map((tint) => (
          <ColorTintPreview key={tint.title} palette={palette} tint={tint} />
        ))}
      </Stack>
    </Box>
  )
}

const ColorCard = styled(Card)<{$bg: string; $fg: string}>`
  cursor: pointer;

  --card-bg-color: ${({$bg}) => $bg};
  --card-fg-color: ${({$fg}) => $fg};

  &:not(:disabled):active,
  &:not(:disabled):hover {
    --card-bg-color: ${({$bg}) => $bg} !important;
    --card-fg-color: ${({$fg}) => $fg} !important;
  }
`

/** AA/AAA contrast badge, shown when the tint passes WCAG AA against the given scheme */
function ContrastBadge(props: {contrast: number; scheme: 'dark' | 'light'}) {
  const {contrast, scheme} = props

  if (contrast < AA_CONTRAST_THRESHOLD) return null

  return (
    <Card padding={1} radius={1} scheme={scheme} style={{margin: '-3px 0'}}>
      <Text size={0} weight="bold">
        {contrast >= AAA_CONTRAST_THRESHOLD ? 'AAA' : 'AA'} &middot; {contrast.toFixed(1)}:1
      </Text>
    </Card>
  )
}

function ColorTintPreview(props: {palette: GeneratedColorPalette; tint: Tint}) {
  const {palette, tint} = props
  const hsl = rgbToHsl(hexToRgb(tint.hex))
  const toast = useToast()

  // Against the backgrounds of the generated palette rather than stock black and white
  const contrast = {
    dark: getContrastRatio(tint.hex, palette.black),
    light: getContrastRatio(tint.hex, palette.white),
  }

  const handleClick = () => {
    navigator.clipboard.writeText(tint.hex).then(
      () =>
        toast.push({
          title: (
            <>
              Copied {tint.title} (<code>{tint.hex}</code>) to clipboard
            </>
          ),
        }),
      () => toast.push({status: 'error', title: 'Could not write to clipboard'}),
    )
  }

  return (
    <ColorCard
      $bg={tint.hex}
      $fg={hsl.l < 50 ? palette.white : palette.black}
      __unstable_focusRing
      forwardedAs="button"
      onClick={handleClick}
      radius={2}
    >
      <Flex align="center" gap={2} padding={3}>
        <Box flex={1}>
          <Code size={1} style={{color: 'inherit'}}>
            {tint.title}
          </Code>
        </Box>

        {(contrast.dark >= AA_CONTRAST_THRESHOLD || contrast.light >= AA_CONTRAST_THRESHOLD) && (
          <Flex gap={1}>
            <ContrastBadge contrast={contrast.dark} scheme="dark" />
            <ContrastBadge contrast={contrast.light} scheme="light" />
          </Flex>
        )}

        <Box>
          <Code size={1} style={{color: 'inherit'}}>
            {tint.hex}
          </Code>
        </Box>
      </Flex>
    </ColorCard>
  )
}
