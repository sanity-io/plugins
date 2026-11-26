import {useRelativeTime} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

export interface TimeAgoProps {
  time: string | Date
}

export function TimeAgo({time}: TimeAgoProps) {
  const timeAgo = useRelativeTime(time)

  return <span title={timeAgo}>{timeAgo} ago</span>
}
