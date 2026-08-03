import {AddIcon} from '@sanity/icons/Add'
import {TrashIcon} from '@sanity/icons/Trash'
import {Box, Button, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {startTransition, useOptimistic, useRef, type ComponentProps} from 'react'
import {type ObjectInputProps, set, setIfMissing, unset} from 'sanity'

import {ColorList} from './ColorList'
import {ColorPickerFields} from './ColorPickerFields'
import {
  Alpha,
  Checkboard,
  type Color,
  type ColorState,
  Hue,
  Saturation,
  simpleCheckForValidColor,
  toState,
} from './react-color'
import type {ColorSchemaType, ColorValue} from './types'

import {
  alphaCard,
  colorBox,
  fieldsBox,
  previewBackgroundVar,
  previewCard,
  readOnlyContainer,
  root,
  saturationCard,
  sliderCard,
  widthVar,
} from './ColorInput.css'

function ColorBox({backgroundColor}: {backgroundColor: string}) {
  return (
    <Box className={colorBox} style={assignInlineVars({[previewBackgroundVar]: backgroundColor})} />
  )
}

function ReadOnlyContainer(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={readOnlyContainer} />
}

function FieldsBox(props: ComponentProps<typeof Box>) {
  return <Box {...props} className={fieldsBox} />
}

interface ColorPickerProps {
  width?: string
  disableAlpha: boolean
  colorList?: Array<Color> | undefined
  readOnly?: boolean
  onChange: (color: ColorState) => void
  onUnset: () => void
  color: ColorValue
}

const ColorPicker = (props: ColorPickerProps) => {
  const {
    width,
    color: {rgb, hex, hsv, hsl},
    onChange: onChangeProp,
    onUnset,
    disableAlpha,
    colorList,
    readOnly,
  } = props

  // Remembers the hue across achromatic colors (saturation 0), where the hue
  // can't be recovered from the color value itself. While the color is
  // chromatic the live `hsl` prop is authoritative — so external value changes
  // (undo, remote sync) are picked up — and the ref only bridges achromatic
  // spans. Adapted from react-color's `ColorWrap` HOC (MIT, Copyright (c) 2015
  // Case Sandberg).
  const oldHueRef = useRef(hsl?.h ?? 0)

  const onChange = (data: Color): void => {
    if (!simpleCheckForValidColor(data)) {
      return
    }
    const incomingHue = typeof data === 'string' ? undefined : 'h' in data ? data.h : undefined
    const oldHue = hsl && hsl.s > 0 ? hsl.h : oldHueRef.current
    const nextColor = toState(data, incomingHue || oldHue)
    oldHueRef.current = nextColor.oldHue
    onChangeProp(nextColor)
  }

  if (!hsl || !hsv) {
    return null
  }

  return (
    <div className={root} style={width ? assignInlineVars({[widthVar]: width}) : undefined}>
      <Card padding={1} border radius={1}>
        <Stack gap={2}>
          {!readOnly && (
            <>
              <Card overflow="hidden" className={saturationCard}>
                <Saturation onChange={onChange} hsl={hsl} hsv={hsv} />
              </Card>

              <Card shadow={1} radius={3} overflow="hidden" className={sliderCard}>
                <Hue hsl={hsl} onChange={!readOnly && onChange} />
              </Card>

              {!disableAlpha && (
                <Card shadow={1} radius={3} overflow="hidden" className={alphaCard}>
                  <Alpha rgb={rgb} hsl={hsl} onChange={onChange} />
                </Card>
              )}
            </>
          )}
          <Flex>
            <Card flex={1} radius={2} overflow="hidden" className={previewCard}>
              <Checkboard size={8} white="transparent" grey="rgba(0,0,0,.08)" />
              <ColorBox backgroundColor={`rgba(${rgb?.r},${rgb?.g},${rgb?.b},${rgb?.a})`} />

              {readOnly && (
                <ReadOnlyContainer
                  padding={2}
                  paddingBottom={1}
                  sizing="border"
                  justify="space-between"
                >
                  <Stack gap={3} marginTop={1}>
                    <Text size={3} weight="bold">
                      {hex}
                    </Text>

                    <Inline gap={3}>
                      <Text size={1}>
                        <strong>RGB: </strong>
                        {rgb?.r} {rgb?.g} {rgb?.b}
                      </Text>
                      <Text size={1}>
                        <strong>HSL: </strong> {Math.round(hsl?.h ?? 0)}{' '}
                        {Math.round((hsl?.s ?? 0) * 100)}% {Math.round((hsl?.l ?? 0) * 100)}%
                      </Text>
                    </Inline>
                  </Stack>
                </ReadOnlyContainer>
              )}
            </Card>

            {!readOnly && (
              <Flex align="flex-start" marginLeft={2}>
                <FieldsBox>
                  <ColorPickerFields
                    rgb={rgb}
                    hsl={hsl}
                    hex={hex}
                    onChange={onChange}
                    disableAlpha={disableAlpha}
                  />
                </FieldsBox>
                <Box marginLeft={2}>
                  <Button onClick={onUnset} title="Delete color" icon={TrashIcon} tone="critical" />
                </Box>
              </Flex>
            )}
          </Flex>
          {colorList && <ColorList colors={colorList} onChange={onChange} />}
        </Stack>
      </Card>
    </div>
  )
}

const DEFAULT_COLOR: ColorValue & {source: string} = {
  hex: '#24a3e3',
  hsl: {h: 200, s: 0.7732, l: 0.5156, a: 1},
  hsv: {h: 200, s: 0.8414, v: 0.8901, a: 1},
  rgb: {r: 46, g: 163, b: 227, a: 1},
  source: 'hex',
}

export default function ColorInput(props: ObjectInputProps): React.JSX.Element {
  const {onChange, readOnly} = props
  // oxlint-disable-next-line no-unsafe-type-assertion
  const _value = props.value as ColorValue | undefined
  const [value, setColorOptimistic] = useOptimistic(_value)
  const type = props.schemaType as ColorSchemaType
  const focusRef = useRef<HTMLButtonElement>(null)

  function handleChange(nextColor: ColorValue) {
    const fieldPatches = type.fields
      .filter((field) => field.name in nextColor)
      .map((field) => {
        // oxlint-disable-next-line no-unsafe-type-assertion
        const nextFieldValue = nextColor[field.name as keyof ColorValue]
        const isObject = field.type.jsonType === 'object'
        return set(
          isObject ? Object.assign({_type: field.type.name}, nextFieldValue) : nextFieldValue,
          [field.name],
        )
      })

    onChange([
      setIfMissing({_type: type.name}),
      set(type.name, ['_type']),
      set(nextColor.rgb?.a, ['alpha']),
      ...fieldPatches,
    ])
  }

  return (
    <>
      {value && value.hex ? (
        <ColorPicker
          color={value}
          onChange={(nextColor) =>
            startTransition(() => {
              setColorOptimistic(nextColor)
              handleChange(nextColor)
            })
          }
          readOnly={readOnly || (typeof type.readOnly === 'boolean' && type.readOnly)}
          disableAlpha={!!type.options?.disableAlpha}
          colorList={type.options?.colorList}
          onUnset={() =>
            startTransition(() => {
              setColorOptimistic(undefined)
              onChange(unset())
            })
          }
        />
      ) : (
        <Button
          icon={AddIcon}
          mode="ghost"
          text="Create color"
          ref={focusRef}
          disabled={Boolean(readOnly)}
          onClick={() =>
            startTransition(() => {
              setColorOptimistic(DEFAULT_COLOR)
              handleChange(DEFAULT_COLOR)
            })
          }
        />
      )}
    </>
  )
}
