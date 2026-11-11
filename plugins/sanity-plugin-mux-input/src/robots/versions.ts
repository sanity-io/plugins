import {activeJobs} from './records'
import type {RobotsApiVersion, RobotsJob, RobotsLinks} from './types'

/**
 * Jobs, directives and their runs answer only on the Robots API version that created them; the
 * other version answers 404. The Studio starts new work on v1, and still reads what v0 created:
 * jobs from before the upgrade, and the runs and jobs of v0 directives attached to uploads.
 */

/** The version every job and directive run the Studio starts goes to. */
export const ROBOTS_API_VERSION: RobotsApiVersion = 'v1'

const LINKED_VERSION = /^\/robots\/(v0|v1)\//

/** The version a list summary's `_links.self.href` names, if it names one. */
export function linkedVersion(item: {
  _links?: RobotsLinks | undefined
}): RobotsApiVersion | undefined {
  const href = item._links?.self?.href
  const match = typeof href === 'string' ? LINKED_VERSION.exec(href) : null
  return match ? (match[1] as RobotsApiVersion) : undefined
}

/** Workflows v1 doesn't have, so their jobs can only be v0's. */
const V0_ONLY_WORKFLOWS: ReadonlySet<string> = new Set(['find-scenes'])

/**
 * The versions to read a job on, in order. A listed job names its own. Anything else (a create's
 * response, a record Mux no longer lists) is tried on v1 first, where the Studio creates jobs.
 */
export function jobVersions(job: Pick<RobotsJob, 'workflow' | '_links'>): RobotsApiVersion[] {
  const linked = linkedVersion(job)
  if (linked) return [linked]
  return V0_ONLY_WORKFLOWS.has(job.workflow) ? ['v0'] : ['v1', 'v0']
}

/**
 * Workflows with a v0 job in progress, from a Studio on an older plugin or a v0 directive. v1
 * refuses a duplicate with a 409 only within its own version, so a run of one of these bills twice.
 */
export function workflowsRunningOnV0(jobs: RobotsJob[]): ReadonlySet<string> {
  return new Set(
    activeJobs(jobs)
      .filter((job) => linkedVersion(job) === 'v0')
      .map((job) => job.workflow),
  )
}
