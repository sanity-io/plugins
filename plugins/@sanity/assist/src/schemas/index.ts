import type {ArrayOfType, FieldProps, SchemaTypeDefinition} from 'sanity'

import {
  assistDocumentSchema,
  createFieldReferenceType,
  documentInstructionStatus,
  fieldInstructions,
  instruction,
  instructionTask,
  outputFieldType,
  outputTypeType,
  prompt,
  promptContext,
  userInput,
} from './assistDocumentSchema'
import {contextDocumentSchema} from './contextDocumentSchema'

function excludeComments<T extends SchemaTypeDefinition | ArrayOfType>(type: T): T {
  // oxlint-disable-next-line no-unsafe-type-assertion
  const existingRender = (type as any)?.components?.field
  return {
    ...type,
    ...('components' in type
      ? {
          components: {
            ...type.components,
            field: (props: FieldProps) => {
              const newProps = {...props, __internal_comments: undefined}
              if (typeof existingRender === 'function') {
                return existingRender(newProps)
              }
              return props.renderDefault(newProps)
            },
          },
        }
      : {}),
    ...('fields' in type
      ? {
          // recursively disable comments in fields
          fields: type.fields?.map((field) => excludeComments(field)),
        }
      : {}),
    ...('of' in type
      ? {
          // recursively disable comments in array items
          of: type.of?.map((arrayItemType) => excludeComments(arrayItemType)),
        }
      : {}),
  }
}

/**
 * @param maxFieldSelectionDepth - see `AssistConfig.maxFieldSelectionDepth`; the field reference
 * type validates picked paths against the field-ref tree, which must be built with the same depth
 */
export function createSchemaTypes(maxFieldSelectionDepth?: number) {
  const instructionForm = [
    fieldInstructions,
    instruction,
    createFieldReferenceType(maxFieldSelectionDepth),
    prompt,
    userInput,
    promptContext,
  ].map(excludeComments)

  return [
    ...instructionForm,
    outputFieldType,
    outputTypeType,
    assistDocumentSchema,
    documentInstructionStatus,
    instructionTask,
    contextDocumentSchema,
  ]
}
