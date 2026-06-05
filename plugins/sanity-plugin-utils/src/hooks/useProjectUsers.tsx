import {useEffect, useState} from 'react'
import {useClient, useWorkspace} from 'sanity'

type UserRole = {
  name: string
  title: string
}

export type UserExtended = {
  createdAt: string
  displayName: string
  email: string
  familyName: string
  givenName: string
  id: string
  imageUrl: string
  isCurrentUser: boolean
  middleName: string
  projectId: string
  provider: string
  roles?: UserRole[]
  sanityUserId: string
  updatedAt: string
}

type UserResponse = {
  isRobot: boolean
  projectUserId: string
  roles: UserRole[]
}

type HookConfig = {
  apiVersion?: string
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

// Custom hook to fetch user details and roles in batches
export function useProjectUsers({apiVersion}: HookConfig): UserExtended[] {
  const {currentUser} = useWorkspace()
  const client = useClient({apiVersion: apiVersion ?? '2023-01-01'})
  const [users, setUsers] = useState<UserExtended[]>([])

  useEffect(() => {
    const {projectId} = client.config()

    async function getUsersWithRoles() {
      try {
        const aclData = await client.request({
          url: `/projects/${projectId}/acl`,
        })

        const userIds = aclData.map((user: UserResponse) => user.projectUserId)

        const userIdChunks = chunkArray(userIds, 200)

        const userResponses = await Promise.all(
          userIdChunks.map((chunk) =>
            client.request({
              url: `/projects/${projectId}/users/${chunk.join(',')}`,
            }),
          ),
        )

        const usersData: UserExtended[] = userResponses.flat()

        // Combine user details with roles
        const usersWithRoles = usersData.map((user) => {
          const userRoles =
            aclData.find((aclUser: UserResponse) => aclUser.projectUserId === user.id)?.roles || []

          return Object.assign(user, {
            isCurrentUser: user.id === currentUser?.id,
            roles: userRoles,
          })
        })

        setUsers(usersWithRoles)
      } catch (err) {
        console.error('Failed to fetch users:', err)
      }
    }

    if (!users.length) {
      void getUsersWithRoles()
    }
  }, [client, currentUser?.id, users.length])

  return users
}
