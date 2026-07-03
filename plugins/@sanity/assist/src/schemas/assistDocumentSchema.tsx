import {Icon, type IconSymbol} from '@sanity/icons'
import {CodeIcon} from '@sanity/icons/Code'
import {ComposeIcon} from '@sanity/icons/Compose'
import {LockIcon} from '@sanity/icons/Lock'
import {SparklesIcon} from '@sanity/icons/Sparkles'
import {ThListIcon} from '@sanity/icons/ThList'
import {Box, Flex, Stack, Text, Tooltip} from '@sanity/ui'
import {defineArrayMember, defineField, defineType, type ObjectSchemaType} from 'sanity'

import {AssistDocumentForm} from '../assistDocument/components/AssistDocumentForm'
import {FieldRefPreview} from '../assistDocument/components/FieldRefPreview'
import {HiddenFieldTitle} from '../assistDocument/components/generic/HiddenFieldTitle'
import {IconInput} from '../assistDocument/components/instruction/appearance/IconInput'
import {InstructionVisibility} from '../assistDocument/components/instruction/appearance/InstructionVisibility'
import {FieldRefPathInput} from '../assistDocument/components/instruction/FieldRefInput'
import {InstructionInput} from '../assistDocument/components/instruction/InstructionInput'
import {InstructionOutputField} from '../assistDocument/components/instruction/InstructionOutputField'
import {InstructionOutputInput} from '../assistDocument/components/instruction/InstructionOutputInput'
import {PromptInput} from '../assistDocument/components/instruction/PromptInput'
import {InstructionsArrayField} from '../assistDocument/components/InstructionsArrayField'
import {InstructionsArrayInput} from '../assistDocument/components/InstructionsArrayInput'
import {createFieldRefCache} from '../assistLayout/fieldRefCache'
import {getInstructionTitle} from '../helpers/misc'
import {
  assistDocumentIdPrefix,
  assistDocumentTypeName,
  assistFieldTypeName,
  assistTasksStatusTypeName,
  fieldReferenceTypeName,
  instructionContextTypeName,
  instructionTaskTypeName,
  instructionTypeName,
  outputFieldTypeName,
  outputTypeTypeName,
  promptTypeName,
  userInputTypeName,
} from '../types'
import {contextDocumentSchema} from './contextDocumentSchema'

export const fieldReference = defineType({
  type: 'object',
  name: fieldReferenceTypeName,
  title: 'Field',
  icon: ThListIcon,

  fields: [
    defineField({
      type: 'string',
      name: 'path',
      title: 'Field',
      components: {
        input: FieldRefPathInput,
      },
      validation: (rule) => {
        const getForSchemaType = createFieldRefCache()
        return rule.custom((value, context) => {
          if (!value) {
            return 'Please select a field'
          }
          try {
            const docId = context.document?._id
            if (!docId) {
              return `Field reference cannot be used outside document inspector context. Could not resolve document id.`
            }
            const targetDocType = docId.replace(new RegExp(`^${assistDocumentIdPrefix}`), '')
            const schema = context.schema.get(targetDocType)
            if (!schema) {
              return `Field reference cannot be used outside document inspector context. Could not resolve schema: ${targetDocType}`
            }
            // oxlint-disable-next-line no-unsafe-type-assertion
            const {fieldRefs} = getForSchemaType(schema as ObjectSchemaType)
            const fieldRef = fieldRefs.find((r) => r.key === value)
            if (!fieldRef) {
              return `Field with path "${value}" does not exist in the schema.`
            }
            return true
          } catch (e) {
            console.error('Failed to resolve field reference', e)
            return 'Invalid field reference.'
          }
        })
      },
    }),
  ],
  preview: {
    select: {
      path: 'path',
    },
    prepare({path}) {
      return {
        title: path,
        path,
        icon: CodeIcon,
      }
    },
  },
  components: {
    preview: FieldRefPreview,
  },
  options: {
    modal: {
      type: 'popover',
    },
  },
})

