import {Flex} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import type {ComponentProps} from 'react'
import tinycolor from 'tinycolor2'

import type {Color, ColorChangeHandler} from './react-color'

import {colorBox, colorBoxContainer, colorListWrap, swatchBackgroundVar} from './ColorList.css'

function ColorListWrap(props: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={colorListWrap} />
}

function ColorBoxContainer(props: ComponentProps<'div'>) {
  return <div {...props} className={colorBoxContainer} />
}

function ColorBox({backgroundColor}: {backgroundColor: string}) {
  return (
    <div className={colorBox} style={assignInlineVars({[swatchBackgroundVar]: backgroundColor})} />
  )
}

interface ValidatedColor {
  key: string
  color: Color
  backgroundColor: string
}

interface ColorListProps {
  colors?: Array<Color>
  onChange: ColorChangeHandler<Color>
}

const validateColors = (colors: Array<Color>) => {
  const seen = new Set<string>()
  return colors.reduce((cls: Array<ValidatedColor>, c) => {
    // @ts-expect-error fix types later
    const color = c.hex ? tinycolor(c.hex) : tinycolor(c)
    if (color.isValid()) {
      const backgroundColor = color.toRgbString()
      const key = JSON.stringify({color: c, backgroundColor})
      if (!seen.has(key)) {
        seen.add(key)
        cls.push({key, color: c, backgroundColor})
      }
    }
    return cls
  }, [])
}

export function ColorList({colors, onChange}: ColorListProps): React.JSX.Element | null {
  if (!colors) return null
  return (
    <ColorListWrap wrap="wrap">
      {validateColors(colors).map(({key, color, backgroundColor}) => (
        <ColorBoxContainer
          key={key}
          onClick={() => {
            onChange(color)
          }}
        >
          <ColorBox backgroundColor={backgroundColor} />
        </ColorBoxContainer>
      ))}
    </ColorListWrap>
  )
}
