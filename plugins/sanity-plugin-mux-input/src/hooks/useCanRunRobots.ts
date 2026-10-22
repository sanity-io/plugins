import {useCurrentUser} from 'sanity'

import {canRunRobots} from '../robots/access'
import type {MuxInputConfig} from '../util/types'

/** Whether the current user sees the controls that start or cancel Robots runs. */
export function useCanRunRobots(config: Pick<MuxInputConfig, 'allowedRolesForRobots'>): boolean {
  const user = useCurrentUser()
  return canRunRobots(user, config.allowedRolesForRobots)
}
