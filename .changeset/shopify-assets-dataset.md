---
'sanity-plugin-shopify-assets': minor
---

Add an optional `dataset` setting on the plugin and on `shopify.asset` fields so asset requests can use the dataset connected to Shopify. A field value overrides the plugin value, and `dataset` and `shopifyDomain` can be overridden independently. When neither is set, requests keep using the active Studio dataset.
