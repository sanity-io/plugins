import {AddIcon} from '@sanity/icons/Add'
import {DocumentIcon} from '@sanity/icons/Document'
import {EditIcon} from '@sanity/icons/Edit'
import {
  Badge,
  Button,
  Card,
  Checkbox,
  Flex,
  Grid,
  Heading,
  Label,
  Radio,
  Select,
  Spinner,
  Stack,
  Switch,
  Text,
  TextInput,
} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {Menu, MenuItem} from '@sanity/ui/menu'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ComponentType, useId, useState} from 'react'
import * as ui5 from 'ui5'

import {
  type PreviewSettings,
  PreviewScope,
  SCHEMES,
  SchemeCard,
  SchemeLabel,
  SourceBadges,
} from './Preview'
import {getUi5Stylesheet, TONES} from './stylesheet'

import {catalogRow, mono} from './Ui5Tool.css'

interface CatalogEntry {
  name: string
  /** The v5 classes whose rules color the component */
  classes: readonly string[]
  /** What to try, for colors that only show in a state */
  hint?: string
  V4?: ComponentType
  V5: ComponentType
}

const CODE_SAMPLE = "const theme = buildTheme({light: {accent: '#556bfc'}}) // 1 palette per scheme"

function LayoutV4() {
  return (
    <Flex gap={2} wrap="wrap">
      <Card border padding={2} radius={2}>
        <Text size={1}>border</Text>
      </Card>
      <Card padding={2} radius={2} tone="neutral">
        <Text size={1}>tone</Text>
      </Card>
      <Card padding={2} radius={2} shadow={2}>
        <Text size={1}>shadow</Text>
      </Card>
    </Flex>
  )
}

function LayoutV5() {
  return (
    <ui5.Flex flexWrap="wrap" gap={2}>
      <ui5.Box border padding={2} radius={2}>
        <ui5.Text size={1}>border</ui5.Text>
      </ui5.Box>
      <ui5.Box padding={2} radius={2} tone="neutral">
        <ui5.Text size={1}>tone</ui5.Text>
      </ui5.Box>
      <ui5.Box padding={2} radius={2} shadow={2}>
        <ui5.Text size={1}>shadow</ui5.Text>
      </ui5.Box>
    </ui5.Flex>
  )
}

function CardV4() {
  return (
    <Flex gap={2} wrap="wrap">
      {(['default', ...TONES] as const).map((tone) => (
        <Card border key={tone} padding={2} radius={2} tone={tone}>
          <Text size={1}>{tone}</Text>
        </Card>
      ))}
    </Flex>
  )
}

function CardV5() {
  return (
    <ui5.Flex flexWrap="wrap" gap={2}>
      <ui5.Card density="compact">
        <ui5.Text size={1}>no tone</ui5.Text>
      </ui5.Card>
      {TONES.map((tone) => (
        <ui5.Card density="compact" key={tone} tone={tone}>
          <ui5.Text size={1}>{tone}</ui5.Text>
        </ui5.Card>
      ))}
    </ui5.Flex>
  )
}

function TextV4() {
  return (
    <Stack gap={3}>
      <Text size={1}>Default</Text>
      <Text muted size={1}>
        Muted
      </Text>
      <Text accent size={1}>
        Accent
      </Text>
    </Stack>
  )
}

function TextV5() {
  return (
    <ui5.VStack gap={2}>
      <ui5.Text size={1}>Default</ui5.Text>
      <ui5.Text muted size={1}>
        Muted
      </ui5.Text>
      <ui5.HStack gap={2}>
        {TONES.map((tone) => (
          <ui5.Text key={tone} size={1} tone={tone}>
            {tone}
          </ui5.Text>
        ))}
      </ui5.HStack>
    </ui5.VStack>
  )
}

function HeadingV4() {
  return (
    <Stack gap={3}>
      <Heading as="h3" size={2}>
        Heading
      </Heading>
      <Heading as="h4" muted size={1}>
        Muted heading
      </Heading>
    </Stack>
  )
}

function HeadingV5() {
  return (
    <ui5.VStack gap={2}>
      <ui5.Heading as="h3" size={2}>
        Heading
      </ui5.Heading>
      <ui5.Heading as="h4" muted size={1}>
        Muted heading
      </ui5.Heading>
    </ui5.VStack>
  )
}

