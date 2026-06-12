import {
  ArrayOfObjectsInputProps,
  FieldDefinition,
  ObjectField,
  Path,
  PreviewProps,
  SanityClient,
  SchemaType,
} from 'sanity'

export type VariantType = {
  id: string
  label: string
}
export type ExperimentType = {
  id: string
  label: string
  variants: VariantType[]
}

export type FieldPluginConfig = {
  fields: (string | FieldDefinition)[]
  experiments: ExperimentType[] | ((client: SanityClient) => Promise<ExperimentType[]>)
  apiVersion?: string
  experimentNameOverride?: string
  variantNameOverride?: string
  variantId?: string
  variantArrayName?: string
  experimentId?: string
}

export type VariantPreviewProps = Omit<PreviewProps, 'SchemaType'> & {
  [key: string]: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export type ExperimentContextProps = Required<FieldPluginConfig> & {
  experiments: ExperimentType[]
}

export type ArrayInputProps = ArrayOfObjectsInputProps & {
  variantName: string
  variantId: string
  experimentId: string
}

export type ObjectFieldWithPath = ObjectField<SchemaType> & {path: Path}

export type VariantGeneric<T> = {
  [key: string]: string | T | undefined
  _type: string
  value?: T
}

export type ExperimentGeneric<T> = {
  _type: string
  default?: T
  experimentValue?: string
  [key: string]:
    | Array<
        {
          _key: string
        } & VariantGeneric<T>
      >
    | string
    | T
    | undefined
}

export type GrowthbookExperiment = {
  id: string
  dateCreated: string
  dateUpdated: string
  name: string
  project: string
  hypothesis: string
  description: string
  tags: [string]
  owner: string
  archived: boolean
  status: string
  autoRefresh: boolean
  hashAttribute: string
  fallbackAttribute: string
  hashVersion: number
  disableStickyBucketing: boolean
  bucketVersion: number
  minBucketVersion: number
  variations: [
    {
      variationId: string
      key: string
      name: string
      description: string
      screenshots: [string]
    },
  ]
  phases: [
    {
      name: string
      dateStarted: string
      dateEnded: string
      reasonForStopping: string
      seed: string
      coverage: 0
      trafficSplit: [
        {
          variationId: string
          weight: 0
        },
      ]
      namespace: {
        namespaceId: string
        range: []
      }
      targetingCondition: string
      savedGroupTargeting: [
        {
          matchType: string
          savedGroups: [string]
        },
      ]
    },
  ]
  settings: {
    datasourceId: string
    assignmentQueryId: string
    experimentId: string
    segmentId: string
    queryFilter: string
    inProgressConversions: string
    attributionModel: string
    statsEngine: string
    regressionAdjustmentEnabled: boolean
    goals: [
      {
        metricId: string
        overrides: {
          delayHours: 0
          windowHours: 0
          window: string
          winRiskThreshold: 0
          loseRiskThreshold: 0
        }
      },
    ]
    secondaryMetrics: [
      {
        metricId: string
        overrides: {
          delayHours: 0
          windowHours: 0
          window: string
          winRiskThreshold: 0
          loseRiskThreshold: 0
        }
      },
    ]
    guardrails: [
      {
        metricId: string
        overrides: {
          delayHours: 0
          windowHours: 0
          window: string
          winRiskThreshold: 0
          loseRiskThreshold: 0
        }
      },
    ]
    activationMetric: {
      metricId: string
      overrides: {
        delayHours: 0
        windowHours: 0
        window: string
        winRiskThreshold: 0
        loseRiskThreshold: 0
      }
    }
  }
  resultSummary: {
    status: string
    winner: string
    conclusions: string
    releasedVariationId: string
    excludeFromPayload: boolean
  }
}

export type GrowthbookFeature = {
  id: string
  dateCreated: string
  dateUpdated: string
  archived: boolean
  description: string
  owner: string
  project: string
  valueType: string
  defaultValue: string
  tags: string[]
  environments: {
    [key: string]: {
      enabled: boolean
      defaultValue: string
      rules: {
        description: string
        condition: string
        savedGroupTargeting: {matchType: string; savedGroups: string[]}[]
        id: string
        enabled: boolean
        type: string
        value: string
        variations: {value: string; variationId: string}[]
      }[]
      definition: string
      draft: {
        enabled: boolean
        defaultValue: string
        rules: {
          description: string
          condition: string
          savedGroupTargeting: {matchType: string; savedGroups: string[]}[]
          id: string
          enabled: boolean
          type: string
          value: string
          variations: {value: string; variationId: string}[]
        }[]
        definition: string
      }
    }
  }
  prerequisites: {
    parentId: string
    parentCondition: string
  }[]
  revision: {
    version: number
    comment: string
    date: string
    publishedBy: string
  }
}
