import {type LiveEvent} from '@sanity/client'
import {Checkbox, Flex, Label, Stack} from '@sanity/ui'
import {Activity, Fragment, startTransition, useEffect, useState} from 'react'
import {useClient, useProjectId, useDataset, type SanityClient} from 'sanity'
import {styled} from 'styled-components'

const Layout = styled(Flex)`
  height: 100%;
  width: 100%;
`

const Sidebar = styled(Stack)`
  flex-shrink: 0;
  width: 200px;
  padding: 16px;
  border-right: 1px solid var(--card-border-color, #ddd);
  overflow-y: auto;
`

const Main = styled.div`
  flex: 1;
  min-width: 0;
  overflow: auto;
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: monospace;
  font-size: 13px;

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--card-bg-color, #fff);
    box-shadow: inset 0 -2px 0 var(--card-border-color, #ddd);
  }

  th,
  td {
    padding: 4px 8px;
    text-align: left;
    vertical-align: top;
    white-space: nowrap;
  }

  th {
    font-weight: 600;
  }
`

const TagGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0 12px;
`

function EventTable({
  events,
  findResolvedTag,
  showTimestamp,
  showEventId,
}: {
  events: Map<string, LiveEvent & {timestamp: string}>
  findResolvedTag: (tag: string) => string
  showTimestamp: boolean
  showEventId: boolean
}) {
  const rows = Array.from(events.values())
  if (rows.length === 0) return null

  return (
    <StyledTable>
      <thead>
        <tr>
          {showTimestamp && <th>time</th>}
          {showEventId && <th>id</th>}
          <th>type</th>
          <th>tags</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((event, i) => {
          const tags = 'tags' in event ? event.tags : []
          const time = new Date(event.timestamp).toLocaleTimeString()
          const eventId = 'id' in event ? event.id : null
          const bg =
            i % 2 !== 0
              ? 'color-mix(in srgb, var(--card-border-color, #ddd) 15%, transparent)'
              : undefined
          return (
            <tr key={event.timestamp} style={{background: bg}}>
              {showTimestamp && <td>{time}</td>}
              {showEventId && <td>{eventId}</td>}
              <td style={{fontWeight: 600}}>{event.type}</td>
              <td style={{whiteSpace: 'normal'}}>
                {tags.length > 0 && (
                  <TagGrid>
                    {tags.map((tag) => (
                      <Fragment key={tag}>
                        <span title={tag}>{tag}</span>
                        <span>{findResolvedTag(tag)}</span>
                      </Fragment>
                    ))}
                  </TagGrid>
                )}
              </td>
            </tr>
          )
        })}
      </tbody>
    </StyledTable>
  )
}

export default function Tool() {
  const client = useClient({apiVersion: '2026-03-17'})
  const projectId = useProjectId()
  const dataset = useDataset()
  const [liveEvents, setLiveEvents] = useState<Map<string, LiveEvent & {timestamp: string}>>(
    () => new Map(),
  )
  const [liveEventsIncludingAllDocuments, setLiveEventsIncludingAllDocuments] = useState<
    Map<string, LiveEvent & {timestamp: string}>
  >(() => new Map())

  useEffect(() => {
    const subscription = client.live.events({tag: 'debug-live-sync-tags'}).subscribe({
      next: (event) => {
        startTransition(() =>
          setLiveEvents((prev) => {
            const next = new Map(prev)
            next.set('id' in event ? event.id : new Date().toJSON(), {
              ...event,
              timestamp: new Date().toJSON(),
            })
            return next
          }),
        )
      },
      error: console.error,
    })
    return () => subscription.unsubscribe()
  }, [client])

  useEffect(() => {
    const subscription = client.live
      .events({tag: 'debug-live-sync-tags', includeDrafts: true})
      .subscribe({
        next: (event) => {
          startTransition(() =>
            setLiveEventsIncludingAllDocuments((prev) => {
              const next = new Map(prev)
              next.set('id' in event ? event.id : new Date().toJSON(), {
                ...event,
                timestamp: new Date().toJSON(),
              })
              return next
            }),
          )
        },
        error: console.error,
      })
    return () => subscription.unsubscribe()
  }, [client])

  const [syncTagForEverything, setSyncTagForEverything] = useState<string | null>(null)
  const [allDocumentTypes, setAllDocumentTypes] = useState<Map<string, string | null>>(
    () => new Map(),
  )
  useEffect(() => {
    const controller = new AbortController()
    client
      .fetch<string[]>(
        `array::unique(*._type)`,
        {},
        {
          signal: controller.signal,
          returnQuery: false,
          tag: 'debug-live-sync-tags',
          filterResponse: false,
        },
      )
      .then(({result, syncTags}) => {
        if (controller.signal.aborted) return
        setSyncTagForEverything(syncTags?.[0] ?? null)

        setAllDocumentTypes((prev) => {
          const next = new Map(prev)
          for (const type of result) {
            if (!next.has(type)) {
              next.set(type, null)
            }
          }
          return next
        })
        return
      })
      .catch(console.error)
    return () => controller.abort()
  }, [client])

  const [whichList, setWhichList] = useState<'liveEvents' | 'liveEventsIncludingAllDocuments'>(
    'liveEventsIncludingAllDocuments',
  )
  const [showTimestamp, setShowTimestamp] = useState(true)
  const [showEventId, setShowEventId] = useState(false)

  const unknownDocumentTypes: string[] = []
  for (const [documentType, resolvedDocumentType] of allDocumentTypes.entries()) {
    if (resolvedDocumentType === null) {
      unknownDocumentTypes.push(documentType)
    }
  }
  const setDocumentType = (documentType: string, resolvedDocumentType: string) =>
    startTransition(() =>
      setAllDocumentTypes((prev) => {
        const next = new Map(prev)
        next.set(documentType, resolvedDocumentType)
        return next
      }),
    )
  function findResolvedTag(tag: string): string {
    if (tag === syncTagForEverything) {
      return 'any:*'
    }
    for (const [documentType, resolvedDocumentType] of allDocumentTypes.entries()) {
      if (resolvedDocumentType === tag) {
        return `type:${documentType}`
      }
    }
    for (const [documentId, resolvedDocumentId] of documentIdToTagMap.entries()) {
      if (resolvedDocumentId === tag) {
        return `id:${documentId}`
      }
    }
    for (const [slug, resolvedSlug] of documentSlugToTagMap.entries()) {
      if (resolvedSlug === tag) {
        return `slug:${slug}`
      }
    }
    return tag
  }

  const allDocumentTypesArray = Array.from(allDocumentTypes.keys())
  const [documentIdToTagMap, setDocumentIdToTagMap] = useState<Map<string, string | null>>(
    () => new Map(),
  )
  const unknownDocumentIds: string[] = []
  for (const [documentId, tag] of documentIdToTagMap.entries()) {
    if (tag === null) {
      unknownDocumentIds.push(documentId)
    }
  }
  const setDocumentIdTag = (documentId: string, tag: string | null) =>
    startTransition(() =>
      setDocumentIdToTagMap((prev) => {
        const next = new Map(prev)
        next.set(documentId, tag)
        return next
      }),
    )

  const [documentSlugToTagMap, setDocumentSlugToTagMap] = useState<Map<string, string | null>>(
    () => new Map(),
  )
  const unknownDocumentSlugs: string[] = []
  for (const [slug, tag] of documentSlugToTagMap.entries()) {
    if (tag === null) {
      unknownDocumentSlugs.push(slug)
    }
  }
  const setDocumentSlugTag = (slug: string, tag: string | null) =>
    startTransition(() =>
      setDocumentSlugToTagMap((prev) => {
        const next = new Map(prev)
        next.set(slug, tag)
        return next
      }),
    )

  useEffect(() => {
    if (allDocumentTypesArray.length === 0) {
      return
    }

    const listener = client
      .listen(
        '*[_type in $type]',
        {type: allDocumentTypesArray},
        {
          events: ['mutation'],
          includePreviousRevision: false,
          includeResult: true,
          includeAllVersions: true,
          includeMutations: false,
          tag: 'debug-live-sync-tags',
        },
      )
      .subscribe({
        next: (event) => {
          startTransition(() => {
            setDocumentIdToTagMap((prev) => {
              if (prev.has(event.documentId)) {
                return prev
              }
              const next = new Map(prev)
              next.set(event.documentId, null)
              return next
            })

            const slugField = event.result?.['slug']
            const slug =
              slugField &&
              typeof slugField === 'object' &&
              'current' in slugField &&
              typeof slugField.current === 'string'
                ? slugField.current
                : null
            if (slug) {
              setDocumentSlugToTagMap((prev) => {
                if (prev.has(slug)) {
                  return prev
                }
                const next = new Map(prev)
                next.set(slug, null)
                return next
              })
            }
          })
        },
        error: console.error,
      })
    return () => listener.unsubscribe()
  }, [client, allDocumentTypesArray])

  return (
    <Layout>
      <Sidebar space={4}>
        <Flex as="label" align="center" gap={2}>
          <Checkbox
            checked={whichList === 'liveEventsIncludingAllDocuments'}
            onChange={() =>
              setWhichList((prev) =>
                prev === 'liveEvents' ? 'liveEventsIncludingAllDocuments' : 'liveEvents',
              )
            }
          />
          <Label size={1}>Include all documents</Label>
        </Flex>
        <Flex as="label" align="center" gap={2}>
          <Checkbox checked={showTimestamp} onChange={() => setShowTimestamp((prev) => !prev)} />
          <Label size={1}>Show timestamp</Label>
        </Flex>
        <Flex as="label" align="center" gap={2}>
          <Checkbox checked={showEventId} onChange={() => setShowEventId((prev) => !prev)} />
          <Label size={1}>Show event ID</Label>
        </Flex>
      </Sidebar>
      <Main>
        <Activity mode={whichList === 'liveEvents' ? 'visible' : 'hidden'}>
          <EventTable
            events={liveEvents}
            findResolvedTag={findResolvedTag}
            showTimestamp={showTimestamp}
            showEventId={showEventId}
          />
        </Activity>
        <Activity mode={whichList === 'liveEventsIncludingAllDocuments' ? 'visible' : 'hidden'}>
          <EventTable
            events={liveEventsIncludingAllDocuments}
            findResolvedTag={findResolvedTag}
            showTimestamp={showTimestamp}
            showEventId={showEventId}
          />
        </Activity>
      </Main>
      {unknownDocumentTypes.map((unknownDocumentType) => (
        <ResolveDocumentType
          key={unknownDocumentType}
          projectId={projectId}
          dataset={dataset}
          documentType={unknownDocumentType}
          client={client}
          setDocumentType={setDocumentType}
        />
      ))}
      {unknownDocumentIds.map((unknownDocumentId) => (
        <ResolveDocumentId
          key={unknownDocumentId}
          projectId={projectId}
          dataset={dataset}
          documentId={unknownDocumentId}
          client={client}
          setDocumentIdTag={setDocumentIdTag}
        />
      ))}
      {unknownDocumentSlugs.map((unknownSlug) => (
        <ResolveDocumentSlug
          key={unknownSlug}
          projectId={projectId}
          dataset={dataset}
          slug={unknownSlug}
          client={client}
          setDocumentSlugTag={setDocumentSlugTag}
        />
      ))}
    </Layout>
  )
}

function ResolveDocumentType({
  projectId,
  dataset,
  documentType,
  client,
  setDocumentType,
}: {
  projectId: string
  dataset: string
  documentType: string
  client: SanityClient
  setDocumentType: (documentType: string, resolvedDocumentType: string) => void
}) {
  useEffect(() => {
    const localStorageKey = `debug-live-sync-tags-resolved-document-type-${projectId}-${dataset}-${documentType}`
    const localStorageValue = localStorage.getItem(localStorageKey)
    if (localStorageValue && typeof localStorageValue === 'string') {
      setDocumentType(documentType, localStorageValue)
      return
    }

    const controller = new AbortController()
    void client
      .fetch(
        `count(*[_type == $type])`,
        {type: documentType},
        {
          filterResponse: false,
          perspective: 'published',
          returnQuery: false,
          resultSourceMap: false,
          stega: false,
          useCdn: true,
        },
      )
      .then(({syncTags}) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(syncTags)) {
          throw new TypeError('syncTags is not an array', {cause: {syncTags, documentType}})
        }
        if (syncTags.length !== 1) {
          throw new TypeError('syncTags is not an array of exactly one item', {
            cause: {syncTags, documentType},
          })
        }
        setDocumentType(documentType, syncTags[0]!)
        localStorage.setItem(localStorageKey, syncTags[0]!)
        return
      })
    return () => controller.abort()
  }, [documentType, client, dataset, setDocumentType, projectId])

  return null
}

function ResolveDocumentId({
  projectId,
  dataset,
  documentId,
  client,
  setDocumentIdTag,
}: {
  projectId: string
  dataset: string
  documentId: string
  client: SanityClient
  setDocumentIdTag: (documentId: string, tag: string | null) => void
}) {
  useEffect(() => {
    const localStorageKey = `debug-live-sync-tags-resolved-document-id-${projectId}-${dataset}-${documentId}`
    const localStorageValue = localStorage.getItem(localStorageKey)
    if (localStorageValue && typeof localStorageValue === 'string') {
      setDocumentIdTag(documentId, localStorageValue)
      return
    }
    const controller = new AbortController()
    void client
      .fetch(
        `count(*[_id == $id])`,
        {id: documentId},
        {
          filterResponse: false,
          // perspective: 'published',
          returnQuery: false,
          resultSourceMap: false,
          stega: false,
          useCdn: true,
        },
      )
      .then(({syncTags}) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(syncTags)) {
          throw new TypeError('syncTags is not an array', {cause: {syncTags, documentId}})
        }
        if (syncTags.length !== 1) {
          throw new TypeError('syncTags is not an array of exactly one item', {
            cause: {syncTags, documentId},
          })
        }
        setDocumentIdTag(documentId, syncTags[0]!)
        localStorage.setItem(localStorageKey, syncTags[0]!)
        return
      })
    return () => controller.abort()
  }, [documentId, client, dataset, setDocumentIdTag, projectId])
  return null
}

function ResolveDocumentSlug({
  projectId,
  dataset,
  slug,
  client,
  setDocumentSlugTag,
}: {
  projectId: string
  dataset: string
  slug: string
  client: SanityClient
  setDocumentSlugTag: (slug: string, tag: string | null) => void
}) {
  useEffect(() => {
    const localStorageKey = `debug-live-sync-tags-resolved-document-slug-${projectId}-${dataset}-${slug}`
    const localStorageValue = localStorage.getItem(localStorageKey)
    if (localStorageValue && typeof localStorageValue === 'string') {
      setDocumentSlugTag(slug, localStorageValue)
      return
    }
    const controller = new AbortController()
    void client
      .fetch(
        `count(*[slug.current == $slug])`,
        {slug},
        {
          filterResponse: false,
          returnQuery: false,
          resultSourceMap: false,
          stega: false,
          useCdn: true,
        },
      )
      .then(({syncTags}) => {
        if (controller.signal.aborted) return
        if (!Array.isArray(syncTags)) {
          throw new TypeError('syncTags is not an array', {cause: {syncTags, slug}})
        }
        if (syncTags.length !== 1) {
          throw new TypeError('syncTags is not an array of exactly one item', {
            cause: {syncTags, slug},
          })
        }
        setDocumentSlugTag(slug, syncTags[0]!)
        localStorage.setItem(localStorageKey, syncTags[0]!)
        return
      })
    return () => controller.abort()
  }, [slug, client, dataset, setDocumentSlugTag, projectId])
  return null
}
