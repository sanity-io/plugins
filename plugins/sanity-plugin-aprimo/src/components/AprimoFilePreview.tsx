import {useCallback} from 'react'

import {Card, Box, Flex, Stack, Text, Label, Button} from '@sanity/ui'

import type {AprimoAsset} from '../types'

interface AprimoFilePreviewProps {
  value: AprimoAsset
  tenantName: string
}

export function AprimoFilePreview({value, tenantName}: AprimoFilePreviewProps): React.JSX.Element {
  const {title, additionalFile, id} = value
  const assetName = additionalFile?.fileName || title || 'No name'
  const damUrl = `https://${tenantName}.dam.aprimo.com/Assets/Records/${id}`
  const onClick = useCallback(() => {
    window.open(damUrl, '_blank')
  }, [damUrl])
  return (
    <Box paddingY={1}>
      <Card paddingY={3} paddingX={3} radius={1} shadow={1}>
        <Flex align="center" justify="space-between" gap={1}>
          <Stack space={3}>
            <Label as="p">Aprimo File Asset</Label>
            <Text as="p">{assetName}</Text>
          </Stack>
          <Stack>
            {/* ADD launch icon */}
            <Button
              tone="primary"
              as={'a'}
              href={damUrl}
              target={`_blank`}
              onClick={onClick}
              text={'View'}
            />
          </Stack>
        </Flex>
      </Card>
    </Box>
  )
}
