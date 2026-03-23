---
'sanity-plugin-internationalized-array': patch
---

Fix custom object (and other) input components not rendering for types registered in the plugin `fieldTypes`. The inner `value` field no longer adds `components.input`, so Studio shows your custom input inside each language row again. 
Now, internationalized array inputs will have the option to add comments, show validation and any field action.