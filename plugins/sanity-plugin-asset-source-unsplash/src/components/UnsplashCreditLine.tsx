import {Text, Card, useTheme_v2} from '@sanity/ui'
import {type ComponentProps, type CSSProperties} from 'react'

import * as styles from './UnsplashCreditLine.module.css'

/** The live `@sanity/ui` theme's foreground/background colors, read by `UnsplashCreditLine.module.css` */
interface CreditLineColorProperties extends CSSProperties {
  '--creditline-fg': string
  '--creditline-bg': string
}

function CreditLineLink({children, ...props}: ComponentProps<'a'>) {
  return (
    <a {...props} className={styles.creditLineLink}>
      {children}
    </a>
  )
}

function CreditLine(props: ComponentProps<typeof Card>) {
  const {color} = useTheme_v2()
  const colorProperties: CreditLineColorProperties = {
    '--creditline-fg': color.fg,
    '--creditline-bg': color.bg,
  }

  return <Card {...props} className={styles.creditLine} style={colorProperties} />
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
