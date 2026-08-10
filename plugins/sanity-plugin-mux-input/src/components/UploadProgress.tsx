// Lifted from sanity/form/inputs/files/common/UploadProgress

import {Button, Card, Code, Flex, Inline, Stack, Text} from '@sanity/ui'
import {clsx} from 'clsx/lite'
import {type ComponentProps} from 'react'
import {LinearProgress} from 'sanity'

import {cardWrapper, codeWrapper, flexWrapper, leftSection} from './UploadProgress.css'

function CardWrapper({className, ...props}: ComponentProps<typeof Card>) {
  return <Card {...props} className={clsx(cardWrapper, className)} />
}

function FlexWrapper({className, ...props}: ComponentProps<typeof Flex>) {
  return <Flex {...props} className={clsx(flexWrapper, className)} />
}

function LeftSection({className, ...props}: ComponentProps<typeof Stack>) {
  return <Stack {...props} className={clsx(leftSection, className)} />
}

function CodeWrapper({className, ...props}: ComponentProps<typeof Code>) {
  return <Code {...props} className={clsx(codeWrapper, className)} />
}

export const UploadProgress = ({
  progress = 100,
  onCancel,
  filename,
  text = 'Uploading',
}: {
  progress: number
  filename?: React.ReactNode
  onCancel?: React.MouseEventHandler<HTMLButtonElement>
  text?: React.ReactNode
}) => {
  // Disable cancel button when upload is 90% or more complete
  // to prevent inconsistency between Mux and Sanity
  const isCancelDisabled = progress >= 90

  return (
    <CardWrapper tone="primary" padding={4} border height="fill">
      <FlexWrapper align="center" justify="space-between" height="fill" direction="row" gap={2}>
        <LeftSection>
          <Flex justify="center" gap={[3, 3, 2, 2]} direction={['column', 'column', 'row']}>
            <Text size={1}>
              <Inline space={2}>
                {text}
                <CodeWrapper size={1}>{filename ? filename : '...'}</CodeWrapper>
              </Inline>
            </Text>
          </Flex>

          <Card marginTop={3} radius={5} shadow={1}>
            <LinearProgress value={progress} />
          </Card>
        </LeftSection>

        {onCancel ? (
          <Button
            fontSize={2}
            text="Cancel upload"
            mode="ghost"
            tone="critical"
            onClick={onCancel}
            disabled={isCancelDisabled}
          />
        ) : null}
      </FlexWrapper>
    </CardWrapper>
  )
}
