import type {MutationEvent, SanityClient} from '@sanity/client'
import groq from 'groq'
import {type EventObject, fromCallback} from 'xstate'

import {FOLDER_DOCUMENT_NAME, TAG_DOCUMENT_NAME} from '../constants'
import type {Asset, Tag} from '../types'
import {buildExcludeMediaLibraryFragment} from '../utils/constructFilter'
import type {AssetListenerEvent} from './assetsMachine'
import type {TagListenerEvent} from './tagsMachine'

export type ListenerEvent =
  | ({type: 'listener.asset'} & AssetListenerEvent)
  | ({type: 'listener.tag'} & TagListenerEvent)
  | {type: 'listener.folder'}

function toListenerEvent<TDocument>(update: MutationEvent) {
  const {documentId, result, transition} = update
  return {documentId, transition, ...(result ? {result: result as TDocument} : {})}
}

export const listenToAssets = fromCallback<
  EventObject,
  {client: SanityClient; showMediaLibraryAssets: boolean}
>(({input, sendBack}) => {
  const excludeMediaLibrary = buildExcludeMediaLibraryFragment(input.showMediaLibraryAssets)
  const subscription = input.client
    .listen(
      groq`*[_type in ["sanity.fileAsset", "sanity.imageAsset"] && !(_id in path("drafts.**"))${
        excludeMediaLibrary ? ` && ${excludeMediaLibrary}` : ''
      }]`,
    )
    .subscribe((update) => {
      sendBack({type: 'listener.asset', ...toListenerEvent<Asset>(update)} satisfies ListenerEvent)
    })
  return () => subscription.unsubscribe()
})

export const listenToTags = fromCallback<EventObject, {client: SanityClient}>(
  ({input, sendBack}) => {
    const subscription = input.client
      .listen(groq`*[_type == "${TAG_DOCUMENT_NAME}" && !(_id in path("drafts.**"))]`)
      .subscribe((update) => {
        sendBack({type: 'listener.tag', ...toListenerEvent<Tag>(update)} satisfies ListenerEvent)
      })
    return () => subscription.unsubscribe()
  },
)

export const listenToFolders = fromCallback<EventObject, {client: SanityClient}>(
  ({input, sendBack}) => {
    const subscription = input.client
      .listen(groq`*[_type == "${FOLDER_DOCUMENT_NAME}" && !(_id in path("drafts.**"))]`)
      .subscribe(() => {
        sendBack({type: 'listener.folder'} satisfies ListenerEvent)
      })
    return () => subscription.unsubscribe()
  },
)
