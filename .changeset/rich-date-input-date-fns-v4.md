---
"@sanity/rich-date-input": minor
---

Update `date-fns` to v4 and replace the community `date-fns-tz` package with the official `@date-fns/tz` package, matching how Sanity Studio itself now handles time zones. Since these are the same versions the `sanity` package ships, studios no longer bundle a second `date-fns` instance. The time zone list is now derived from the runtime's `Intl` API instead of the static `@vvo/tzdb` database, which keeps it current with the browser and trims the bundle.