function EyebrowV4() {
  return (
    <Stack gap={3}>
      <Label size={1}>Label</Label>
      <Label muted size={1}>
        Muted label
      </Label>
    </Stack>
  )
}

function EyebrowV5() {
  return (
    <ui5.VStack gap={2}>
      <ui5.Eyebrow size={1}>Eyebrow</ui5.Eyebrow>
      <ui5.Eyebrow muted size={1}>
        Muted eyebrow
      </ui5.Eyebrow>
    </ui5.VStack>
  )
}

function LabelV5() {
  return (
    <ui5.VStack gap={2}>
      <ui5.Label>Label</ui5.Label>
      <ui5.Label disabled>Disabled label</ui5.Label>
      <ui5.Label error>Label with an error</ui5.Label>
    </ui5.VStack>
  )
}

function CodeV4() {
  return (
    <Code language="ts" size={1}>
      {CODE_SAMPLE}
    </Code>
  )
}

function CodeV5() {
  return (
    <ui5.Code language="ts" size={1}>
      {CODE_SAMPLE}
    </ui5.Code>
  )
}

function LinkV4() {
  return (
    <Text size={1}>
      Read about{' '}
      <a href="https://www.sanity.io/ui" rel="noopener noreferrer" target="_blank">
        Sanity UI
      </a>
    </Text>
  )
}

function LinkV5() {
  return (
    <ui5.Text size={1}>
      Read about{' '}
      <ui5.Link href="https://www.sanity.io/ui" openInNewTab>
        Sanity UI
      </ui5.Link>
    </ui5.Text>
  )
}

function IconV4() {
  return (
    <Flex gap={3}>
      <Text size={2}>
        <DocumentIcon />
      </Text>
      <Text muted size={2}>
        <DocumentIcon />
      </Text>
    </Flex>
  )
}

function IconV5() {
  return (
    <ui5.HStack gap={3}>
      <ui5.Icon aria-hidden icon={DocumentIcon} size={2} />
      <ui5.Icon aria-hidden icon={DocumentIcon} muted size={2} />
      <ui5.Icon aria-hidden icon={DocumentIcon} size={2} tone="critical" />
    </ui5.HStack>
  )
}

function ButtonV4() {
  return (
    <Flex gap={2} wrap="wrap">
      <Button text="Primary" tone="primary" />
      <Button mode="ghost" text="Ghost" />
      <Button mode="bleed" text="Bleed" />
      <Button text="Critical" tone="critical" />
      <Button disabled text="Disabled" tone="primary" />
    </Flex>
  )
}

function ButtonV5() {
  return (
    <ui5.Flex flexWrap="wrap" gap={2}>
      <ui5.Button level="primary" text="Primary" />
      <ui5.Button level="secondary" text="Secondary" />
      <ui5.Button level="tertiary" text="Tertiary" />
      <ui5.Button level="primary" text="Critical" tone="critical" />
      <ui5.Button disabled level="primary" text="Disabled" />
    </ui5.Flex>
  )
}

function IconButtonV4() {
  return (
    <Flex gap={2}>
      <Button icon={AddIcon} mode="ghost" />
      <Button icon={EditIcon} mode="bleed" />
    </Flex>
  )
}

function IconButtonV5() {
  return (
    <ui5.HStack gap={2}>
      <ui5.IconButton aria-label="Add" icon={AddIcon} level="secondary" />
      <ui5.IconButton aria-label="Edit" icon={EditIcon} level="tertiary" />
    </ui5.HStack>
  )
}

