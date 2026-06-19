import {expect, test} from 'vitest'

import pkg from '../package.json'
import {runCliCommand} from './fixture-utils'

test('shows full version if no flag is given', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('version', [])
  expect(exitCode, 'should have exit code 0').toBe(0)
  expect(stderr, 'stderr should be empty').toBe('')
  expect(stdout).toBe(`${pkg.name} version ${pkg.version}`)
})

test('shows major version if --major is given', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('version', ['--major'])
  expect(exitCode, 'should have exit code 0').toBe(0)
  expect(stderr, 'stderr should be empty').toBe('')
  expect(stdout).toBe(pkg.version.split('.')[0])
})

test('shows minor version if --minor is given', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('version', ['--minor'])
  expect(exitCode, 'should have exit code 0').toBe(0)
  expect(stderr, 'stderr should be empty').toBe('')
  expect(stdout).toBe(pkg.version.split('.')[1])
})

test('shows patch version if --patch is given', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('version', ['--patch'])
  expect(exitCode, 'should have exit code 0').toBe(0)
  expect(stderr, 'stderr should be empty').toBe('')
  expect(stdout).toBe(pkg.version.split('.')[2])
})

test('throws if two version flags are given', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('version', ['--major', '--minor'])
  expect(exitCode, 'exit code should be 1').toBe(1)
  expect(stdout, 'stdout should be empty').toBe('')
  expect(stderr).toContain('only one can be used at a time')
})
