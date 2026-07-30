---
"@sanity/form-toolkit": patch
---

Address post-migration review feedback:

- `FormRenderer` now renders interactive (uncontrolled) inputs when no `getFieldState` is provided, so the documented native HTML form usage works out of the box
- Uncontrolled text and textarea fields honor `options.defaultValue`
- `FormRenderer` falls back to `field.name` for the React key when a field has no `_key`
- The shared HubSpot/Mailchimp request handler defaults to the Next.js-compatible handler instead of throwing when no framework environment variable is detected, and short-circuits CORS preflight (`OPTIONS`) requests
- Corrected the `formSchema`, `formiumInput`, and `mailchimpInput` usage examples (import paths and required options), README typos, and example/dev-workflow references