function BadgeV4() {
  return (
    <Flex gap={2} wrap="wrap">
      {(['default', ...TONES] as const).map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </Flex>
  )
}

function BadgeV5() {
  return (
    <ui5.Flex flexWrap="wrap" gap={2}>
      <ui5.Badge text="no tone" />
      {TONES.map((tone) => (
        <ui5.Badge key={tone} text={tone} tone={tone} />
      ))}
    </ui5.Flex>
  )
}

function IndicatorV5() {
  return (
    <ui5.HStack gap={3}>
      {TONES.map((tone) => (
        <ui5.Indicator key={tone} label={tone} tone={tone} />
      ))}
      <ui5.IndicatorStack>
        <ui5.Indicator label="positive" tone="positive" />
        <ui5.Indicator label="caution" tone="caution" />
        <ui5.Indicator label="critical" tone="critical" />
      </ui5.IndicatorStack>
    </ui5.HStack>
  )
}

function CheckboxV4() {
  return (
    <Stack gap={3}>
      <Flex align="center" gap={2}>
        <Checkbox aria-label="Unchecked" />
        <Checkbox aria-label="Checked" defaultChecked />
        <Checkbox aria-label="Indeterminate" indeterminate />
        <Checkbox aria-label="Disabled" defaultChecked disabled />
      </Flex>
    </Stack>
  )
}

function CheckboxV5() {
  return (
    <ui5.Flex flexWrap="wrap" gap={3}>
      <ui5.Checkbox label="Off" />
      <ui5.Checkbox defaultChecked label="On" />
      <ui5.Checkbox indeterminate label="Mixed" />
      <ui5.Checkbox defaultChecked disabled label="Disabled" />
      <ui5.Checkbox defaultChecked error label="Error" />
    </ui5.Flex>
  )
}

function RadioV4() {
  const name = useId()

  return (
    <Flex align="center" gap={2}>
      <Radio aria-label="Off" name={name} />
      <Radio aria-label="On" defaultChecked name={name} />
      <Radio aria-label="Disabled" defaultChecked disabled />
    </Flex>
  )
}

function RadioV5() {
  const name = useId()

  return (
    <ui5.Flex flexWrap="wrap" gap={3}>
      <ui5.Radio label="Off" name={name} />
      <ui5.Radio defaultChecked label="On" name={name} />
      <ui5.Radio defaultChecked disabled label="Disabled" />
      <ui5.Radio defaultChecked error label="Error" />
    </ui5.Flex>
  )
}

function SwitchV4() {
  return (
    <Flex align="center" gap={2}>
      <Switch aria-label="Off" />
      <Switch aria-label="On" defaultChecked />
      <Switch aria-label="Disabled" defaultChecked disabled />
    </Flex>
  )
}

function SwitchV5() {
  return (
    <ui5.Flex flexWrap="wrap" gap={3}>
      <ui5.Switch label="Off" />
      <ui5.Switch defaultChecked label="On" />
      <ui5.Switch defaultChecked disabled label="Disabled" />
      <ui5.Switch defaultChecked error label="Error" />
    </ui5.Flex>
  )
}

function TextInputV4() {
  return (
    <Stack gap={2}>
      <TextInput aria-label="Value" defaultValue="Value" />
      <TextInput aria-label="Placeholder" placeholder="Placeholder" />
      <TextInput aria-label="Invalid" customValidity="Invalid" defaultValue="Invalid" />
      <TextInput aria-label="Disabled" defaultValue="Disabled" disabled />
    </Stack>
  )
}

function TextInputV5() {
  return (
    <ui5.VStack gap={2}>
      <ui5.TextInput aria-label="Value" defaultValue="Value" />
      <ui5.TextInput aria-label="Placeholder" placeholder="Placeholder" />
      <ui5.TextInput aria-invalid aria-label="Invalid" defaultValue="Invalid" hasError />
      <ui5.TextInput aria-label="Disabled" defaultValue="Disabled" disabled />
    </ui5.VStack>
  )
}

function SelectV4() {
  return (
    <Stack gap={2}>
      <Select aria-label="Option" defaultValue="a">
        <option value="a">Option</option>
        <option value="b">Another option</option>
      </Select>
      <Select aria-label="Disabled" defaultValue="a" disabled>
        <option value="a">Disabled</option>
      </Select>
    </Stack>
  )
}

function SelectV5() {
  return (
    <ui5.VStack gap={2}>
      <ui5.Select aria-label="Option" defaultValue="a">
        <option value="a">Option</option>
        <option value="b">Another option</option>
      </ui5.Select>
      <ui5.Select aria-label="Invalid" defaultValue="a" hasError>
        <option value="a">Invalid</option>
      </ui5.Select>
      <ui5.Select aria-label="Disabled" defaultValue="a" disabled>
        <option value="a">Disabled</option>
      </ui5.Select>
    </ui5.VStack>
  )
}

function ListV4() {
  return (
    <Menu>
      <MenuItem icon={DocumentIcon} selected text="Selected document" />
      <MenuItem icon={DocumentIcon} text="Another document" />
    </Menu>
  )
}

function ListV5() {
  return (
    <ui5.List>
      <ui5.List.ButtonItem selected start={<ui5.Icon aria-hidden icon={DocumentIcon} size={1} />}>
        <ui5.List.ItemText subtitle="Article" title="Selected document" />
      </ui5.List.ButtonItem>
      <ui5.List.ButtonItem start={<ui5.Icon aria-hidden icon={DocumentIcon} size={1} />}>
        <ui5.List.ItemText subtitle="Article" title="Another document" />
      </ui5.List.ButtonItem>
    </ui5.List>
  )
}

function SpinnerV4() {
  return (
    <Flex gap={3}>
      <Spinner />
      <Spinner muted />
    </Flex>
  )
}

function SpinnerV5() {
  return <ui5.Spinner />
}

function DividerV4() {
  return (
    <Stack gap={2}>
      <Text size={1}>Above</Text>
      <Card borderTop />
      <Text size={1}>Below</Text>
    </Stack>
  )
}

function DividerV5() {
  return (
    <ui5.VStack gap={2}>
      <ui5.Text size={1}>Above</ui5.Text>
      <ui5.Divider />
      <ui5.Text size={1}>Below</ui5.Text>
    </ui5.VStack>
  )
}

function PressAreaV5() {
  return (
    <ui5.PressArea>
      <ui5.Text size={1}>Press area</ui5.Text>
    </ui5.PressArea>
  )
}

function TooltipV4() {
  return (
    <Tooltip content={<Text size={1}>Tooltip</Text>} padding={2}>
      <Button mode="ghost" text="Hover" />
    </Tooltip>
  )
}

function TooltipV5() {
  return (
    <ui5.Tooltip content={<ui5.Text size={1}>Tooltip</ui5.Text>}>
      <ui5.Button level="secondary" text="Hover" />
    </ui5.Tooltip>
  )
}

function PopoverV5() {
  return (
    <ui5.Popover content={<ui5.Text size={1}>Popover content</ui5.Text>}>
      <ui5.Button level="secondary" text="Open" />
    </ui5.Popover>
  )
}

function DialogV5() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <ui5.Button level="secondary" onClick={() => setOpen(true)} text="Open" />
      <ui5.Dialog header="Dialog" onClose={() => setOpen(false)} open={open}>
        <ui5.Text size={1}>A v5 dialog, in the scheme of the card it opened from.</ui5.Text>
      </ui5.Dialog>
    </>
  )
}

