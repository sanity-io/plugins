// Adapted from https://github.com/sanity-io/sanity/blob/next/packages/sanity/src/desk/components/TimeAgo.tsx
import {useRelativeTime} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

export interface TimeAgoProps {
  time: string | Date
}

export function TimeAgo({time}: TimeAgoProps) {
  const timeAgo = useRelativeTime(time, {useTemporalPhrase: true})

  return <span title={timeAgo}>{timeAgo}</span>
}
