import {Stack, Spinner, Box, Text, Button} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useObservable} from 'react-rx'
import {BehaviorSubject, catchError, from, map, of, startWith, switchMap} from 'rxjs'
import {type Role, type User, useUserStore} from 'sanity'

import {DashboardWidgetContainer} from '../../components/DashboardWidgetContainer'
import {useVersionedClient} from '../../versionedClient'
import {ProjectUser} from './ProjectUser'

function getInviteUrl(projectId: string) {
  return `https://manage.sanity.io/projects/${projectId}/members`
}

interface Member {
  id: string
  roles: Role[]
  isRobot: boolean
  isCurrentUser: boolean
  createdAt: string
}

interface Project {
  id: string
  members: Member[]
}

type ProjectUsersState =
  | {status: 'loading'}
  | {status: 'error'; error: Error}
  | {status: 'success'; project: Project; users: User[]}

const INITIAL_STATE: ProjectUsersState = {status: 'loading'}

export function ProjectUsers() {
  const [retry$] = useState(() => new BehaviorSubject(0))
  const userStore = useUserStore()
  const versionedClient = useVersionedClient()

  const state$ = useMemo(
    () =>
      retry$.pipe(
        switchMap(() => {
          const {projectId} = versionedClient.config()
          return versionedClient.observable
            .request<Project>({
              uri: `/projects/${projectId}`,
              tag: 'dashboard.project-users',
            })
            .pipe(
              switchMap((_project) =>
                from(userStore.getUsers(_project.members.map((mem) => mem.id))).pipe(
                  map((_users) => ({project: _project, users: _users})),
                ),
              ),
              map(({users: _users, project: _project}) => {
                const users = (Array.isArray(_users) ? _users : [_users]).sort((userA, userB) =>
                  sortUsersByRobotStatus(userA, userB, _project),
                )
                return {status: 'success' as const, project: _project, users}
              }),
              startWith({status: 'loading' as const}),
              catchError((e: Error) => of({status: 'error' as const, error: e})),
            )
        }),
      ),
    [retry$, userStore, versionedClient],
  )

  const state = useObservable(state$, INITIAL_STATE)

  const handleRetryFetch = useCallback(() => {
    retry$.next(retry$.getValue() + 1)
  }, [retry$])

  if (state.status === 'error') {
    return (
      <DashboardWidgetContainer header="Project users">
        <Box padding={4}>
          <Stack gap={3}>
            <Text>Something went wrong while fetching data.</Text>
            <Box>
              <Button
                mode="ghost"
                text="Retry"
                title="Retry users fetch"
                onClick={handleRetryFetch}
              />
            </Box>
          </Stack>
        </Box>
      </DashboardWidgetContainer>
    )
  }

  const isLoading = state.status === 'loading'
  const project = state.status === 'success' ? state.project : undefined
  const users = state.status === 'success' ? state.users : undefined

  return (
    <DashboardWidgetContainer
      header="Project users"
      footer={
        <Button
          style={{width: '100%'}}
          paddingX={2}
          paddingY={4}
          mode="bleed"
          tone="primary"
          text="Manage members"
          as="a"
          loading={isLoading}
          href={isLoading || !project ? undefined : getInviteUrl(project.id)}
        />
      }
    >
      {isLoading && (
        <Box paddingY={5} paddingX={2}>
          <Stack gap={4}>
            <Text align="center" muted size={1}>
              <Spinner />
            </Text>
            <Text align="center" size={1} muted>
              Loading items…
            </Text>
          </Stack>
        </Box>
      )}

      {!isLoading && project && users && (
        <Stack gap={3} padding={3}>
          {users.map((user) => {
            const membership = project.members.find((member) => member.id === user.id)
            return (
              <ProjectUser
                key={user.id}
                user={user}
                isRobot={membership?.isRobot ?? false}
                roles={membership?.roles.map((role) => role.title) || []}
              />
            )
          })}
        </Stack>
      )}
    </DashboardWidgetContainer>
  )
}

function sortUsersByRobotStatus(userA: User, userB: User, project: Project) {
  const {members} = project
  const membershipA = members.find((member) => member.id === userA?.id)
  const membershipB = members.find((member) => member.id === userB?.id)

  // On ties, sort by when the user was added
  if (membershipA?.isRobot === membershipB?.isRobot) {
    return (membershipA?.createdAt || '') > (membershipB?.createdAt || '') ? 1 : -1
  }

  // Robots go to the bottom
  return membershipA?.isRobot ? 1 : -1
}
