---
'@sanity/form-toolkit': patch
---

Remove the `@mailchimp/mailchimp_marketing` dependency. The Mailchimp handler now calls Mailchimp's Marketing API with `fetch`, which also keeps the SDK and its deprecated `superagent` dependency out of Studio bundles that import `mailchimpInput`.
