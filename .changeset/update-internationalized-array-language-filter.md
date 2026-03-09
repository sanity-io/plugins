---
'sanity-plugin-internationalized-array': patch
---

Update `@sanity/language-filter` to `4.1.0` and adjust language segment matching to pass the current item value, updating language filtering behavior with the new parameter.

Now when using language filter in the internationalized array you will receive a 4th parameter with the value of the object containing the field you are trying to filter.
For example:

```ts
{
    _key: "en",
    value: "Hello world"
}
```
