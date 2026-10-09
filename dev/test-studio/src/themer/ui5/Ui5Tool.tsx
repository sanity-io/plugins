import {presets} from '@sanity/themer'
import {
  Badge,
  Box,
  Card,
  Flex,
  Heading,
  Select,
  Stack,
  Tab,
  TabList,
  TabPanel,
  Text,
} from '@sanity/ui'
import uiPackage from '@sanity/ui/package.json'
import {type ChangeEvent, useState} from 'react'
import sanityPackage from 'sanity/package.json'
import {useRouter} from 'sanity/router'
import ui5Package from 'ui5/package.json'

import {Components} from './Components'
import {Overview} from './Overview'
import type {Ui5Mapping} from './palette'
import type {PreviewSettings} from './Preview'
import {Tokens} from './Tokens'

import {header, intro, mappingControl, root, themeControl} from './Ui5Tool.css'

const SECTIONS = [
  {name: 'overview', title: 'Overview'},
  {name: 'components', title: 'Components'},
  {name: 'tokens', title: 'Tokens'},
] as const

type SectionName = (typeof SECTIONS)[number]['name']

const MAPPINGS: {value: Ui5Mapping; title: string}[] = [
  {value: 'off', title: 'Off — v5 as the Studio renders it'},
  {value: 'scales', title: 'Scales, on the preview'},
  {value: 'tokens', title: 'Scales and :root tokens, on the preview'},
]

/** The theme picker's value for the theme the Studio applies — Themer's, or the configured one */
const APPLIED_THEME = 'applied'

/** The `@sanity/ui` v5 version `sanity` aliases as `ui5`, from its `npm:@sanity/ui@<version>` range */
const SANITY_UI5_VERSION = /@([^@]+)$/.exec(sanityPackage.dependencies.ui5)?.[1]

function isMapping(value: string): value is Ui5Mapping {
  return MAPPINGS.some((mapping) => mapping.value === value)
}

function isSection(value: unknown): value is SectionName {
  return SECTIONS.some((section) => section.name === value)
}

function Section({name, settings}: {name: SectionName; settings: PreviewSettings}) {
  switch (name) {
    case 'overview':
      return <Overview settings={settings} />
    case 'components':
      return <Components settings={settings} />
    case 'tokens':
      return <Tokens settings={settings} />
    default: {
      const unknown: never = name
      throw new Error(`Unknown section: ${String(unknown)}`)
    }
  }
}

/**
 * A screen to explore how far Themer's themes reach into `ui5` — the
 * `@sanity/ui` v5 alpha that `sanity` renders next to v4 — and what theming
 * it fully would take: the v5 components the Studio uses next to the v4 ones
 * they replace, every v5 component, and every v5 color token, under the
 * theme the Studio applies or a preset whose palette the screen can map onto
 * v5's custom properties.
 */
export default function Ui5Tool() {
  const router = useRouter()
  const section = isSection(router.state['section']) ? router.state['section'] : 'overview'
  const [theme, setTheme] = useState<string>(APPLIED_THEME)
  const [mapping, setMapping] = useState<Ui5Mapping>('off')
  const preset = presets.find((candidate) => candidate.slug === theme) ?? null
  const settings: PreviewSettings = {preset, mapping}
  const ui5Mismatch = SANITY_UI5_VERSION !== ui5Package.version

  const handleThemeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTheme(event.currentTarget.value)
  }
  const handleMappingChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const {value} = event.currentTarget
    if (isMapping(value)) setMapping(value)
  }

  return (
    <div className={root}>
      <Card borderBottom className={header} padding={4}>
        <Stack gap={4}>
          <Flex align="flex-start" gap={4} justify="space-between" wrap="wrap">
            <Stack className={intro} flex={1} gap={3}>
              <Heading as="h1" size={2}>
                Theming @sanity/ui v5
              </Heading>
              <Text muted size={1}>
                The Studio renders <code>@sanity/ui</code> v4 and the v5 alpha side by side, v5
                imported as <code>ui5</code>. v5 has no <code>ThemeProvider</code> and doesn&apos;t
                read the Studio theme: it is styled by CSS custom properties from{' '}
                <code>ui5/styles.css</code>. Apply a theme in Themer, or preview a preset here and
                map its palette onto v5, to see what theming v5 takes.
              </Text>
              <Flex gap={2} wrap="wrap">
                <Badge fontSize={0}>@sanity/ui {uiPackage.version}</Badge>
                <Badge fontSize={0} tone="primary">
                  ui5 {ui5Package.version}
                </Badge>
                {ui5Mismatch && (
                  <Badge fontSize={0} tone="critical">
                    sanity renders ui5 {SANITY_UI5_VERSION ?? 'unknown'}: align the test
                    studio&apos;s alias
                  </Badge>
                )}
              </Flex>
            </Stack>
            <Flex gap={3} wrap="wrap">
              <Stack className={themeControl} gap={2}>
                <Text as="label" htmlFor="ui5-theme" size={1} weight="medium">
                  Theme
                </Text>
                <Select fontSize={1} id="ui5-theme" onChange={handleThemeChange} value={theme}>
                  <option value={APPLIED_THEME}>Applied in the Studio (Themer)</option>
                  {presets.map((candidate) => (
                    <option key={candidate.slug} value={candidate.slug}>
                      Preset: {candidate.title}
                    </option>
                  ))}
                </Select>
              </Stack>
              <Stack className={mappingControl} gap={2}>
                <Text as="label" htmlFor="ui5-mapping" size={1} weight="medium">
                  Map the palette onto v5
                </Text>
                <Select
                  disabled={!preset}
                  fontSize={1}
                  id="ui5-mapping"
                  onChange={handleMappingChange}
                  value={preset ? mapping : 'off'}
                >
                  {MAPPINGS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.title}
                    </option>
                  ))}
                </Select>
                {!preset && (
                  <Text muted size={0}>
                    Themer doesn&apos;t expose the palette it applies: pick a preset to map one
                  </Text>
                )}
              </Stack>
            </Flex>
          </Flex>
          <TabList gap={1}>
            {SECTIONS.map(({name, title}) => (
              <Tab
                aria-controls={`ui5-panel-${name}`}
                id={`ui5-tab-${name}`}
                key={name}
                label={title}
                onClick={() => router.navigate(name === 'overview' ? {} : {section: name})}
                selected={section === name}
              />
            ))}
          </TabList>
        </Stack>
      </Card>
      <Box padding={4}>
        <TabPanel aria-labelledby={`ui5-tab-${section}`} id={`ui5-panel-${section}`}>
          <Section name={section} settings={settings} />
        </TabPanel>
      </Box>
    </div>
  )
}
