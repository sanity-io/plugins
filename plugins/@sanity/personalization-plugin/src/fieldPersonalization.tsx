import {
  type ArrayOfObjectsInputProps,
  defineField,
  definePlugin,
  defineType,
  type FieldDefinition,
  isObjectInputProps,
} from 'sanity'

import {ArrayItem} from './components/ArrayItem'
import {
  ArrayInput,
  CONFIG_DEFAULT,
  Field,
  PersonalizationProvider,
  SegmentInput,
  SegmentPreview,
} from './components/personalization'
import type {PersonalizationFieldPluginConfig} from './types'
import {flattenSchemaType} from './utils/flattenSchemaType'

const createPersonalizationType = ({
  field,
  personalizationNameOverride,
  segmentNameOverride,
  segmentId,
  segmentArrayName,
}: {
  field: string | FieldDefinition
  personalizationNameOverride: string
  segmentNameOverride: string
  segmentId: string
  segmentArrayName: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + typeName.slice(1)
  const segmentName = `${segmentNameOverride}${usedName}`

  return defineType({
    name: `${personalizationNameOverride}${usedName}`,
    type: 'object',
    groups: [
      {
        name: 'default',
        title: 'Default',
        hidden: ({parent}) => {
          return !Array.isArray(parent)
        },
      },
      {
        name: 'personalization',
        title: 'Personalization options',
        hidden: ({parent}) => {
          return !Array.isArray(parent)
        },
      },
      {
        name: 'all-fields',
        title: 'All fields',
        hidden: ({parent}) => {
          return Array.isArray(parent)
        },
      },
    ],
    components: {
      field: (props) => (
        <Field
          {...props}
          personalizationNameOverride={personalizationNameOverride}
          segmentNameOverride={segmentNameOverride}
        />
      ),
      item: ArrayItem,
    },
    fields: [
      typeof field === `string`
        ? // Define a simple field if all we have is the name as a string
          defineField({
            name: 'default',
            type: field,
            group: 'default',
          })
        : // Pass in the configured options, but overwrite the name
          {
            ...field,
            name: 'default',
            group: 'default',
          },
      defineField({
        name: 'active',
        type: 'boolean',
        hidden: true,
        initialValue: false,
      }),
      defineField({
        name: segmentArrayName,
        type: 'array',
        hidden: ({parent}) => {
          return !parent?.active
        },
        group: 'personalization',
        components: {
          input: (props: ArrayOfObjectsInputProps) => (
            <ArrayInput {...props} segmentName={segmentName} segmentId={segmentId} />
          ),
        },
        of: [
          defineField({
            name: segmentName,
            type: segmentName,
          }),
        ],
      }),
    ],
    preview: {
      select: {
        base: 'default',
      },
      prepare: ({base}) => {
        const title = base?.title || base?.name || typeof base === 'string' ? base : ''
        const media = base?.image || base?.photo || base?.media || ''
        return {
          title: title,
          media,
        }
      },
    },
  })
}

const createSegmentType = ({
  field,
  segmentNameOverride,
  segmentId,
}: {
  field: string | FieldDefinition
  segmentNameOverride: string
  segmentId: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + typeName.slice(1)
  return defineType({
    name: `${segmentNameOverride}${usedName}`,
    title: `${segmentNameOverride} array ${usedName}`,
    type: 'object',
    components: {
      preview: SegmentPreview,
      input: SegmentInput,
    },
    fields: [
      {
        type: 'string',
        name: segmentId,
        readOnly: true,
      },
      typeof field === `string`
        ? // Define a simple field if all we have is the name as a string
          defineField({
            name: 'value',
            type: field,
          })
        : // Pass in the configured options, but overwrite the name
          {
            ...field,
            name: 'value',
          },
    ],
    preview: {
      select: {
        segment: segmentId,
        value: 'value',
      },
    },
  })
}

const fieldSchema = ({
  fields,
  personalizationNameOverride,
  segmentNameOverride,
  segmentId,
  segmentArrayName,
}: Required<Omit<PersonalizationFieldPluginConfig, 'apiVersion' | 'segments'>>) => {
  return [
    ...fields.map((field) => createSegmentType({field, segmentNameOverride, segmentId})),
    ...fields.map((field) =>
      createPersonalizationType({
        field,
        personalizationNameOverride,
        segmentNameOverride,
        segmentId,
        segmentArrayName,
      }),
    ),
  ]
}

export const fieldLevelPersonalization = definePlugin<PersonalizationFieldPluginConfig>(
  (config) => {
    const pluginConfig = {...CONFIG_DEFAULT, ...config}
    const {fields, personalizationNameOverride, segmentNameOverride} = pluginConfig

    const segmentArrayName = `${segmentNameOverride}s`
    const segmentId = `${segmentNameOverride}Id`

    const fieldSchemaConfig = fieldSchema({
      fields,
      personalizationNameOverride,
      segmentNameOverride,
      segmentId,
      segmentArrayName,
    })
    return {
      name: 'sanity-personalistaion-plugin-field-level-personalization',
      schema: {
        types: fieldSchemaConfig,
      },
      form: {
        components: {
          input: (props) => {
            const isRootInput = props.id === 'root' && isObjectInputProps(props)

            if (!isRootInput) {
              return props.renderDefault(props)
            }

            const flatFields = flattenSchemaType(props.schemaType)
            const hasPersonalization = flatFields.some(
              (field) =>
                field.type.name.startsWith(personalizationNameOverride) ||
                field.name.startsWith(personalizationNameOverride),
            )

            if (!hasPersonalization) {
              return props.renderDefault(props)
            }

            const providerProps = {
              ...props,
              personalizationFieldPluginConfig: {
                ...pluginConfig,
                segmentId,
                segmentArrayName,
              },
            }
            return PersonalizationProvider(providerProps)
          },
        },
      },
    }
  },
)
