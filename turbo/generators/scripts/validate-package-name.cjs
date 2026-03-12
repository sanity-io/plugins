#!/usr/bin/env node
// Helper script to validate npm package names
// This is executed via execSync to avoid bundling issues with turbo gen

const validateNpmPackageName = require('validate-npm-package-name')

const packageName = process.argv[2]
if (!packageName) {
  console.error('Usage: validate-package-name.cjs <package-name>')
  process.exit(1)
}

const result = validateNpmPackageName(packageName)
if (result.errors && result.errors.length > 0) {
  console.error(result.errors.join(', '))
  process.exit(1)
}

// oxlint-disable-next-line no-console
console.log('valid')
process.exit(0)
