import {
  useEffect,
  useReducer,
  Activity,
  useState,
  use,
  Suspense,
  useEffectEvent,
  useRef,
  startTransition,
  useImperativeHandle,
} from 'react'
import {useClient, type SanityClient} from 'sanity'

import type {SyncTag, LiveEvent} from '@sanity/client'

import {AddIcon, TrashIcon} from '@sanity/icons'
import {
  apiVersion,
  vercelProtectionBypassSchemaId as _id,
  vercelProtectionBypassSchemaType as _type,
  tag,
  fetchVercelProtectionBypassSecret,
} from '@sanity/preview-url-secret/constants'
import {
  Box,
  Button,
  Card,
  Dialog,
  Heading,
  Stack,
  Spinner,
  Flex,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'

interface State {
  status:
    | 'loading'
    | 'disabled'
    | 'add-secret-dialog'
    | 'adding-secret'
    | 'enabled'
    | 'removing-secret'
}
type Action =
  | {type: 'add-secret'}
  | {type: 'save-secret'}
  | {type: 'cancel-add-secret'}
  | {type: 'failed-add-secret'}
  | {type: 'saved-secret'}
  | {type: 'remove-secret'}
  | {type: 'failed-remove-secret'}
  | {type: 'removed-secret'}

function reducer(prevState: State, action: Action): State {
  switch (action.type) {
    case 'removed-secret':
      return {...prevState, status: 'disabled'}
    case 'remove-secret':
      return {...prevState, status: 'removing-secret'}
    case 'saved-secret':
      return {...prevState, status: 'enabled'}
    case 'save-secret':
      return {...prevState, status: 'adding-secret'}
    case 'cancel-add-secret':
      return {...prevState, status: 'disabled'}
    case 'add-secret':
      return {...prevState, status: 'add-secret-dialog'}
    case 'failed-remove-secret':
      return {...prevState, status: 'enabled'}
    case 'failed-add-secret':
      return {...prevState, status: 'add-secret-dialog'}
    default:
      return prevState
  }
}

async function enableVercelProtectionBypass(client: SanityClient, secret: string): Promise<void> {
  const patch = client.patch(_id).set({secret})
  await client.transaction().createIfNotExists({_id, _type}).patch(patch).commit({tag})
}

async function disableVercelProtectionBypass(client: SanityClient): Promise<void> {
  const patch = client.patch(_id).set({secret: null})
  await client.transaction().createIfNotExists({_id, _type}).patch(patch).commit({tag})
}

export default function VercelProtectionBypassTool(): React.JSX.Element {
  const client = useClient({apiVersion: apiVersion})

  async function fetchSecret(lastLiveEventId: string | null) {
    const {result, syncTags} = await client.fetch<string | null>(
      fetchVercelProtectionBypassSecret,
      {},
      {
        filterResponse: false,
        lastLiveEventId,
        tag: 'preview-url-secret.fetch-vercel-bypass-protection-secret',
      },
    )
    return {result, syncTags: syncTags ?? []}
  }
  const [dataPromise, setDataPromise] = useState(() => fetchSecret(null))
  const syncTagsRef = useRef<SyncTag[]>([])

  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    if (event.type === 'message' && event.tags.some((tag) => syncTagsRef.current.includes(tag))) {
      startTransition(() => setDataPromise(fetchSecret(event.id)))
    }
  })
  useEffect(() => {
    const subscription = client.live.events().subscribe({
      next: handleLiveEvent,
      // eslint-disable-next-line no-console
      error: (reason) => console.error(reason),
    })

    return () => subscription.unsubscribe()
  }, [client])

  return (
    <Suspense
      fallback={
        <Flex
          align="center"
          direction="column"
          height="fill"
          justify="center"
          style={{width: '100%'}}
        >
          <Spinner />
        </Flex>
      }
    >
      <Layout dataPromise={dataPromise} syncTagsRef={syncTagsRef} />
    </Suspense>
  )
}

