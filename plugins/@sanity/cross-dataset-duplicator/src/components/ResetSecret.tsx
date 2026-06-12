import {Button, Flex} from '@sanity/ui'
import {useCallback} from 'react'
import {useClient} from 'sanity'

import {SECRET_NAMESPACE} from '../helpers/constants'

type ResetSecretProps = {
  apiVersion: string
}

export default function ResetSecret({apiVersion}: ResetSecretProps) {
  const client = useClient({apiVersion})

  const handleClick = useCallback(() => {
    client.delete({query: `*[_id == "secrets.${SECRET_NAMESPACE}"]`}).catch(console.error)
  }, [client])

  return (
    <Flex align="center" justify="flex-end" paddingX={[2, 2, 2, 5]} paddingY={5}>
      <Button
        text="Reset Secret"
        onClick={handleClick}
        mode="ghost"
        tone="critical"
        fontSize={1}
        padding={2}
      />
    </Flex>
  )
}
