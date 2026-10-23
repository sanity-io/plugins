import type {SanityClient} from '@sanity/client'
import {useToast} from '@sanity/ui/toast'
import {useActorRef, useSelector} from '@xstate/react'
import {createContext, type ReactNode, useContext, useMemo} from 'react'

import type {AssetsActorRef} from '../machines/assetsMachine'
import type {DebugActorRef} from '../machines/debugMachine'
import type {DialogsActorRef} from '../machines/dialogsMachine'
import type {FoldersActorRef} from '../machines/foldersMachine'
import {
  type MediaActorRef,
  type MediaConfig,
  type MediaInput,
  mediaMachine,
} from '../machines/mediaMachine'
import type {TagsActorRef} from '../machines/tagsMachine'
import type {UploadsActorRef} from '../machines/uploadsMachine'

export type MediaActors = {
  assets: AssetsActorRef
  debug: DebugActorRef
  dialogs: DialogsActorRef
  folders: FoldersActorRef
  media: MediaActorRef
  tags: TagsActorRef
  uploads: UploadsActorRef
}

const MediaActorsContext = createContext<MediaActors | null>(null)

type Props = MediaInput & {
  children?: ReactNode
  /** Called when the edit asset source has nothing left to show. */
  onClose?: () => void
}

/**
 * Runs the media actor for the lifetime of the browser. Components subscribe to the child actor
 * owning the state they render with `useSelector`, so a change only re-renders its subscribers.
 */
export function MediaActorsProvider({children, onClose, ...input}: Props) {
  const toast = useToast()

  const media = useActorRef(
    mediaMachine.provide({
      actions: {
        close: () => onClose?.(),
        notify: (_, {status, title}) => toast.push({closable: true, status, title}),
      },
    }),
    {input},
  )

  const actors = useMemo((): MediaActors => {
    const {assets, debug, dialogs, folders, tags, uploads} = media.getSnapshot().context
    return {assets, debug, dialogs, folders, media, tags, uploads}
  }, [media])

  return <MediaActorsContext.Provider value={actors}>{children}</MediaActorsContext.Provider>
}

export function useMediaActors(): MediaActors {
  const actors = useContext(MediaActorsContext)
  if (!actors) {
    throw new Error('useMediaActors must be used within a MediaActorsProvider')
  }
  return actors
}

export function useMediaConfig(): MediaConfig {
  const {media} = useMediaActors()
  return useSelector(media, (snapshot) => snapshot.context.config)
}

/** The client the media actors make requests with. */
export function useMediaClient(): SanityClient {
  const {media} = useMediaActors()
  return useSelector(media, (snapshot) => snapshot.context.client)
}
