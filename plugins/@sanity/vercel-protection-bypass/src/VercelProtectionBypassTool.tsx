import {
  Activity,
  Suspense,
  use,
  useActionState,
  useEffect,
  useEffectEvent,
  useState,
  useTransition,
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
  Flex,
  Heading,
  Spinner,
  Stack,
  Text,
  TextInput,
  useToast,
} from '@sanity/ui'

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


  async function fetchSecret(lastLiveEventId: string | null): Promise<FormState> {
    const {result, syncTags} = await client.fetch<string | null>(
      fetchVercelProtectionBypassSecret,
      {},
      {
        filterResponse: false,
        lastLiveEventId,
        tag: 'preview-url-secret.fetch-vercel-bypass-protection-secret',
      },
    )
    return {secret: result, syncTags: syncTags ?? []}
  }
  const [initialStatePromise] = useState(() => fetchSecret(null))

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
      <Layout initialStatePromise={initialStatePromise} fetchSecret={fetchSecret} />
    </Suspense>
  )
}

type FormAction = 'remove-secret' | 'add-secret' | 'refresh-secret'
type FormName = 'action' | 'lastLiveEventId' | 'secret'
type FormState = {secret: string | null; syncTags: SyncTag[]}

function Layout({
  initialStatePromise,
  fetchSecret,
}: {
  initialStatePromise: Promise<FormState>
  fetchSecret(this: void, lastLiveEventId: string | null): Promise<FormState>
}) {
  const {push: pushToast} = useToast()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const client = useClient({apiVersion})

  const action = async (prevState: FormState, formData: FormData): Promise<FormState> => {
    const action = formData.get('action' satisfies FormName) as FormAction

    switch (action) {
      case 'remove-secret':
        return disableVercelProtectionBypass(client)
          .then((): FormState => {
            pushToast({
              status: 'warning',
              title: 'Protection bypass is now disabled',
            })
            return {...prevState, secret: null}
          })
          .catch((reason): FormState => {
            console.error(reason)
            pushToast({
              status: 'error',
              title:
                'There was an error when trying to disable protection bypass. See the browser console for more information.',
            })
            return prevState
          })

      case 'add-secret': {
        const secret = formData.get('secret' satisfies FormName) as string
        return enableVercelProtectionBypass(client, secret)
          .then(() => {
            pushToast({
              status: 'success',
              title: 'Protection bypass is now enabled',
            })
            setIsDialogOpen(false)
            return {...prevState, secret}
          })
          .catch((reason) => {
            console.error(reason)
            pushToast({
              status: 'error',
              title:
                'There was an error when trying to enable protection bypass. See the browser console for more information.',
            })
            return prevState
          })
      }
      case 'refresh-secret':
        return fetchSecret(formData.get('lastLiveEventId' satisfies FormName) as string)
      default:
        // oxlint-disable-next-line typescript/restrict-template-expressions
        throw new Error(`Unknown action: ${action}`)
    }
  }

  const [formState, formAction, isPending] = useActionState(action, use(initialStatePromise))
  const isBackgroundRefetch = useRefetchOnLiveEvent(client, formState, formAction)

  const loading = isPending && !isBackgroundRefetch
  const enabled = Boolean(formState.secret)

  return (
    <>
      <Box
        as="form"
        action={formAction}
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
                    loading={loading}
                    type="submit"
                    name={'action' satisfies FormName}
                    value={'remove-secret' satisfies FormAction}
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
                    onClick={() => {
                      setIsDialogOpen(true)
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

      <Activity mode={isDialogOpen ? 'visible' : 'hidden'}>
        <Dialog animate id="add-secret-dialog" onClickOutside={() => setIsDialogOpen(false)}>
          <Card as="form" action={formAction} padding={3}>
            <Stack space={3}>
              <Stack space={2}>
                <Text as="label" weight="semibold" size={1}>
                  Add bypass secret
                </Text>
                <Text muted size={1}>
                  {`Make sure it's the same secret the Vercel deployment is using that's loaded in the preview iframe.`}
                </Text>
                <TextInput
                  name={'secret' satisfies FormName}
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
                  disabled={loading}
                />
              </Stack>
              <Button
                type="submit"
                loading={loading}
                text={loading ? 'Saving…' : 'Save'}
                tone="positive"
                name={'action' satisfies FormName}
                value={'add-secret' satisfies FormAction}
              />
            </Stack>
          </Card>
        </Dialog>
      </Activity>
    </>
  )
}

type isBackgroundRefetch = boolean
function useRefetchOnLiveEvent(
  client: SanityClient,
  formState: FormState,
  action: (formData: FormData) => void,
): isBackgroundRefetch {
  const [isBackgroundRefetch, startTransition] = useTransition()
  const handleLiveEvent = useEffectEvent((event: LiveEvent) => {
    if (event.type === 'message' && event.tags.some((tag) => formState.syncTags.includes(tag))) {
      const formData = new FormData()
      formData.set('action' satisfies FormName, 'refresh-secret' satisfies FormAction)
      formData.set('lastLiveEventId' satisfies FormName, event.id)
      startTransition(() => action(formData))
    }
  })
  useEffect(() => {
    const subscription = client.live.events().subscribe({
      next: handleLiveEvent,
      error: (reason) => console.error(reason),
    })

    return () => subscription.unsubscribe()
  }, [client])
  return isBackgroundRefetch
}
