import type {HsvaColor} from '@uiw/react-color'

import {Flex} from '@sanity/ui'
import {hexToHsva} from '@uiw/react-color'
import {styled} from 'styled-components'
import tinycolor from 'tinycolor2'

import type {ColorValue} from './types'

const ColorListWrap = styled(Flex)`
  gap: 0.25em;
`

const ColorBoxContainer = styled.div`
  width: 2.1em;
  height: 2.1em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  border-radius: 3px;
  background: repeating-conic-gradient(rgba(0, 0, 0, 0.08) 0% 25%, #fff 0% 50%) 0 0 / 16px 16px;
`

const ColorBox = styled.div`
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px var(--card-shadow-outline-color);
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
`

// Color format interfaces for preset colors
interface RgbColor {
  r: number
  g: number
  b: number
  a?: number
}

interface HslColor {
  h: number
  s: number
  l: number
  a?: number
}

interface HsvColor {
  h: number
  s: number
  v: number
  a?: number
}

interface HexColor {
  hex: string
}

type PresetColor = string | ColorValue | RgbColor | HslColor | HsvColor | HexColor

interface ValidatedColor {
  color: PresetColor
  backgroundColor: string
  hex: string
}

interface ColorListProps {
  colors?: PresetColor[]
  onChange: (color: HsvaColor) => void
}

const validateColors = (colors: PresetColor[]) =>
  colors.reduce((cls: ValidatedColor[], c) => {
    // Handle various color formats: hex string, {hex}, {r,g,b}, {h,s,l}, {h,s,v}
    let color
    if (typeof c === 'string') {
      color = tinycolor(c)
    } else if ('hex' in c && typeof c.hex === 'string') {
      color = tinycolor(c.hex)
    } else if ('r' in c) {
      // RGB(A) format
      color = tinycolor({r: c.r, g: c.g, b: c.b, a: c.a})
    } else if ('h' in c && 's' in c) {
      if ('v' in c) {
        // HSV(A) format
        color = tinycolor.fromRatio({h: c.h / 360, s: c.s / 100, v: c.v / 100, a: c.a ?? 1})
      } else if ('l' in c) {
        // HSL(A) format
        color = tinycolor.fromRatio({h: c.h / 360, s: c.s / 100, l: c.l / 100, a: c.a ?? 1})
      } else {
        return cls
      }
    } else {
      return cls
    }

    if (color && color.isValid()) {
      cls.push({
        color: c,
        backgroundColor: color.toRgbString(),
        hex: color.toHexString(),
      })
    }
    return cls
  }, [])

export function ColorList({colors, onChange}: ColorListProps): React.JSX.Element | null {
  if (!colors) return null
  return (
    <ColorListWrap wrap="wrap">
      {validateColors(colors).map(({backgroundColor, hex}, idx) => (
        <ColorBoxContainer
          key={`${backgroundColor}-${idx}`}
          onClick={() => {
            onChange(hexToHsva(hex))
          }}
        >
          <ColorBox style={{background: backgroundColor}} />
        </ColorBoxContainer>
      ))}
    </ColorListWrap>
  )
}
