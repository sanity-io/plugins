import {AddIcon, TrashIcon} from '@sanity/icons'
import {Box, Button, Card, Flex, Inline, Stack, Text} from '@sanity/ui'
import {
  Alpha,
  Hue,
  type HsvaColor,
  Saturation,
  hsvaToHex,
  hsvaToHsla,
  hsvaToRgba,
} from '@uiw/react-color'
import {startTransition, useOptimistic, useRef} from 'react'
import {type ObjectInputProps, set, setIfMissing, unset} from 'sanity'
import {styled} from 'styled-components'

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

// Subtle checkboard pattern matching react-color original (white=transparent, grey=rgba(0,0,0,.08))
const Checkboard = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  background-image:
    linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.08) 25%,
      transparent 25%,
      transparent 75%,
      rgba(0, 0, 0, 0.08) 75%,
      rgba(0, 0, 0, 0.08)
    ),
    linear-gradient(
      45deg,
      rgba(0, 0, 0, 0.08) 25%,
      transparent 25%,
      transparent 75%,
      rgba(0, 0, 0, 0.08) 75%,
      rgba(0, 0, 0, 0.08)
    );
  background-size: 8px 8px;
  background-position:
    0 0,
    4px 4px;
`

// Custom pointer to match the original react-color vertical bar style
const BarPointer = styled.div<{$left: string}>`
  position: absolute;
  left: ${(props) => props.$left};
  width: 4px;
  height: 100%;
  border-radius: 1px;
  background: #fff;
  box-shadow: rgba(0, 0, 0, 0.6) 0px 0px 2px;
  transform: translateX(-50%);
`

interface PointerProps {
  left?: string
}

const Pointer = ({left = '0%'}: PointerProps) => <BarPointer $left={left} />

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
  const {width, color, onChange, onUnset, disableAlpha, colorList, readOnly} = props
  const {rgb, hex, hsv, hsl} = color

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
                <Saturation
                  hsva={hsv}
                  onChange={handleHsvaChange}
                  style={{width: '100%', height: '100%'}}
                />
              </Card>

              <Card shadow={1} radius={3} style={{position: 'relative', height: '10px'}}>
                <Hue
                  hue={hsv.h}
                  onChange={(newHue) => handleHsvaChange({...hsv, ...newHue})}
                  pointer={Pointer}
                  style={{width: '100%', height: '100%', borderRadius: 'inherit'}}
                />
              </Card>

              {!disableAlpha && (
                <Card
                  shadow={1}
                  radius={3}
                  style={{position: 'relative', height: '10px', background: '#fff'}}
                >
                  <Checkboard style={{borderRadius: 'inherit'}} />
                  <Alpha
                    hsva={hsv}
                    onChange={(newAlpha) => handleHsvaChange({...hsv, ...newAlpha})}
                    pointer={Pointer}
                    style={{width: '100%', height: '100%', borderRadius: 'inherit'}}
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

const DEFAULT_COLOR: ColorValue = {
  hex: '#24a3e3',
  hsl: {h: 200, s: 0.7732, l: 0.5156, a: 1},
  hsv: {h: 200, s: 0.8414, v: 0.8901, a: 1},
  rgb: {r: 46, g: 163, b: 227, a: 1},
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
        <ColorPickerInner
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
