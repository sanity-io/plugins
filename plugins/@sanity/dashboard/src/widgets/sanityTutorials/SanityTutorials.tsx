import {Flex} from '@sanity/ui'
import {useMemo} from 'react'
import {useObservable} from 'react-rx'
import {catchError, map, of, startWith} from 'rxjs'

import {DashboardWidgetContainer} from '../../components/DashboardWidgetContainer'
import {type FeedItem, useDataAdapter} from './dataAdapter'
import {Tutorial} from './Tutorial'

function createUrl(slug: {current: string}, type?: string) {
  if (type === 'tutorial') {
    return `https://www.sanity.io/docs/tutorials/${slug.current}`
  } else if (type === 'guide') {
    return `https://www.sanity.io/docs/guides/${slug.current}`
  }
  return false
}

export interface SanityTutorialsProps {
  templateRepoId: string
}

const EMPTY_FEED: FeedItem[] = []

export function SanityTutorials(props: SanityTutorialsProps) {
  const {templateRepoId} = props
  const {getFeed, urlBuilder} = useDataAdapter()

  const feedItems$ = useMemo(
    () =>
      getFeed(templateRepoId).pipe(
        map((response) => response.items),
        startWith(EMPTY_FEED),
        catchError((error) => {
          console.error(error)
          return of(EMPTY_FEED)
        }),
      ),
    [getFeed, templateRepoId],
  )

  const feedItems = useObservable(feedItems$, EMPTY_FEED)

  const title = 'Learn about Sanity'

  return (
    <DashboardWidgetContainer header={title}>
      <Flex as="ul" overflow="auto" align="stretch" paddingY={2}>
        {feedItems?.map((feedItem, index) => {
          if (!feedItem.title || (!feedItem.guideOrTutorial && !feedItem.externalLink)) {
            return null
          }
          const presenter = feedItem.presenter || feedItem.guideOrTutorial?.presenter || {}
          const subtitle = feedItem.category
          const {guideOrTutorial = {}} = feedItem
          const href =
            (guideOrTutorial.slug
              ? createUrl(guideOrTutorial.slug, guideOrTutorial._type)
              : feedItem.externalLink) || feedItem.externalLink

          return (
            <Flex
              as="li"
              key={feedItem._id}
              paddingRight={index < feedItems?.length - 1 ? 1 : 3}
              paddingLeft={index === 0 ? 3 : 0}
              align="stretch"
              style={{minWidth: 272, width: '30%'}}
            >
              <Tutorial
                title={feedItem.title}
                href={href ?? ''}
                presenterName={presenter.name}
                presenterSubtitle={subtitle}
                showPlayIcon={feedItem.hasVideo}
                posterURL={
                  feedItem.poster ? urlBuilder.image(feedItem.poster).height(360).url() : undefined
                }
              />
            </Flex>
          )
        })}
      </Flex>
    </DashboardWidgetContainer>
  )
}