function SkipToContentV5() {
  return <ui5.SkipToContent href="#ui5-components" label="Skip to content" />
}

const CATALOG: CatalogEntry[] = [
  {
    name: 'Box, Flex, Grid, Container',
    classes: ['sui-Box', 'sui-Flex', 'sui-Grid', 'sui-Container', 'sui-border', 'sui-shadow2'],
    V4: LayoutV4,
    V5: LayoutV5,
  },
  {name: 'Card', classes: ['sui-Card', 'sui-border'], V4: CardV4, V5: CardV5},
  {name: 'Text', classes: ['sui-Text', 'sui-text-muted'], V4: TextV4, V5: TextV5},
  {name: 'Heading', classes: ['sui-Heading', 'sui-text-muted'], V4: HeadingV4, V5: HeadingV5},
  {name: 'Eyebrow', classes: ['sui-Eyebrow', 'sui-text-muted'], V4: EyebrowV4, V5: EyebrowV5},
  {name: 'Label', classes: ['sui-Label', 'sui-Text', 'sui-text-muted'], V5: LabelV5},
  {name: 'Code', classes: ['sui-Code'], V4: CodeV4, V5: CodeV5},
  {
    name: 'Link',
    classes: ['sui-Link'],
    hint: 'Focus to see the focus ring',
    V4: LinkV4,
    V5: LinkV5,
  },
  {name: 'Icon', classes: ['sui-Icon', 'sui-text-muted'], V4: IconV4, V5: IconV5},
  {
    name: 'Button',
    classes: ['sui-Button', 'sui-button-level'],
    hint: 'Hover and focus too',
    V4: ButtonV4,
    V5: ButtonV5,
  },
  {
    name: 'IconButton',
    classes: ['sui-IconButton', 'sui-Button', 'sui-button-level'],
    V4: IconButtonV4,
    V5: IconButtonV5,
  },
  {name: 'Badge', classes: ['sui-Badge'], V4: BadgeV4, V5: BadgeV5},
  {
    name: 'Indicator, IndicatorStack',
    classes: ['sui-Indicator', 'sui-IndicatorStack'],
    V5: IndicatorV5,
  },
  {
    name: 'Checkbox',
    classes: ['sui-Checkbox', 'sui-CheckboxInput', 'sui-CheckboxMark'],
    V4: CheckboxV4,
    V5: CheckboxV5,
  },
  {
    name: 'Radio',
    classes: ['sui-Radio', 'sui-RadioInput', 'sui-RadioMark'],
    V4: RadioV4,
    V5: RadioV5,
  },
  {
    name: 'Switch',
    classes: ['sui-Switch', 'sui-SwitchInput', 'sui-SwitchMark'],
    V4: SwitchV4,
    V5: SwitchV5,
  },
  {name: 'TextInput', classes: ['sui-TextInput'], V4: TextInputV4, V5: TextInputV5},
  {name: 'Select', classes: ['sui-Select'], V4: SelectV4, V5: SelectV5},
  {
    name: 'List',
    classes: ['sui-List', 'sui-ListButtonItem', 'sui-ListItemImage'],
    hint: 'Hover and focus too',
    V4: ListV4,
    V5: ListV5,
  },
  {name: 'Spinner', classes: ['sui-Spinner'], V4: SpinnerV4, V5: SpinnerV5},
  {name: 'Divider', classes: ['sui-Divider', 'sui-border'], V4: DividerV4, V5: DividerV5},
  {
    name: 'PressArea',
    classes: ['sui-PressArea'],
    hint: 'Focus to see the focus ring',
    V5: PressAreaV5,
  },
  {name: 'Tooltip', classes: ['sui-Tooltip', 'sui-shadow2'], V4: TooltipV4, V5: TooltipV5},
  {name: 'Popover', classes: ['sui-PopoverContent', 'sui-shadow2'], V5: PopoverV5},
  {name: 'Dialog', classes: ['sui-Dialog', 'sui-shadow3'], V5: DialogV5},
  {
    name: 'SkipToContent',
    classes: ['sui-SkipToContent'],
    hint: "Meant to show on focus, but visibleOnFocus adds the class sui-sui-visually-hidden-visible, which ui5/styles.css doesn't match",
    V5: SkipToContentV5,
  },
]

