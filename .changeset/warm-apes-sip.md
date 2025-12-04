---
"sanity-plugin-bynder-input": major
---

Updates Bynder Compact View from 3.x.x to 5.1.1
This will introduce a [number of improvements](https://developer-docs.bynder.com/ui-components#history) and features for the plugin.
Secondly, it migrates from CDN script installation to an npm package, which will eliminate the risks associated with it. And on top of that 

Update required a breaking change in the API of the plugin.

From the plugin perspective, migration should be straightforward; however, there is also a breaking change in the UCV regarding `AssetFilterJson`, so it might require more attention.

Thank you @Shastel!