export const userInput = defineType({
  type: 'object',
  name: userInputTypeName,
  title: 'User input',
  icon: ComposeIcon,
  fields: [
    defineField({
      type: 'string',
      name: 'message',
      title: 'User input title',
      placeholder: 'Provide instruction text',
      description: 'The header above the user input text field',
      validation: (rule) => rule.required(),
    }),
    defineField({
      type: 'text',
      rows: 3,
      name: 'description',
      title: 'User input description',
      description: 'The description above the user input text field',
    }),
  ],
  preview: {
    select: {
      title: 'message',
    },
  },
  options: {
    modal: {
      type: 'popover',
      width: 1,
    },
  },
})

export const promptContext = defineType({
  type: 'object',
  name: instructionContextTypeName,
  title: contextDocumentSchema.title,
  icon: contextDocumentSchema.icon,
  fields: [
    defineField({
      type: 'reference',
      name: 'reference',
      to: [{type: contextDocumentSchema.name}],
      title: 'Context',
      description: 'The referenced context will be inserted into the instruction',
      validation: (rule) => rule.required(),
      components: {
        input: function Fix(props) {
          return <Box style={{maxWidth: 300}}>{props.renderDefault(props)}</Box>
        },
      },
    }),
  ],
  preview: {
    select: {
      ref: 'reference._id',
      title: 'reference.title',
      context: 'reference.context',
    },
    prepare(select) {
      return select.ref
        ? (contextDocumentSchema?.preview?.prepare?.(select) ?? select)
        : {title: 'No reference selected', media: contextDocumentSchema.icon}
    },
  },
  options: {
    modal: {
      type: 'popover',
      width: 'auto',
    },
  },
})

export const prompt = defineType({
  type: 'array',
  name: promptTypeName,
  title: 'Prompt',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [{title: 'Normal', value: 'normal'}],
      lists: [],
      marks: {
        decorators: [],
        annotations: [],
      },
      of: [
        defineArrayMember({
          type: fieldReference.name,
        }),
        defineArrayMember({
          type: promptContext.name,
        }),
        defineArrayMember({
          type: userInput.name,
        }),
      ],
    }),
    /*    defineArrayMember({
      type: fieldReference.name,
    }),
    defineArrayMember({
      type: promptContext.name,
    }),
    defineArrayMember({
      type: userInput.name,
    }),*/
  ],
})

export const outputFieldType = defineType({
  type: 'object',
  name: outputFieldTypeName,
  title: 'Output field',
  fields: [
    defineField({
      type: 'string',
      name: 'path',
      title: 'Path',
    }),
  ],
})

export const outputTypeType = defineType({
  type: 'object',
  name: outputTypeTypeName,
  title: 'Output type',
  fields: [
    defineField({
      type: 'string',
      name: 'type',
      title: 'Type',
    }),
  ],
})