function Layout({
  dataPromise,
  syncTagsRef,
}: {
  dataPromise: Promise<{result: string | null; syncTags: SyncTag[]}>
  syncTagsRef: React.RefObject<SyncTag[]>
}) {
  const {result, syncTags} = use(dataPromise)
  useImperativeHandle(syncTagsRef, () => syncTags, [syncTags])
  const client = useClient({apiVersion: apiVersion})
  const {push: pushToast} = useToast()
  const [state, dispatch] = useReducer(reducer, {status: 'loading'})
  const adding = state.status === 'adding-secret'
  const removing = state.status === 'removing-secret'

  console.log({result, syncTags})

  const handleEnable = (secret: string) => {
    dispatch({type: 'save-secret'})
    enableVercelProtectionBypass(client, secret)
      .then(() => {
        dispatch({type: 'saved-secret'})
        pushToast({
          status: 'success',
          title: 'Protection bypass is now enabled',
        })
      })
      .catch((reason) => {
        // eslint-disable-next-line no-console
        console.error(reason)
        pushToast({
          status: 'error',
          title:
            'There was an error when trying to enable protection bypass. See the browser console for more information.',
        })
        dispatch({type: 'failed-add-secret'})
      })
  }

  const enabled = Boolean(result)

  return (
    <>
      <Box
        sizing="border"
        display="flex"
        style={{
          height: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Stack space={5}>
          <Card padding={4} style={{maxWidth: 640}}>
            <Stack space={4} style={{justifyItems: 'flex-start', textWrap: 'pretty'}}>
              <Heading>Vercel Protection Bypass</Heading>
              {enabled ? (
                <>
                  <Box>
                    <Text style={{textWrap: 'pretty'}}>
                      Sanity Presentation is setup to use{' '}
                      <a
                        href="https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation"
                        target="_blank"
                        rel="noreferrer"
                      >
                        protection bypass for automation
                      </a>{' '}
                      in order to display protected deployments in its preview iframe for the
                      current Sanity dataset.
                    </Text>
                  </Box>
                  <Box>
                    <Text>
                      You can turn off automatic protection bypass at any time by clicking the
                      button below.
                    </Text>
                  </Box>
                  <Button
                    mode="ghost"
                    tone="critical"
                    icon={<TrashIcon />}
                    loading={removing}
                    onClick={() => {
                      dispatch({type: 'remove-secret'})
                      disableVercelProtectionBypass(client)
                        .then(() => {
                          pushToast({
                            status: 'warning',
                            title: 'Protection bypass is now disabled',
                          })
                          dispatch({type: 'removed-secret'})
                        })
                        .catch((reason) => {
                          // eslint-disable-next-line no-console
                          console.error(reason)
                          pushToast({
                            status: 'error',
                            title:
                              'There was an error when trying to disable protection bypass. See the browser console for more information.',
                          })
                          dispatch({type: 'failed-remove-secret'})
                        })
                    }}
                    text="Remove secret"
                  />
                  <Text>
                    Protection bypass remains enabled if this plugin is removed from your Sanity
                    config.
                  </Text>
                </>
              ) : (
                <>
                  <Box>
                    <Text style={{textWrap: 'pretty'}}>
                      Follow the instructions on{' '}
                      <a
                        href="https://vercel.com/docs/security/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation"
                        target="_blank"
                        rel="noreferrer"
                      >
                        how to enable protection bypass for automation
                      </a>
                      .
                    </Text>
                  </Box>
                  <Box>
                    <Text>
                      This will setup a secret that Vercel exposes as an environment variable called
                      VERCEL_AUTOMATION_BYPASS_SECRET, its value is the secret you need.
                    </Text>
                  </Box>
                  <Button
                    mode="ghost"
                    icon={<AddIcon />}
                    loading={state.status === 'loading'}
                    onClick={() => {
                      dispatch({type: 'add-secret'})
                    }}
                    text="Add secret"
                  />
                  <Text>
                    If you&apos;re using Sanity Presentation Tool with multiple protected
                    deployments ensure that they have the same secret set, as this tool will set a
                    secret that is shared in your dataset with all instances of Presentation Tool.
                  </Text>
                </>
              )}
            </Stack>
          </Card>
        </Stack>
      </Box>

      <Activity
        mode={
          state.status === 'add-secret-dialog' || state.status === 'adding-secret'
            ? 'visible'
            : 'hidden'
        }
      >
        <Dialog
          animate
          id="add-secret-dialog"
          onClickOutside={() => dispatch({type: 'cancel-add-secret'})}
        >
          <Card padding={3}>
            <form
              onSubmit={(event) => {
                event.preventDefault()
                event.currentTarget.reportValidity()
                const formData = new FormData(event.currentTarget)
                const secret = formData.get('secret') as string
                if (secret) handleEnable(secret)
              }}
            >
              <Stack space={3}>
                <Stack space={2}>
                  <Text as="label" weight="semibold" size={1}>
                    Add bypass secret
                  </Text>
                  <Text muted size={1}>
                    {`Make sure it's the same secret the Vercel deployment is using that's loaded in the preview iframe.`}
                  </Text>
                  <TextInput
                    name="secret"
                    onFocus={(event) => {
                      event.currentTarget.setCustomValidity('')
                    }}
                    onBlur={(event) => {
                      event.currentTarget.setCustomValidity(
                        event.currentTarget.value.length == 32
                          ? ''
                          : 'Secret must be 32 characters long',
                      )
                      event.currentTarget.required = true
                    }}
                    minLength={32}
                    maxLength={32}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck="false"
                    disabled={adding}
                  />
                </Stack>
                <Button
                  type="submit"
                  loading={adding}
                  text={adding ? 'Saving…' : 'Save'}
                  tone="positive"
                />
              </Stack>
            </form>
          </Card>
        </Dialog>
      </Activity>
    </>
  )
}