function CatalogRow({entry}: {entry: CatalogEntry}) {
  const tokens = getUi5Stylesheet().readBy(entry.classes)
  const sources = Array.from(new Set(tokens.flatMap((token) => token.sources))).toSorted()
  const {V4, V5} = entry

  return (
    <div className={catalogRow}>
      <Stack gap={3} paddingY={3}>
        <Text size={1} weight="semibold">
          {entry.name}
        </Text>
        {entry.hint && (
          <Text muted size={0}>
            {entry.hint}
          </Text>
        )}
        <SourceBadges sources={sources} />
        {tokens.length > 0 && (
          <span className={mono}>{tokens.map((token) => token.name).join(' ')}</span>
        )}
      </Stack>
      {SCHEMES.map((scheme) => (
        <SchemeCard key={scheme} scheme={scheme}>
          <Grid gap={3} gridTemplateColumns={2}>
            <Stack gap={3}>
              <Text muted size={0} weight="medium">
                v4
              </Text>
              {V4 ? (
                <V4 />
              ) : (
                <Text muted size={1}>
                  —
                </Text>
              )}
            </Stack>
            <Stack gap={3}>
              <Text muted size={0} weight="medium">
                v5
              </Text>
              <V5 />
            </Stack>
          </Grid>
        </SchemeCard>
      ))}
    </div>
  )
}

export function Components({settings}: {settings: PreviewSettings}) {
  return (
    <Stack gap={4} id="ui5-components">
      <Stack gap={3}>
        <Heading as="h2" size={1}>
          Every v5 component
        </Heading>
        <Text muted size={1}>
          The components of <code>@sanity/ui@5</code> next to their v4 counterparts, with the tokens
          their rules read and where those get their color from. HStack, VStack, Inline,
          VisuallyHidden and TooltipGroup bring no color of their own.
        </Text>
      </Stack>
      <div className={catalogRow}>
        <span />
        {SCHEMES.map((scheme) => (
          <SchemeLabel key={scheme} scheme={scheme} />
        ))}
      </div>
      <PreviewScope settings={settings}>
        <Stack gap={3}>
          {CATALOG.map((entry) => (
            <CatalogRow entry={entry} key={entry.name} />
          ))}
        </Stack>
      </PreviewScope>
    </Stack>
  )
}