export const instruction = defineType({
  type: 'object',
  name: instructionTypeName,
  title: 'Instruction',
  fieldsets: [
    {name: 'appearance', title: 'Appearance', options: {collapsible: true, collapsed: true}},
  ],
  preview: {
    select: {
      icon: 'icon',
      title: 'title',
      userId: 'userId',
    },
    prepare: ({icon, title, userId}) => {
      return {
        title,
        // oxlint-disable-next-line no-unsafe-type-assertion
        icon: icon ? <Icon symbol={icon as IconSymbol} /> : SparklesIcon,
        userId,
      }
    },
  },
  components: {
    input: InstructionInput,
    preview: (props: any) => {
      const Icon = props.icon
      return (
        <Flex gap={3} align="center" padding={2}>
          {Icon && (
            <Box flex="none">
              <Text size={1}>
                <Icon />
              </Text>
            </Box>
          )}

          <Stack flex={1} gap={2}>
            <Text size={1} textOverflow="ellipsis" weight="medium">
              {getInstructionTitle(props)}
            </Text>
          </Stack>

          {props.userId && (
            <Text size={1}>
              <Tooltip
                content={<Text size={1}>Only visible to you</Text>}
                padding={2}
                placement="top"
                portal
              >
                <LockIcon />
              </Tooltip>
            </Text>
          )}
        </Flex>
      )
    },
  },
  fields: [
    defineField({
      type: prompt.name,
      name: 'prompt',
      title: 'Instruction',
      components: {
        input: PromptInput,
      },
    }),
    defineField({
      type: 'string',
      name: 'icon',
      title: 'Icon',
      fieldset: 'appearance',
      components: {
        field: HiddenFieldTitle,
        input: IconInput,
      },
    }),
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
      fieldset: 'appearance',
      components: {
        field: HiddenFieldTitle,
      },
    }),
    defineField({
      type: 'string',
      name: 'userId',
      title: 'Visibility',
      fieldset: 'appearance',
      components: {
        field: HiddenFieldTitle,
        input: InstructionVisibility,
      },
      initialValue: (_params, context) => context.currentUser?.id ?? '',
      readOnly: (context) =>
        Boolean(
          context.parent?.createdById && context.parent?.createdById !== context.currentUser?.id,
        ),
    }),
    defineField({
      type: 'string',
      name: 'createdById',
      title: 'Created by',
      hidden: true,
      fieldset: 'appearance',
      initialValue: (_params, context) => {
        return context.currentUser?.id ?? ''
      },
    }),
    defineField({
      type: 'array',
      name: 'output',
      title: 'Output filter',
      components: {
        input: InstructionOutputInput,
        field: InstructionOutputField,
      },
      of: [
        defineArrayMember({type: outputFieldType.name}),
        defineArrayMember({type: outputTypeType.name}),
      ],
    }),
  ],
})

export const fieldInstructions = defineType({
  type: 'object',
  name: assistFieldTypeName,
  title: 'Field prompt',
  /*  components: {
    input: FieldPromptInput,
  },*/
  fields: [
    defineField({
      type: 'string',
      name: 'path',
      title: 'Path',
      readOnly: true,
      hidden: true,
    }),
    defineField({
      type: 'array',
      name: 'instructions',
      title: 'Instructions',
      of: [{type: instruction.name}],
      components: {
        field: InstructionsArrayField,
        input: InstructionsArrayInput,
      },
    }),
  ],
  preview: {
    select: {
      title: 'path',
    },
  },
})

export const assistDocumentSchema = defineType({
  //NOTE: this is a document type. Using object here ensures it does not appear in structure menus
  type: 'object',
  //workaround for using object and not document
  // oxlint-disable-next-line no-unsafe-type-assertion
  ...({liveEdit: true} as any),
  name: assistDocumentTypeName,
  title: 'AI Document',

  components: {
    input: AssistDocumentForm,
    field: (props: any) => {
      return props.renderDefault({...props, title: ''})
    },
  },
  fields: [
    defineField({
      type: 'string',
      name: 'title',
      title: 'Title',
    }),
    defineField({
      type: 'array',
      name: 'fields',
      title: 'Fields',
      of: [{type: fieldInstructions.name}],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
  },
})

export const instructionTask = defineType({
  type: 'object',
  name: instructionTaskTypeName,
  title: 'Instruction task',
  fields: [
    defineField({
      type: 'string',
      name: 'path',
      title: 'Path',
    }),
    defineField({
      type: 'string',
      name: 'instructionKey',
      title: 'Instruction key',
    }),
    defineField({
      type: 'datetime',
      name: 'started',
      title: 'Started',
    }),
    defineField({
      type: 'datetime',
      name: 'updated',
      title: 'Updated',
    }),
    defineField({
      type: 'string',
      name: 'info',
      title: 'Info',
    }),
  ],
})

export const documentInstructionStatus = defineType({
  //NOTE: this is a document type. Using object here ensures it does not appear in structure menus
  type: 'object',
  //workaround for using object and not document
  // oxlint-disable-next-line no-unsafe-type-assertion
  ...({liveEdit: true} as any),
  name: assistTasksStatusTypeName,
  title: 'Document instruction status',
  fields: [
    defineField({
      type: 'array',
      name: 'tasks',
      title: 'Tasks',
      of: [{type: instructionTask.name}],
    }),
  ],
})
