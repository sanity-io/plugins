import type {CurrentUser} from 'sanity'

/** Who can run Robots when `allowedRolesForRobots` isn't set. */
export const DEFAULT_ALLOWED_ROLES_FOR_ROBOTS = ['administrator']

/**
 * Whether this user sees the controls that start or cancel Robots runs. Everyone sees results.
 * An empty list opens it to every role. No user means no, so a gap narrows access.
 *
 * A UI guardrail, not a permission: the proxy accepts any project member.
 */
export function canRunRobots(
  user: Pick<CurrentUser, 'roles'> | null | undefined,
  allowedRoles: string[] | undefined,
): boolean {
  if (!user) return false
  const roles = allowedRoles ?? DEFAULT_ALLOWED_ROLES_FOR_ROBOTS
  return roles.length === 0 || user.roles.some((role) => roles.includes(role.name))
}

/** Shown in place of the run controls to someone who can't run Robots. */
export function robotsRunnersOnlyNote(allowedRoles: string[] | undefined): string {
  const roles = allowedRoles ?? DEFAULT_ALLOWED_ROLES_FOR_ROBOTS
  const who =
    roles.length === 1 && roles[0] === 'administrator'
      ? 'Only administrators can run Robots in this Studio. Ask an administrator to run one for you.'
      : `Only these roles can run Robots in this Studio: ${roles.join(', ')}.`
  return `${who} A developer can let more roles run Robots with the plugin’s allowedRolesForRobots option.`
}

/** The upload dialog, above the directives someone who can't run Robots still gets. */
export const ROBOTS_DIRECTIVES_SET_BY_DEVELOPER =
  'These directives run on every upload. A developer sets them in the plugin configuration.'
