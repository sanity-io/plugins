import {describe, expect, test} from 'vitest'

import type {MigrationFilter} from '../types'
import {isAllowedMigrationTarget} from './migrationFilters'

const SOURCE_PROJECT = 'projA'
const SOURCE_DATASET = 'production'

function check(
  migrationFilters: MigrationFilter[] | undefined,
  target: {projectId: string; dataset: string},
) {
  return isAllowedMigrationTarget({
    migrationFilters,
    sourceProjectId: SOURCE_PROJECT,
    sourceDataset: SOURCE_DATASET,
    targetProjectId: target.projectId,
    targetDataset: target.dataset,
  })
}

describe('isAllowedMigrationTarget', () => {
  test('allows any target when migrationFilters is undefined', () => {
    expect(check(undefined, {projectId: SOURCE_PROJECT, dataset: 'staging'})).toBe(true)
    expect(check(undefined, {projectId: 'projB', dataset: 'anything'})).toBe(true)
  })

  test('allows any target when migrationFilters is empty', () => {
    expect(check([], {projectId: 'projB', dataset: 'staging'})).toBe(true)
  })

  test('allows any target when no filter matches the source dataset', () => {
    const filters: MigrationFilter[] = [{sourceDataset: 'other', targets: [{dataset: 'staging'}]}]
    expect(check(filters, {projectId: 'projB', dataset: 'staging'})).toBe(true)
    expect(check(filters, {projectId: SOURCE_PROJECT, dataset: 'whatever'})).toBe(true)
  })

  describe('when a filter matches the source dataset', () => {
    const filters: MigrationFilter[] = [
      {sourceDataset: SOURCE_DATASET, targets: [{dataset: 'staging'}]},
    ]

    test('allows a listed dataset within the same project (projectId omitted)', () => {
      expect(check(filters, {projectId: SOURCE_PROJECT, dataset: 'staging'})).toBe(true)
    })

    test('disallows a listed dataset in a different project when projectId is omitted', () => {
      expect(check(filters, {projectId: 'projB', dataset: 'staging'})).toBe(false)
    })

    test('disallows a dataset that is not in the targets list', () => {
      expect(check(filters, {projectId: SOURCE_PROJECT, dataset: 'live'})).toBe(false)
    })
  })

  describe('cross-project targets (explicit projectId)', () => {
    const filters: MigrationFilter[] = [
      {sourceDataset: SOURCE_DATASET, targets: [{projectId: 'projB', dataset: 'staging'}]},
    ]

    test('allows a target whose project and dataset both match', () => {
      expect(check(filters, {projectId: 'projB', dataset: 'staging'})).toBe(true)
    })

    test('disallows a matching dataset in a non-matching project', () => {
      expect(check(filters, {projectId: 'projC', dataset: 'staging'})).toBe(false)
    })

    test('disallows a same-project target when the configured projectId differs', () => {
      // A target entry with an explicit projectId must match that project; the
      // same-project fallback only applies when projectId is omitted.
      expect(check(filters, {projectId: SOURCE_PROJECT, dataset: 'staging'})).toBe(false)
    })
  })

  test('supports multiple targets and multiple filters', () => {
    const filters: MigrationFilter[] = [
      {
        sourceDataset: SOURCE_DATASET,
        targets: [{dataset: 'staging'}, {projectId: 'projB', dataset: 'qa'}],
      },
      {sourceDataset: 'sandbox', targets: [{dataset: 'staging'}]},
    ]

    expect(check(filters, {projectId: SOURCE_PROJECT, dataset: 'staging'})).toBe(true)
    expect(check(filters, {projectId: 'projB', dataset: 'qa'})).toBe(true)
    expect(check(filters, {projectId: SOURCE_PROJECT, dataset: 'qa'})).toBe(false)
    expect(check(filters, {projectId: 'projB', dataset: 'staging'})).toBe(false)
  })
})
