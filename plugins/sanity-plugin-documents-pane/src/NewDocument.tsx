import {ComposeIcon} from '@sanity/icons/Compose'
import {Button, Card, Flex} from '@sanity/ui'
import {uuid} from '@sanity/uuid'
import {usePaneRouter} from 'sanity/structure'

import type {DocumentsPaneInitialValueTemplate} from './types'

interface NewDocumentProps {
  initialValueTemplates: DocumentsPaneInitialValueTemplate[]
}

export default function NewDocument(props: NewDocumentProps) {
  const {initialValueTemplates} = props
  const {ReferenceChildLink} = usePaneRouter()

  if (!initialValueTemplates.length) return null

  return (
    <Card borderBottom padding={2}>
      <Flex gap={1} justify="flex-end">
        {initialValueTemplates.map((template) => {
          if (!template.template) {
            return null
          }
          return (
            <ReferenceChildLink
              documentId={uuid()}
              documentType={template.schemaType}
              key={`${template.schemaType}-${template.template}`}
              parentRefPath={[]}
              template={{
                id: template.template,
                params: template.parameters ?? {},
              }}
            >
              <Button as="span" icon={ComposeIcon} mode="bleed" text={template.title} />
            </ReferenceChildLink>
          )
        })}
      </Flex>
    </Card>
  )
}
