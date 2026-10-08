import {Card, type CardTone, Stack, Text} from '@sanity/ui'
import type {ReactNode} from 'react'

import {
  ROBOTS_ACCESS_TOKENS_URL,
  ROBOTS_DASHBOARD_URL,
  ROBOTS_PRICING_URL,
} from '../../robots/capability'
import type {RobotsAdvisory, RobotsCapabilityState} from '../../robots/types'

type CardState = Exclude<RobotsCapabilityState, 'enabled'> | RobotsAdvisory

const COPY: Record<
  CardState,
  {tone: CardTone; title: string; body: (termsUrl: string) => ReactNode}
> = {
  'scope-missing': {
    tone: 'caution',
    title: 'This Mux token can’t use Robots',
    body: () => (
      <>
        The <code>robots:*</code> scope can’t be added to an existing token, so this needs a new
        access token. Create one with the <code>robots:*</code> scope in{' '}
        <a href={ROBOTS_ACCESS_TOKENS_URL} target="_blank" rel="noopener noreferrer">
          your Mux dashboard
        </a>{' '}
        and paste it into the plugin’s Configure API dialog.
      </>
    ),
  },
  'not-enabled': {
    tone: 'primary',
    title: 'Robots isn’t enabled for this Mux account',
    body: (termsUrl) => (
      <>
        Robots runs AI workflows (captions, dubs, summaries, chapters, moderation) on your Mux
        videos, and Mux turns it on once its terms are accepted.{' '}
        <a href={termsUrl} target="_blank" rel="noopener noreferrer">
          Accept the Robots terms in your Mux dashboard
        </a>
        .
      </>
    ),
  },
  'unavailable': {
    tone: 'transparent',
    title: 'Robots isn’t available in this Studio yet',
    body: () => <>It will appear once Sanity’s Mux service is updated.</>,
  },
  'units-exhausted': {
    tone: 'caution',
    title: 'Not enough Mux AI units left this month',
    body: () => (
      <>
        Mux refused the last run. Every Mux account gets 100,000 Mux AI units a month at no cost,
        and this one doesn’t have enough left for it. A cheaper workflow may still fit. Units reset
        next month, or sooner on a paid plan.{' '}
        <a href={ROBOTS_PRICING_URL} target="_blank" rel="noopener noreferrer">
          See Robots pricing
        </a>
        .
      </>
    ),
  },
}

/** Why Robots can't run here (in place of the panel), or a limit it hit (above it). */
export function RobotsCapabilityCard({
  state,
  termsUrl,
}: {
  state: CardState
  termsUrl?: string | undefined
}) {
  const copy = COPY[state]
  return (
    <Card padding={3} radius={2} tone={copy.tone} border>
      <Stack gap={3}>
        <Text size={1} weight="semibold">
          {copy.title}
        </Text>
        <Text size={1}>{copy.body(termsUrl ?? ROBOTS_DASHBOARD_URL)}</Text>
      </Stack>
    </Card>
  )
}
