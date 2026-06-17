import {Box, Card, Stack, Heading, Grid, Label, Text, Code, Button} from '@sanity/ui'
import {useEffect, useMemo, useState} from 'react'
import {type Subscription} from 'rxjs'

import {DashboardWidgetContainer} from '../../components/DashboardWidgetContainer'
import {WidgetContainer} from '../../containers/WidgetContainer'
import {type DashboardWidget} from '../../types'
import {useVersionedClient} from '../../versionedClient'
import {type App, type ProjectInfoProps, type ProjectData, type UserApplication} from './types'

function isUrl(url?: string) {
  return url && /^https?:\/\//.test(url)
}

function getGraphQLUrl(projectId: string, dataset: string) {
  return `https://${projectId}.api.sanity.io/v1/graphql/${dataset}/default`
}

function getGroqUrl(projectId: string, dataset: string) {
  return `https://${projectId}.api.sanity.io/v1/groq/${dataset}`
}

function getManageUrl(projectId: string) {
  return `https://manage.sanity.io/projects/${projectId}`
}

const NO_EXPERIMENTAL: DashboardWidget[] = []
const NO_DATA: ProjectData[] = []

export default function ProjectInfo(props: ProjectInfoProps) {
  const {__experimental_before = NO_EXPERIMENTAL, data = NO_DATA} = props
  const [studioApps, setStudioApps] = useState<UserApplication[] | {error: string} | undefined>()
  const [graphQLApi, setGraphQLApi] = useState<string | {error: string} | undefined>()
  const versionedClient = useVersionedClient()
  const {projectId = 'unknown', dataset = 'unknown'} = versionedClient.config()

  useEffect(() => {
    const subscriptions: Subscription[] = []

    subscriptions.push(
      versionedClient.observable
        .request<UserApplication[]>({uri: '/user-applications', tag: 'dashboard.project-info'})
        .subscribe({
          next: (result) => setStudioApps(result.filter((app) => app.type === 'studio')),
          error: (error) => {
            console.error('Error while resolving user applications', error)
            setStudioApps({
              error: 'Something went wrong while resolving user applications. See console.',
            })
          },
        }),
    )

    // ping assumed graphql endpoint
    subscriptions.push(
      versionedClient.observable
        .request({
          method: 'HEAD',
          uri: `/graphql/${dataset}/default`,
          tag: 'dashboard.project-info.graphql-api',
        })
        .subscribe({
          next: () => setGraphQLApi(getGraphQLUrl(projectId, dataset)),
          error: (error) => {
            if (error.statusCode === 404) {
              setGraphQLApi(undefined)
            } else {
              console.error('Error while looking for graphQLApi', error)
              setGraphQLApi({
                error: 'Something went wrong while looking up graphQLApi. See console.',
              })
            }
          },
        }),
    )

    return () => {
      subscriptions.forEach((s) => s.unsubscribe())
    }
  }, [dataset, projectId, versionedClient, setGraphQLApi])

  const assembleTableRows = useMemo(() => {
    let result: App[] = [
      {
        title: 'Sanity project',
        rows: [
          {title: 'Project ID', value: projectId},
          {title: 'Dataset', value: dataset},
        ],
      },
    ]

    const apps: App[] = data.filter((item) => item.category === 'apps')

    // Handle studios
    ;(Array.isArray(studioApps) ? studioApps : []).forEach((app) => {
      apps.push({
        title: app.title || 'Studio',
        value: app.urlType === 'internal' ? `https://${app.appHost}.sanity.studio` : app.appHost,
      })
    })

    if (apps.length > 0) {
      result = result.concat([{title: 'Apps', rows: apps}])
    }

    // Handle APIs
    result = result.concat(
      [
        {
          title: 'APIs',
          rows: [
            {title: 'GROQ', value: getGroqUrl(projectId, dataset)},
            {
              title: 'GraphQL',
              value: (typeof graphQLApi === 'object' ? 'Error' : graphQLApi) ?? 'Not deployed',
            },
          ],
        },
      ],
      data.filter((item) => item.category === 'apis'),
    )

    // Handle whatever else there might be
    const otherStuff: Record<string, ProjectData[]> = {}
    data.forEach((item) => {
      if (item.category && item.category !== 'apps' && item.category !== 'apis') {
        const group = otherStuff[item.category] ?? []
        group.push(item)
        otherStuff[item.category] = group
      }
    })
    Object.keys(otherStuff).forEach((category) => {
      result.push({title: category, rows: otherStuff[category]})
    })

    return result
  }, [graphQLApi, studioApps, projectId, dataset, data])

  return (
    <>
      {__experimental_before.map((widgetConfig, idx) => (
        // eslint-disable-next-line react/no-array-index-key -- static widget config never reorders
        <WidgetContainer key={idx} {...widgetConfig} />
      ))}
      <Box height="fill" marginTop={__experimental_before?.length > 0 ? 4 : 0}>
        <DashboardWidgetContainer
          footer={
            <Button
              style={{width: '100%'}}
              paddingX={2}
              paddingY={4}
              mode="bleed"
              tone="primary"
              text="Manage project"
              as="a"
              href={getManageUrl(projectId)}
            />
          }
        >
          <Card paddingY={4} radius={2} aria-label="Project info">
            <Stack gap={4}>
              <Box paddingX={3} as="header">
                <Heading size={1} as="h2" id="project_info_table">
                  Project info
                </Heading>
              </Box>
              {assembleTableRows.map((item) => {
                if (!item || !item.rows) {
                  return null
                }

                return (
                  <Stack key={item.title} gap={3}>
                    <Card borderBottom padding={3}>
                      <Label size={0} muted>
                        {item.title}
                      </Label>
                    </Card>
                    <Stack gap={4} paddingX={3}>
                      {item.rows.map((row) => {
                        const rowValue = typeof row.value === 'object' ? row.value.error : row.value
                        return (
                          <Grid key={`${rowValue ?? ''}-${row.title}`} gridTemplateColumns={2}>
                            <Text weight="medium">{row.title}</Text>
                            {typeof row.value === 'object' && (
                              <Text size={1}>{row.value?.error}</Text>
                            )}
                            {typeof row.value === 'string' && (
                              <>
                                {isUrl(row.value) ? (
                                  <Text size={1} style={{wordBreak: 'break-word'}}>
                                    <a href={row.value}>{row.value}</a>
                                  </Text>
                                ) : (
                                  <Code size={1} style={{wordBreak: 'break-word'}}>
                                    {row.value}
                                  </Code>
                                )}
                              </>
                            )}
                          </Grid>
                        )
                      })}
                    </Stack>
                  </Stack>
                )
              })}
            </Stack>
          </Card>
        </DashboardWidgetContainer>
      </Box>
    </>
  )
}
