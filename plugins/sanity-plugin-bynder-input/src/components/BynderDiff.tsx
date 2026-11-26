import {Flex} from '@sanity/ui'
import {type SchemaType} from 'sanity'
import {DiffFromTo} from 'sanity/_dangerously_use_private_internals_that_do_not_follow_semver'

type ComponentProps = {
  value: any
}

function Component({value}: ComponentProps) {
  if (value?.previewUrl || value?.previewImg) {
    return (
      <Flex justify="center" align="center" height="fill">
        <img
          alt="preview"
          src={value?.previewImg ?? value?.previewUrl}
          style={{
            objectFit: 'contain',
            margin: 'auto',
            maxWidth: '100%',
            maxHeight: '100%',
          }}
        />
      </Flex>
    )
  }

  return (
    <Flex justify="center" align="center" height="fill">
      <div>(no image)</div>
    </Flex>
  )
}

type DiffProps = {
  diff: any
  schemaType: SchemaType
}

export function BynderDiff({diff, schemaType}: DiffProps): React.JSX.Element {
  return (
    <DiffFromTo diff={diff} schemaType={schemaType} previewComponent={Component} layout={'grid'} />
  )
}
