import type {Theme} from '@sanity/ui'

import {black} from '@sanity/color'
import {getTheme_v2} from '@sanity/ui/theme'
import {type PropsWithChildren} from 'react'
import {styled} from 'styled-components'

type Style = PropsWithChildren<{theme: SanityTheme}>
type SanityTheme = Theme['sanity']

export const GraphRoot: React.FC<Style> = styled.div`
  font-family: ${({theme}: Style) => getTheme_v2({sanity: theme}).font.text.family};
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: ${black.hex};
`

export const GraphWrapper: React.FC<Style> = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
` as React.FC<Style>

export const HoverNode: React.FC<Style> = styled.div`
  font-family: ${({theme}: Style) => getTheme_v2({sanity: theme}).font.text.family};
  display: none;
  position: absolute;
  bottom: ${({theme}: Style) => getTheme_v2({sanity: theme}).space[0]}px;
  left: 50%;
  transform: translate3d(-50%, 0, 0);
  background: var(--component-bg);
  border-radius: ${({theme}: Style) => getTheme_v2({sanity: theme}).radius[2]}px;
  padding: ${({theme}: Style) => getTheme_v2({sanity: theme}).space[2]}px;
  z-index: 1000;

  &:empty {
    display: none;
  }
`

export const Legend: React.FC<Style> = styled.div`
  color: #ccc;
  position: absolute;
  top: ${({theme}: Style) => getTheme_v2({sanity: theme}).space[4]}px;
  left: ${({theme}: Style) => getTheme_v2({sanity: theme}).space[4]}px;

  & > div {
    margin: 5px 0;
  }
`

export const LegendRow: React.FC<
  PropsWithChildren<{className?: string; style?: React.CSSProperties}>
> = styled.div`
  display: flex;
`

export const LegendBadge: React.FC<Style> = styled.div`
  width: 1.25em;
  height: 1.25em;
  background: currentColor;
  border-radius: 50%;
  margin-right: ${({theme}: Style) => getTheme_v2({sanity: theme}).space[2]}px;
`
