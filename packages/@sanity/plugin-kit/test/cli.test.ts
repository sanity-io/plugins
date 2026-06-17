import {expect, test} from 'vitest'

import {cliName} from '../src/constants'
import {runCliCommand} from './fixture-utils'

const helpString = 'These are common commands used in various situations'

test('shows help if no command is given', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('', [])
  expect(exitCode, 'should have exit code 2').toBe(2)
  expect(stderr).toBe('')
  expect(stdout).toContain(helpString)
  expect(stdout).toContain(cliName)
})

test('shows error + help on unknown commands', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('does-not-exist', [])
  expect(exitCode, 'should have exit code 2').toBe(2)
  expect(stderr).toBe('Unknown command "does-not-exist"')
  expect(stdout).toContain(helpString)
  expect(stdout).toContain(cliName)
})

test('shows error + help when using both --silent and --verbose', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('version', ['--silent', '--verbose'], {
    reject: false,
  })
  expect(exitCode, 'should have exit code 2').toBe(2)
  expect(stderr).toContain('--silent and --verbose are mutually exclusive')
  expect(stdout).toContain(helpString)
  expect(stdout).toContain(cliName)
})

test('shows no stack trace without --debug', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand('version', ['--major', '--minor'], {
    reject: false,
  })
  expect(exitCode, 'should have exit code 1').toBe(1)
  expect(stdout, 'should have empty stdout').toBe('')
  expect(stderr).toContain('only one can be used at a time')
  expect(stderr).not.toContain('    at ')
})

test('shows stack trace with --debug', {timeout: 30_000}, async () => {
  const {stdout, stderr, exitCode} = await runCliCommand(
    'version',
    ['--major', '--minor', '--debug'],
    {
      reject: false,
    },
  )
  expect(exitCode, 'should have exit code 1').toBe(1)
  expect(stdout, 'should have empty stdout').toBe('')
  expect(stderr).toContain('only one can be used at a time')
  expect(stderr).toContain('    at ')
})
