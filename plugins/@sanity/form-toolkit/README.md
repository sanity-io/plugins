## Usage

# @sanity/form-toolkit

Plugin for integrating 3rd party form services or building your own forms with Sanity.

## Installation

```sh
npm install @sanity/form-toolkit
```

## HubSpot

The HubSpot integration fetches all forms in a HubSpot project and adds them as options in a selectable list.

### Usage

This plugin requires you to set up your own API route to fetch against HubSpot's API. You'll need to also create a Private App in HubSpot to create and pass a Private App access token to the provided fetch function. Learn how to create a Private App and get an access token [here](https://developers.hubspot.com/docs/guides/apps/private-apps/overview).

There's an "out of the box" handler for Next.js API routes:

```ts
// pages/api/hubspot.ts
import {hubSpotHandler} from '@sanity/form-toolkit/hubspot'

const handler = hubSpotHandler({
  token: process.env.HUBSPOT_TOKEN ?? '',
})

export default handler
```

Or add `fetchHubSpotData` to an API route in your non-Next framework

```ts
// my-nuxt-app/server/api/hubspot.ts
import {fetchHubSpotData} from '@sanity/form-toolkit/hubspot'

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const res = event.node.res
  const data = await fetchHubSpotData({
    token: process.env.HUBSPOT_TOKEN ?? '',
  })
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify(data))
})
```

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {hubSpotInput} from '@sanity/form-toolkit/hubspot'

export default defineConfig({
  //...
  plugins: [
    hubSpotInput({
      url: 'your-api-endpoint',
    }),
  ],
})
```

Finally, add the field type to the schema you'd like to use it in

```ts
// schemaTypes/post.ts
export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    //...rest of schma
    defineField({
      name: 'hubSpot',
      type: 'hubSpotForm',
    }),
  ],
})
```

## Mailchimp

The Mailchimp integration fetches all signup forms across all lists in your Mailchimp account and syncs the URL for the selected form.

### Usage

This plugin requires you to set up your own API route to fetch against Mailchimp's API. You'll need to pass an API key and server prefix to the underlying Mailchimp marketing client. Learn how to get a Mailchimp API key [here](https://mailchimp.com/help/about-api-keys/).

There's an "out of the box" handler for Next.js API routes:

```ts
// pages/api/mailchimp.ts
import {mailchimpHandler} from '@sanity/form-toolkit/mailchimp'

const handler = mailchimpHandler({
  key: process.env.MAILCHIMP_KEY ?? '',
  server: process.env.MAILCHIMP_SERVER_PREFIX ?? '',
})

export default handler
```

Or add `fetchMailchimpData` to an API route in your non-Next framework

```ts
// my-nuxt-app/server/api/mailchimp.ts
import {fetchMailchimpData} from '@sanity/form-toolkit/mailchimp'

export default defineEventHandler(async (event) => {
  const req = event.node.req
  const res = event.node.res
  const data = await fetchMailchimpData({
    key: process.env.MAILCHIMP_KEY ?? '',
    server: process.env.MAILCHIMP_SERVER_PREFIX ?? '',
  })
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify(data))
})
```

Add it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {mailchimpInput} from '@sanity/form-toolkit/mailchimp'

export default defineConfig({
  //...
  plugins: [
    mailchimpInput({
      url: 'your-api-endpoint',
    }),
  ],
})
```

Finally, add the field type to the schema you'd like to use it in

```ts
// schemaTypes/post.ts
export default defineType({
  name: 'post',
  title: 'Post',
  type: 'document',
  fields: [
    //...rest of schma
    defineField({
      name: 'mailchimp',
      type: 'mailchimpForm',
    }),
  ],
})
```

## formSchema and FormRenderer

The `formSchema` plugin and `FormRenderer` React component are designed to be used together to build and render forms in Sanity. `formSchema` provides a Sanity schema for creating `form` documents made up of various `formFields`, then `FormRenderer` takes those `form` documents and renders them as React components. The `formSchema` plugin can be used by itself with your own logic for rendering the form. The `/examples` directory of this repository shows `FormRenderer` being used with popular form libraries.

First add `formSchema` it as a plugin in `sanity.config.ts` (or .js):

```ts
import {defineConfig} from 'sanity'
import {formSchema} from '@sanity/form-toolkit/form-schema'

export default defineConfig({
  //...
  plugins: [
    formSchema({
      // Optionally, use your own schemas for additional formFields
      fields: [
        defineField({
          name: 'myField',
          type: 'myObjectType',
        }),
      ],
    }),
  ],
})
```

This will create a "form" document type.
Then, add a field to your schema with type `form`

```ts
// ./src/schemaTypes/page.ts
import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'page',
  type: 'document',
  fields: [
    defineField({
      name: 'form',
      type: 'reference',
      to: [{type: 'form'}],
    }),
  ],
})
```

Finally, pass a `form` document to the `FormRenderer` component

```tsx
import React, {type FC} from 'react'
import {FormRenderer, type FormDataProps} from '@sanity/form-toolkit/form-renderer'

interface NativeFormExampleProps {
  formData: FormDataProps
  action?: string
  method?: 'get' | 'post'
}
/**
 * Example of using the `FormRenderer` as a native HTML form element.
 */
export const NativeFormExample: FC<NativeFormExampleProps> = ({
  formData, // form document from Sanity
  action = '/api/submit',
  method = 'post',
}) => {
  return (
    <FormRenderer
      formData={formData}
      action={action}
      method={method}
      encType="multipart/form-data"
    />
  )
}
```

### FormRenderer

The `FormRenderer` component takes documents created with the `formSchema` plugin and renders a form for your front-end. The `formSchema` plugin can be used by itself with your own logic for rendering the form. The `/examples` directory of this repository shows `FormRenderer` being used with popular form libraries. `FormRenderer` takes the following props

#### All props for native `form` element

`FormRenderer` can take all the typical props passed to the `form` element in React like `action`, `onSubmit`, `className`, etc.

#### formData

A `form` document created with the `formSchema` plugin.

#### fieldComponents

An object where the keys are possible input field type names and the values are components for that field's input.

```tsx
const fieldComponents = {
  select: MyCustomSelectComponent
}
<FormRenderer
  fieldComponents={fieldComponents}
/>
```

#### getFieldState

Function for managing each field as a piece of state (see `react-hook-form.tsx` and `tanstack-form.tsx` in the `/examples` directory)

#### getFieldError

Similar to `getFieldState`, a function for managing each field's errors as a piece of state (see `react-hook-form.tsx` and `tanstack-form.tsx` in the `/examples` directory)

## License

[MIT](LICENSE) © Chris LaRocque

## Develop & test

This plugin uses [@sanity/plugin-kit](https://github.com/sanity-io/plugin-kit)
with default configuration for build & watch scripts.

See [Testing a plugin in Sanity Studio](https://github.com/sanity-io/plugin-kit#testing-a-plugin-in-sanity-studio)
on how to run this plugin with hotreload in the studio.

### Release new version

Run ["CI & Release" workflow](https://github.com/sanity-io/form-toolkit/actions/workflows/main.yml).
Make sure to select the main branch and check "Release new version".

Semantic release will only release on configured branches, so it is safe to run release on any branch.
