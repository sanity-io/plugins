import {FieldDefinition} from 'sanity'

export type LaunchDarklyFieldLevelConfig = {
  fields: (string | FieldDefinition)[]
  projectKey: string
  tags?: string[]
}
export type LaunchDarklyContextProps = {
  setSecret: (secret: string | undefined) => void
  secret: string | undefined
}

export type LaunchDarklyFlagItem = {
  name: string
  kind: string
  key: string
  _version: number
  creationDate: number
  variations: Array<{
    value: boolean | string | number
    _id: string
    name: string
  }>
  temporary: boolean
  tags: string[]
  _links: {
    parent: {
      href: string
      type: string
    }
    self: {
      href: string
      type: string
    }
  }
  experiments: {
    baselineIdx: number
    items: Array<{
      metricKey: string
      _metric: {
        _id: string
        _versionId: string
        key: string
        name: string
        kind: string
        _links: {
          parent: {
            href: string
            type: string
          }
          self: {
            href: string
            type: string
          }
        }
        tags: string[]
        _creationDate: number
        experimentCount: number
        metricGroupCount: number
        _attachedFlagCount: number
        maintainerId: string
        _maintainer: {
          _links: {
            self: {
              href: string
              type: string
            }
          }
          _id: string
          role: string
          email: string
          firstName: string
          lastName: string
        }
        category: string
        isNumeric: boolean
        percentileValue: number
      }
    }>
  }
  customProperties: {
    key: {
      name: string
      value: string[]
    }
  }
  archived: boolean
  description: string
  maintainerId: string
  _maintainer: {
    _links: {
      self: {
        href: string
        type: string
      }
    }
    _id: string
    role: string
    email: string
    firstName: string
    lastName: string
  }
  maintainerTeamKey: string
  _maintainerTeam: {
    key: string
    name: string
    _links: {
      parent: {
        href: string
        type: string
      }
      roles: {
        href: string
        type: string
      }
      self: {
        href: string
        type: string
      }
    }
  }
  archivedDate: number
  deprecated: boolean
  deprecatedDate: number
  defaults: {
    onVariation: number
    offVariation: number
  }
  _purpose: string
  migrationSettings: {
    contextKind: string
    stageCount: number
  }
  environments: {
    [key: string]: {
      on: boolean
      archived: boolean
      salt: string
      sel: string
      lastModified: number
      version: number
      _site: {
        href: string
        type: string
      }
      _environmentName: string
      trackEvents: boolean
      trackEventsFallthrough: boolean
      targets: Array<{
        values: string[]
        variation: number
        contextKind: string
      }>
      contextTargets: Array<{
        values: string[]
        variation: number
        contextKind: string
      }>
      rules: Array<{
        clauses: Array<{
          attribute: string
          op: string
          values: unknown[]
          negate: boolean
        }>
        trackEvents: boolean
      }>
      fallthrough: {
        variation: number
      }
      offVariation: number
      prerequisites: Array<{
        key: string
        variation: number
      }>
      _summary: {
        variations: {
          [key: string]: {
            rules: number
            nullRules: number
            targets: number
            contextTargets: number
            isFallthrough?: boolean
            isOff?: boolean
          }
        }
        prerequisites: number
      }
    }
  }
  includeInSnippet: boolean
  goalIds: string[]
}
