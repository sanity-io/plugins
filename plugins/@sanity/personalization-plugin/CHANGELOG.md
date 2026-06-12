<!-- markdownlint-disable --><!-- textlint-disable -->

# 📓 Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.5.0](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.4.3...v2.5.0) (2026-01-19)

### Features

- movec LaunchDarkly export to own subpath and refactored ([021e96c](https://github.com/sanity-io/sanity-plugin-personalization/commit/021e96c4e5c5bfa7d070880aa84cb88efff565cf))
- use sanity secrets, ability to filter and paginate request to LD ([05b95db](https://github.com/sanity-io/sanity-plugin-personalization/commit/05b95db752a5510ea03344470b3043427b0dc7fc))

### Bug Fixes

- updated so all values from LD stored as strings ([bbe64aa](https://github.com/sanity-io/sanity-plugin-personalization/commit/bbe64aacc4da7796b82f527efe38dbd63ab53fda))
- use value for variant label if no label ([6ed4175](https://github.com/sanity-io/sanity-plugin-personalization/commit/6ed417505105a7a5b9049fac273612019dfe123f))

## [2.4.3](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.4.2...v2.4.3) (2025-12-18)

### Bug Fixes

- **deps:** make peer dependencies include sanity 5.x ([34b7d99](https://github.com/sanity-io/sanity-plugin-personalization/commit/34b7d998eaf2efd24c1b5b91c5c8117b47f8f3cd))

## [2.4.2](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.4.1...v2.4.2) (2025-08-15)

### Bug Fixes

- copy default works in modals ([0be717b](https://github.com/sanity-io/sanity-plugin-personalization/commit/0be717b83c6fc9fd8fb355813f3c8c88fe99955c))
- when used in modal auto set to active ([a62e6fa](https://github.com/sanity-io/sanity-plugin-personalization/commit/a62e6fae5608ea14ecbfbaae5df2a93f86d09ee7))

## [2.4.1](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.4.0...v2.4.1) (2025-07-10)

### Bug Fixes

- added media to preview ([e1402db](https://github.com/sanity-io/sanity-plugin-personalization/commit/e1402dbd8eb3efb3455557678ca28b962f3efa24))
- **deps:** allow studio v4 in peer dep ranges ([#34](https://github.com/sanity-io/sanity-plugin-personalization/issues/34)) ([8b8e6a1](https://github.com/sanity-io/sanity-plugin-personalization/commit/8b8e6a1d8de07609aee134a89f40fc8ccf207a16))
- improved preview in arraays ([d8beda3](https://github.com/sanity-io/sanity-plugin-personalization/commit/d8beda3f9fe84c8d68fa6ed45eea60503ad931e3))
- improved preview when used in array ([0191341](https://github.com/sanity-io/sanity-plugin-personalization/commit/0191341e7b24a863189fa0330b16871102b72e63))

## [2.4.0](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.3.0...v2.4.0) (2025-05-16)

### Features

- increase flatten depth ([#31](https://github.com/sanity-io/sanity-plugin-personalization/issues/31)) ([0cb34f3](https://github.com/sanity-io/sanity-plugin-personalization/commit/0cb34f30062da6e9f792a39534ff8a5b2e7fb007))

## [2.3.0](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.2.1...v2.3.0) (2025-05-06)

### Features

- added boolena conversion check ([51a3a59](https://github.com/sanity-io/sanity-plugin-personalization/commit/51a3a59199992269dfe6dcf8f054f0f278bb4d7c))
- added growthbook flied experiments as a plugin ([d28d2cc](https://github.com/sanity-io/sanity-plugin-personalization/commit/d28d2cc7875c2addbfb749f55e69221822e035f5))
- made growthbook its own subpath export ([bcc1034](https://github.com/sanity-io/sanity-plugin-personalization/commit/bcc1034d4ed49327ac6e0250341964b1d1c673f5))
- new config option, updated experiment fetching ([ef300fb](https://github.com/sanity-io/sanity-plugin-personalization/commit/ef300fbcb2116e2b49a13a17195a09b6e479ea7e))

### Bug Fixes

- ensure that values are not duplicated ([52ab544](https://github.com/sanity-io/sanity-plugin-personalization/commit/52ab5441c175653ac075b7f4224c92f0363c38f6))
- get experiments from feature flags for growthbook and store values that will be used by FE ([eb40e0b](https://github.com/sanity-io/sanity-plugin-personalization/commit/eb40e0baeeb536cdf6a74f14dd5007c16e041426))
- only show secret input when finished loading ([a0eb18d](https://github.com/sanity-io/sanity-plugin-personalization/commit/a0eb18d494d4db3f92b09ce1b1edde846ee8c21d))
- resolved issue with too many re renders on experiments ([24f018e](https://github.com/sanity-io/sanity-plugin-personalization/commit/24f018ed3028ffd36f3b86975543a1a9cdca9239))
- updated base url to use corect api domain ([4d9b4f1](https://github.com/sanity-io/sanity-plugin-personalization/commit/4d9b4f1bc4c3acd15b0642a80efa364202239179))

## [2.2.1](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.2.0...v2.2.1) (2025-04-25)

### Bug Fixes

- works with content releases and removes variants if experiment changes" ([75c9a78](https://github.com/sanity-io/sanity-plugin-personalization/commit/75c9a78fb67feb9ab461c0c6f67943155e29ad2c))

## [2.2.0](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.1.0...v2.2.0) (2025-03-26)

### Features

- added message to warn there are no defeined experiments ([9302f08](https://github.com/sanity-io/sanity-plugin-personalization/commit/9302f0817327d33feb8ff26661ab18391fb4ff9d))

## [2.1.0](https://github.com/sanity-io/sanity-plugin-personalization/compare/v2.0.0...v2.1.0) (2025-02-21)

### Features

- added ability to copy default to a variant ([c1ff90a](https://github.com/sanity-io/sanity-plugin-personalization/commit/c1ff90a0cf000f8bb2fa455077d4a4e605820650))
- allow overiding of experiment and variant field names ([f42e75c](https://github.com/sanity-io/sanity-plugin-personalization/commit/f42e75c1643dee5074b5278742df086e4264c139))

## [2.0.0](https://github.com/sanity-io/sanity-plugin-personalization/compare/v1.1.1...v2.0.0) (2025-02-07)

### ⚠ BREAKING CHANGES

- use US english for repo name

### Features

- updated list preview to reflect experiment variants ([c479c65](https://github.com/sanity-io/sanity-plugin-personalization/commit/c479c654f91ef4897295ff2a1e43e52597b8f3f5))

### Documentation

- updated repo link ([79d0b02](https://github.com/sanity-io/sanity-plugin-personalization/commit/79d0b0245e3e17553b24ab6d555d9e6e51b1aba7))

## [1.1.1](https://github.com/sanity-io/sanity-plugin-personalisation/compare/v1.1.0...v1.1.1) (2025-01-02)

### Bug Fixes

- remove unneeded comments ([57d3d9a](https://github.com/sanity-io/sanity-plugin-personalisation/commit/57d3d9a16ed39296ca5d28a9d997e6856798c143))

## [1.1.0](https://github.com/sanity-io/sanity-plugin-personalisation/compare/v1.0.3...v1.1.0) (2024-12-09)

### Features

- allow canary branch to make releases ([936068d](https://github.com/sanity-io/sanity-plugin-personalisation/commit/936068dd392074c62821f5ab2ba4bbcfb34a9489))

### Bug Fixes

- use onchagne from props rather than document operation for patch ([b61cdce](https://github.com/sanity-io/sanity-plugin-personalisation/commit/b61cdce12e470125fe70293bce983f48d091ade6))

## [1.0.3](https://github.com/sanity-io/sanity-plugin-personalisation/compare/v1.0.2...v1.0.3) (2024-11-26)

### Bug Fixes

- updated plugin name to match scoped package ([d0eb0cc](https://github.com/sanity-io/sanity-plugin-personalisation/commit/d0eb0cc930a9d1a4c2c38ff35bc68eafb8435ebc))

## [1.0.2](https://github.com/sanity-io/sanity-plugin-personalisation/compare/v1.0.1...v1.0.2) (2024-11-26)

### Bug Fixes

- updated name of package in readme ([847a8a1](https://github.com/sanity-io/sanity-plugin-personalisation/commit/847a8a1f04e24a7421381490a0d31020cc30dff3))

## [1.0.1](https://github.com/sanity-io/sanity-plugin-personalisation/compare/v1.0.0...v1.0.1) (2024-11-25)

### Bug Fixes

- update relase workflow ([a991386](https://github.com/sanity-io/sanity-plugin-personalisation/commit/a991386ee97142ec91f1a01a81acd135ccbe74ef))

## 1.0.0 (2024-11-25)

### Features

- updated name of package ([881e19f](https://github.com/sanity-io/sanity-plugin-personalisation/commit/881e19f001cbd4be6df12bc8b45f8a9d5f263311))

### Bug Fixes

- add field action to show hide extra experiment data ([f4cdf44](https://github.com/sanity-io/sanity-plugin-personalisation/commit/f4cdf44a83b56fb6c29f705e4b4ebe02c938f1d1))
- add field action to show hide extra experiment data ([810e913](https://github.com/sanity-io/sanity-plugin-personalisation/commit/810e913b325e45ff9f689f3b56ae74abc87dd9fc))
- on removal of experiment clear additional fields ([d2613a3](https://github.com/sanity-io/sanity-plugin-personalisation/commit/d2613a369e237861519fb857fff585c5f4b9e8db))
