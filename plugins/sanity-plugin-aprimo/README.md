# Aprimo asset selector for Sanity

![aprimo gif](https://user-images.githubusercontent.com/3969996/136493868-9908e13d-e97e-4275-87e6-7a3ca3019d5b.gif)

This plugin allows you to open the Aprimo DAM asset selector from your studio and save those chosen assets and renditions in your Sanity documents. Because CORS isn't possible with Aprimo, we have removed the ability to use assets that are not public renditions. We may restore this functionality in the future, once CORS requests are allowed or we have sufficient guidance on using a proxy server.

## Installation

1. In your studio directory, run `npm install sanity-plugin-aprimo`.
2. Declare a field to be `aprimo.cdnasset` in your schema. For example:

```javascript
    {
      type: "aprimo.cdnasset",
      name: "image",
      description: "This asset is served from Aprimo",
    }
```

3. Navigate to that directory in your studio. There will be a plugin icon to the top left of that field, that will allow you to add the credentials for your Aprimo tenant. Enter in these details (they will be safely stored in your Sanity dataset as a private document. Remember to include these credentials across all your datasets!) If any of these fields are confusing, contact your Aprimo administrator.

<img width="324" alt="aprimo credentials" src="https://user-images.githubusercontent.com/3969996/136494120-0951c831-96da-4317-8b5f-d8d1f689c775.png">

## Usage

After the above, you should be able to use the selector on any field declared as `aprimo.asset` or `aprimo.cdnasset`. By including the `aprimo.asset` type in an array, you can use the multiple selector in Sanity as well.

<img width="724" alt="aprimo array" src="https://user-images.githubusercontent.com/3969996/136494363-a14973ea-9132-40f8-b365-679e203beb50.png">
