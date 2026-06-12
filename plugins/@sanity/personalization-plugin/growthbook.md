# @sanity/personalization-plugin - GrowthBook

## Previously know as @sanity/personalisation-plugin

> This is a **Sanity Studio v3** plugin.

This plugin allows users to add a/b/n testing experiments to individual fields connecting to the [Growthbook](https://www.growthbook.io/) A/B testing service.

- [@sanity/personalization-plugin - GrowthBook](#sanitypersonalization-plugin---GrowthBook)
  - [Installation](#installation)
  - [Usage](#usage)
  - [Loading Experiments](#loading-experiments)

This plugin is built on top of the `fieldLevelExperiments` export so see the main readme for details of:

- [Using complex field configurations](/#using-complex-field-configurations)
- [Validation of individual array items](/#validation-of-individual-array-items)
- [Shape of stored data](/#shape-of-stored-data)
- [Querying data](/#querying-data)
- [License](#license)
- [Develop \& test](#develop--test)
  - [Release new version](#release-new-version)
- [License](#license-1)

## Installation

```sh
npm install @sanity/personalization-plugin
```

## Usage

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {fieldLevelExperiments} from "@sanity/personalization-plugin/growthbook"

export default defineConfig({
  //...
  plugins: [
    //...
    fieldLevelExperiments({
      fields: ['string'],
      environment: 'production', // the growthbook environment
      projectId: 'string', // optional filter parameter for fetching features/experiments
      convertBooleans: true, // convert boolean experiments to store values of "control"/"variant" default to false
      tags: ['string'], // optional filter, if included feature must have at least one of the tag specified
    }),
  ],
})
```

This will register two new fields to the schema., based on the setting passed into `fields:`

- `experimentString` an Object field with `string` field called `default`, a `string` field called `experimentId` and an array field of type:
- `varirantsString` an object field with a `string` field called `value`, a string field called `variantId`, a `string` field called `experimentId`.

Use the experiment field in your schema like this:

```ts
//for Example in post.ts

fields: [
  defineField({
    name: 'title',
    type: 'experimentString',
  }),
]
```

## Loading Experiments

This plugin uses [@sanity/studio-secrets](https://www.npmjs.com/package/@sanity/studio-secrets) for storing your GrowthBook API key. The first time you open a document that has an experiment you will be asked to provide your API key. This is stored in a private document on the dataset.

Once you have entered you API key the plugin will fetch non archived features and variants of experiments for those features. If features/experiments are updated on Growthbook you will need to refresh the page.

The values stored for an experiment will be the Feature Key amd the variants will stored the variation value. The exception to this is boolean values when the `convertBooleans` config flag is set to true. In that case `false` will be set as `control` and true will be set as `variant`
