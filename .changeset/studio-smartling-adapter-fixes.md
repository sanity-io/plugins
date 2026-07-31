---
'sanity-plugin-studio-smartling': patch
---

Harden the Smartling adapter and fix docs:

- Send the secret credentials JSON verbatim during authentication instead of double-encoding it, which could break auth with proxies that forward the request body as-is
- Throw a clear error (surfacing Smartling's message) when authentication does not return an access token, instead of a cryptic `TypeError`
- Avoid throwing when no existing job is found or when a translation/progress response is missing its expected payload
- Guard the progress calculation against a zero total word count so empty documents no longer report `NaN`/`Infinity`
- Fix the `additionalDeserializers` option name in the advanced configuration docs (was `additonalDeserializers`) and update the README development/release instructions for the monorepo
