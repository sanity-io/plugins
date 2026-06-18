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
  ExperimentProvider,
  Field,
  Input,
  VariantInput,
  VariantPreview,
} from './components/experiment'
import type {ExperimentFieldPluginConfig} from './types'
import {flattenSchemaType} from './utils/flattenSchemaType'

const createExperimentType = ({
  field,
  experimentNameOverride,
  variantNameOverride,
  variantId,
  variantArrayName,
  experimentId,
}: {
  field: string | FieldDefinition
  experimentNameOverride: string
  variantNameOverride: string
  variantId: string
  variantArrayName: string
  experimentId: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + typeName.slice(1)
  const variantName = `${variantNameOverride}${usedName}`

  return defineType({
    name: `${experimentNameOverride}${usedName}`,
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
        name: 'experiments',
        title: 'Experiments',
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
          experimentId={experimentId}
          experimentNameOverride={experimentNameOverride}
          variantNameOverride={variantNameOverride}
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
        name: experimentId,
        type: 'string',
        group: 'experiments',
        components: {
          input: (props) => (
            <Input
              {...props}
              experimentNameOverride={experimentNameOverride}
              variantNameOverride={variantNameOverride}
            />
          ),
        },
        hidden: ({parent}) => {
          return !parent?.active
        },
      }),
      defineField({
        name: variantArrayName,
        type: 'array',
        group: 'experiments',
        hidden: ({parent}) => {
          return !parent?.[experimentId]
        },
        components: {
          input: (props: ArrayOfObjectsInputProps) => (
            <ArrayInput
              {...props}
              variantName={variantName}
              variantId={variantId}
              experimentId={experimentId}
            />
          ),
        },
        of: [
          defineField({
            name: variantName,
            type: variantName,
          }),
        ],
      }),
    ],
    preview: {
      select: {
        base: 'default',
        experiment: experimentId,
      },
      prepare: ({base, experiment}) => {
        const title = base?.title || base?.name || typeof base === 'string' ? base : ''
        const experimentTitle = experiment ? `Experiment: ${experiment}` : ''
        const media = base?.image || base?.photo || base?.media || ''
        return {
          title: title || experimentTitle,
          subtitle: title ? experimentTitle : '',
          media,
        }
      },
    },
  })
}

const createVariantType = ({
  field,
  variantNameOverride,
  variantId,
  experimentId,
}: {
  field: string | FieldDefinition
  variantNameOverride: string
  variantId: string
  experimentId: string
}) => {
  const typeName = typeof field === `string` ? field : field.name
  const usedName = String(typeName[0]).toUpperCase() + typeName.slice(1)
  return defineType({
    name: `${variantNameOverride}${usedName}`,
    title: `${variantNameOverride} array ${usedName}`,
    type: 'object',
    components: {
      preview: VariantPreview,
      input: VariantInput,
    },
    fields: [
      {
        type: 'string',
        name: variantId,
        readOnly: true,
      },
      {
        type: 'string',
        name: experimentId,
        hidden: true,
      },
      typeof field === `string`
        ? // Define a simple field if all we have is the name as a string
          defineField({
            name: 'value',
            type: field,
            // hidden: ({parent}) => !parent?.[`${objectNameOverride}Id`],
          })
        : // Pass in the configured options, but overwrite the name
          {
            ...field,
            name: 'value',
            // hidden: ({parent}) => !parent?.[`${objectNameOverride}Id`],
          },
    ],
    preview: {
      select: {
        variant: variantId,
        experiment: experimentId,
        value: 'value',
      },
    },
  })
}

const fieldSchema = ({
  fields,
  experimentNameOverride,
  variantNameOverride,
  variantId,
  variantArrayName,
  experimentId,
}: Required<Omit<ExperimentFieldPluginConfig, 'apiVersion' | 'experiments'>>) => {
  return [
    ...fields.map((field) =>
      createVariantType({field, variantNameOverride, variantId, experimentId}),
    ),
    ...fields.map((field) =>
      createExperimentType({
        field,
        experimentNameOverride,
        variantNameOverride,
        variantId,
        variantArrayName,
        experimentId,
      }),
    ),
  ]
}

export const fieldLevelExperiments = definePlugin<ExperimentFieldPluginConfig>((config) => {
  const pluginConfig = {...CONFIG_DEFAULT, ...config}
  const {fields, experimentNameOverride, variantNameOverride} = pluginConfig

  const experimentId = `${experimentNameOverride}Id`
  const variantArrayName = `${variantNameOverride}s`
  const variantId = `${variantNameOverride}Id`

  const fieldSchemaConfig = fieldSchema({
    fields,
    experimentNameOverride,
    variantNameOverride,
    variantId,
    variantArrayName,
    experimentId,
  })
  return {
    name: 'sanity-personalistaion-plugin-field-level-experiments',
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
          const hasExperiment = flatFields.some(
            (field) =>
              field.type.name.startsWith(experimentNameOverride) ||
              field.name.startsWith(experimentNameOverride),
          )

          if (!hasExperiment) {
            return props.renderDefault(props)
          }

          const providerProps = {
            ...props,
            experimentFieldPluginConfig: {
              ...pluginConfig,
              variantId,
              variantArrayName,
              experimentId,
            },
          }
          return ExperimentProvider(providerProps)
        },
      },
    },
  }
})
