import type {HsvaColor} from '@uiw/react-color'

import {styled} from 'styled-components'
import tinycolor from 'tinycolor2'

import {Flex} from '@sanity/ui'

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
  background: url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADFJREFUOE9jZGBgEGHAD97gk2YcNYBhmIQBgWSAP52AwoAQwJvQRg1gACckQoC2gQgAIF8IscwEtKYAAAAASUVORK5CYII=')
    left center #fff;
`

const ColorBox = styled.div`
  border-radius: inherit;
  box-shadow: inset 0 0 0 1px var(--card-shadow-outline-color);
  content: '';
  position: absolute;
  inset: 0;
  z-index: 1;
`

interface ValidatedColor {
  color: string | ColorValue
  backgroundColor: string
}

interface ColorListProps {
  colors?: Array<string | ColorValue>
  onChange: (color: HsvaColor) => void
}

const validateColors = (colors: Array<string | ColorValue>) =>
  colors.reduce((cls: Array<ValidatedColor>, c) => {
    // @ts-expect-error fix types later
    const color = typeof c === 'string' ? tinycolor(c) : c.hex ? tinycolor(c.hex) : tinycolor(c)
    if (color.isValid()) {
      cls.push({
        color: c,
        backgroundColor: color.toRgbString(),
      })
    }
    return cls
  }, [])

export function ColorList({colors, onChange}: ColorListProps): React.JSX.Element | null {
  if (!colors) return null
  return (
    <ColorListWrap wrap="wrap">
      {validateColors(colors).map(({color, backgroundColor}, idx) => (
        <ColorBoxContainer
          key={`${backgroundColor}-${idx}`}
          onClick={() => {
            const tc = typeof color === 'string' ? tinycolor(color) : tinycolor(color.hex)
            const hsva = tc.toHsv()
            onChange({h: hsva.h, s: hsva.s, v: hsva.v, a: hsva.a})
          }}
        >
          <ColorBox style={{background: backgroundColor}} />
        </ColorBoxContainer>
      ))}
    </ColorListWrap>
  )
}
