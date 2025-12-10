import {Text} from '@sanity/ui'
import {useCallback, useEffect} from 'react'

import type {UnsplashPhoto} from '../types'

import {CreditLine, CreditLineLink, Root} from './Photo.styled'

type Props = {
  data: UnsplashPhoto
  width: number
  height: number
  onClick: (photo: UnsplashPhoto) => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  active: boolean
  onFocus: (photo: UnsplashPhoto) => void
}

const UTM_SOURCE = 'sanity-plugin-asset-source-unsplash'

export default function Photo(props: Props) {
  const {onClick, data, onKeyDown, onFocus, active, width, height} = props

  const handleClick = useCallback(() => {
    onClick(data)
  }, [onClick, data])

  const handleCreditLineClicked = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.stopPropagation()
      const url = `${data.links.html}?utm_source=${encodeURIComponent(
        UTM_SOURCE,
      )}&utm_medium=referral`
      window.open(url, data.id, 'noreferrer,noopener')
    },
    [data],
  )

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown(event)
      if (event.keyCode === 13) {
        onClick(data)
      }
    },
    [onKeyDown, data, onClick],
  )

  const handleMouseDown = useCallback(() => {
    onFocus(data)
  }, [onFocus, data])

  useEffect(() => {
    if (active) {
      onFocus(data)
    }
  }, [active, data, onFocus])

  const src = data.urls.small
  const userName = data.user.name

  return (
    <Root
      title={`Select image by ${userName} from Unsplash`}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={handleMouseDown}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundImage: `url("${src}")`,
      }}
      onClick={handleClick}
    >
      <CreditLineLink onClick={handleCreditLineClicked}>
        <CreditLine padding={2} radius={2} margin={2}>
          <Text size={1} title={`Open image by ${userName} on Unsplash in new window`}>
            By @{data.user.username}
          </Text>
        </CreditLine>
      </CreditLineLink>
    </Root>
  )
}
