import {Text, Card} from '@sanity/ui'
import {styled} from 'styled-components'

const CreditLineLink = styled.a`
  text-decoration: none;
  cursor: pointer;
  &:hover,
  &:focus {
    [data-ui='Text'] {
      text-decoration: underline;
    }
  }
`

const CreditLine = styled(Card)`
  ${({theme}) => `
     --creditline-fg: ${theme.sanity.color.card.enabled.fg};
     --creditline-bg: ${theme.sanity.color.card.enabled.bg};
   `};
  -webkit-user-drag: none;
  position: absolute;
  background-color: var(--creditline-bg);
  bottom: 0;

  [data-ui='Text'] {
    color: var(--creditline-fg);
  }
`

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
