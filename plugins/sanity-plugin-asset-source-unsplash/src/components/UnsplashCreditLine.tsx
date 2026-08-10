import {Text, Card, useTheme_v2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {type ComponentProps} from 'react'

import {
  creditLine,
  creditLineBgVar,
  creditLineFgVar,
  creditLineLink,
} from './UnsplashCreditLine.css'

function CreditLineLink({children, ...props}: ComponentProps<'a'>) {
  return (
    <a {...props} className={creditLineLink}>
      {children}
    </a>
  )
}

function CreditLine(props: ComponentProps<typeof Card>) {
  const {color} = useTheme_v2()

  return (
    <Card
      {...props}
      className={creditLine}
      style={assignInlineVars({
        [creditLineFgVar]: color.fg,
        [creditLineBgVar]: color.bg,
      })}
    />
  )
}

const UTM_SOURCE = 'sanity-plugin-asset-source-unsplash'
export function UnsplashCreditLine({
  link,
  id,
  userName,
}: {
  link: string
  id: string
  userName: string
}) {
  const url = new URL(link)
  url.searchParams.set('utm_source', UTM_SOURCE)
  url.searchParams.set('utm_medium', 'referral')

  return (
    <CreditLineLink
      href={url.toString()}
      target={id}
      rel="noreferrer noopener"
      onClick={(event) => event.stopPropagation()}
    >
      <CreditLine padding={1} radius={1} margin={1}>
        <Text size={0} title={`Open image by ${userName} on Unsplash in new window`}>
          By @{userName}
        </Text>
      </CreditLine>
    </CreditLineLink>
  )
}
