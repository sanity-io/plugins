/**
 * Lightweight email check for interactive prompts.
 * Replaces the `email-validator` package.
 */
export function isValidEmail(value: string): boolean {
  // Practical check: local@domain with a dot in the domain. Prompt UX only —
  // not an RFC 5322 validator.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
