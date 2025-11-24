import {startTransition, useDeferredValue, useEffect, useRef, useState} from 'react'
import {
  Alpha,
  Hue,
  Saturation,
  type HsvaColor,
  hsvaToRgba,
  hsvaToHex,
  hsvaToHsla,
  BACKGROUND_IMG,
} from '@uiw/react-color'
import {type ObjectInputProps, set, setIfMissing, unset} from 'sanity'
import {styled} from 'styled-components'
import {useEffectEvent} from 'use-effect-event'

import {AddIcon} from '@sanity/icons'
import {TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Inline, Stack, Text} from '@sanity/ui'

import type {ColorSchemaType, ColorValue} from './types'

import {ColorList} from './ColorList'
import {ColorPickerFields} from './ColorPickerFields'

const ColorBox = styled(Box)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
`

const ReadOnlyContainer = styled(Flex)`
  margin-top: 6rem;
  background-color: var(--card-bg-color);
  position: relative;
  width: 100%;
`

const Checkboard = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url(${BACKGROUND_IMG}) left center;
  background-size: auto 100%;
`

// Custom pointer to match the original react-color style
const BarPointer = ({left, top}: {left?: string; top?: string}) => (
  <div
    style={{
      position: 'absolute',
      width: 4,
      borderRadius: 1,
      boxShadow: 'rgb(0 0 0 / 60%) 0px 0px 2px',
      backgroundColor: '#fff',
      // For horizontal sliders (Hue/Alpha), use left positioning with small vertical margins
      // For vertical, use top positioning with small horizontal margins
      ...(left !== undefined
        ? {left, top: '1px', bottom: '1px'}
        : {top, left: '1px', right: '1px'}),
    }}
  />
)

interface ColorPickerProps {
  width?: string
  disableAlpha: boolean
  colorList?: Array<string | ColorValue> | undefined
  readOnly?: boolean
  onUnset: () => void
  color: ColorValue
  onChange: (color: ColorValue) => void
}

const ColorPickerInner = (props: ColorPickerProps) => {
  const {width, color: {rgb, hex, hsv, hsl}, onChange, onUnset, disableAlpha, colorList, readOnly} =
    props

  if (!hsl || !hsv) {
    return null
  }

  const handleHsvaChange = (newHsva: HsvaColor) => {
    const newRgba = hsvaToRgba(newHsva)
    const newHex = hsvaToHex(newHsva)
    const newHsla = hsvaToHsla(newHsva)
    onChange({
      hex: newHex,
      rgb: newRgba,
      hsv: newHsva,
      hsl: newHsla,
    })
  }

  return (
    <div style={{width}}>
      <Card padding={1} border radius={1}>
        <Stack space={2}>
          {!readOnly && (
            <>
              <Card overflow="hidden" style={{position: 'relative', height: '5em'}}>
                <Saturation hsva={hsv} onChange={handleHsvaChange} style={{width: '100%'}} />
              </Card>

              <Card
                shadow={1}
                radius={3}
                overflow="hidden"
                style={{position: 'relative', height: '10px'}}
              >
                <Hue
                  hue={hsv.h}
                  onChange={(newHue) => handleHsvaChange({...hsv, ...newHue})}
                  pointer={BarPointer}
                  style={{width: '100%'}}
                />
              </Card>

              {!disableAlpha && (
                <Card
                  shadow={1}
                  radius={3}
                  overflow="hidden"
                  style={{position: 'relative', height: '10px', background: '#fff'}}
                >
                  <Alpha
                    hsva={hsv}
                    onChange={(newAlpha) => handleHsvaChange({...hsv, ...newAlpha})}
                    pointer={BarPointer}
                    style={{width: '100%'}}
                  />
                </Card>
              )}
            </>
          )}
          <Flex>
            <Card
              flex={1}
              radius={2}
              overflow="hidden"
              style={{position: 'relative', minWidth: '4em', background: '#fff'}}
            >
              <Checkboard />
              <ColorBox
                style={{
                  backgroundColor: `rgba(${rgb?.r},${rgb?.g},${rgb?.b},${rgb?.a})`,
                }}
              />

              {readOnly && (
                <ReadOnlyContainer
                  padding={2}
                  paddingBottom={1}
                  sizing="border"
                  justify="space-between"
                >
                  <Stack space={3} marginTop={1}>
                    <Text size={3} weight="bold">
                      {hex}
                    </Text>

                    <Inline space={3}>
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
                <Box style={{width: 200}}>
                  <ColorPickerFields
                    rgb={rgb}
                    hsl={hsl}
                    hex={hex}
                    onChange={handleHsvaChange}
                    disableAlpha={disableAlpha}
                  />
                </Box>
                <Box marginLeft={2}>
                  <Button onClick={onUnset} title="Delete color" icon={TrashIcon} tone="critical" />
                </Box>
              </Flex>
            )}
          </Flex>
          {colorList && <ColorList colors={colorList} onChange={handleHsvaChange} />}
        </Stack>
      </Card>
    </div>
  )
}

// Default color used when creating a new color value: a pleasant medium blue (#24a3e3)
const DEFAULT_COLOR: ColorValue = {
  hex: '#24a3e3',
  hsl: {h: 200, s: 0.7732, l: 0.5156, a: 1},
  hsv: {h: 200, s: 0.8414, v: 0.8901, a: 1},
  rgb: {r: 46, g: 163, b: 227, a: 1},
}

export default function ColorInput(props: ObjectInputProps) {
  const {onChange, readOnly} = props
  const value = props.value as ColorValue | undefined
  const type = props.schemaType as ColorSchemaType
  const focusRef = useRef<HTMLButtonElement>(null)

  // use local state so we can have instant ui updates while debouncing patch emits
  const [color, setColor] = useState(value)
  // Marking the `setColor` in a transition allows React to interrupt render should the user start dragging the input before React is finished rendering
  useEffect(() => startTransition(() => setColor(value)), [value])

  // The color picker emits onChange events continuously while the user is sliding the
  // hue/saturation/alpha selectors. This debounces the event to avoid excessive patches
  // and massively improve render performance and avoid jank
  const [emitColor, setEmitColor] = useState<typeof value>(undefined)
  const debouncedColor = useDeferredValue(emitColor)
  const handleChange = useEffectEvent((nextColor: ColorValue) => {
    const fieldPatches = type.fields
      .filter((field) => field.name in nextColor)
      .map((field) => {
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
  })
  useEffect(() => {
    if (!debouncedColor) return undefined
    const raf = requestAnimationFrame(() => handleChange(debouncedColor))
    return () => cancelAnimationFrame(raf)
  }, [debouncedColor])

  const handleCreateColor = () => {
    setColor(DEFAULT_COLOR)
    setEmitColor(DEFAULT_COLOR)
  }

  const handleColorChange = (nextColor: ColorValue) => {
    setColor(nextColor)
    setEmitColor(nextColor)
  }

  const handleUnset = () => {
    setColor(undefined)
    onChange(unset())
  }

  return (
    <>
      {value && value.hex ? (
        <ColorPickerInner
          color={color!}
          onChange={handleColorChange}
          readOnly={readOnly || (typeof type.readOnly === 'boolean' && type.readOnly)}
          disableAlpha={!!type.options?.disableAlpha}
          colorList={type.options?.colorList}
          onUnset={handleUnset}
        />
      ) : (
        <Button
          icon={AddIcon}
          mode="ghost"
          text="Create color"
          ref={focusRef}
          disabled={Boolean(readOnly)}
          onClick={handleCreateColor}
        />
      )}
    </>
  )
}
