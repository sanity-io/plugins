import {DownloadIcon} from '@sanity/icons'
import {Flex, Card, Text, Grid, Box, Button} from '@sanity/ui'
import {useCallback, useState} from 'react'

import ProgressBar from './ProgressBar'

type LanguageStatusProps = {
  title: string
  progress: number
  importFile: () => Promise<void>
  isImporting?: boolean | undefined
}

export const LanguageStatus = ({
  title,
  progress,
  importFile,
  isImporting = false,
}: LanguageStatusProps) => {
  const [isBusy, setIsBusy] = useState(false)
  const busy = isBusy || isImporting

  const handleImport = useCallback(async () => {
    setIsBusy(true)
    await importFile()
    setIsBusy(false)
  }, [importFile, setIsBusy])

  return (
    <Card shadow={1}>
      <Grid gridTemplateColumns={5} gap={3} padding={3}>
        <Flex gridColumnStart={1} gridColumnEnd={3} align="center">
          <Text weight="bold" size={1}>
            {title}
          </Text>
        </Flex>
        {typeof progress === 'number' ? (
          <Flex gridColumnStart={3} gridColumnEnd={5} align="center">
            <ProgressBar progress={progress} />
          </Flex>
        ) : null}
        <Box gridColumnStart={5} gridColumnEnd={6}>
          <Button
            style={{width: `100%`}}
            mode="ghost"
            onClick={handleImport}
            text={busy ? 'Importing...' : 'Import'}
            icon={busy ? null : DownloadIcon}
            disabled={busy || !progress || progress < 100}
          />
        </Box>
      </Grid>
    </Card>
  )
}
