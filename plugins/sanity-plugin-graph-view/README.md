<div align="center">
  <h1>Graph View Plugin</h1>
  <p>A tool for Sanity Studio to graph your content and see changes in real-time.</p>
  <p><img src="assets/screengrab.gif" width="540" alt="Screengrab of the Graph tool" /></p>
</div>

Wonder how a visualization of your dataset will look? How many authors do you have? How many items have they worked on? And are currently working on! Edits and changes are shown in real-time!

**Explore your data with this plugin, seek out strange corners and data types, boldly go where you could not before!**

## Installation

```
npm install --save sanity-plugin-graph-view
```

## Usage

Add it as a plugin in sanity.config.ts (or .js):

```js
import {contentGraphView} from 'sanity-plugin-graph-view'

export default defineConfig({
  // ...
  plugins: [contentGraphView({})],
})
```

This will add a /graph-your-content tools to the Sanity Studio, configured with this default query:

```
  *[
    !(_id in path("_.*")) &&
    !(_type match "system.*") &&
    !(_type match "sanity.*")
  ]
```

## Configuration

You can control which documents appear in the graph by providing a query:

```js
import {contentGraphView} from 'sanity-plugin-graph-view'

export default defineConfig({
  // ...
  plugins: [
    contentGraphView({
      query: "*[_type in ['a', 'b']]",
      apiVersion: '2022-09-01', // optional, default shown
    }),
  ],
})
```

For references to turn into graph edges, the entire document must be fetched,
but you can also selectively filter what references will be included. For example:

```js
contentGraphView({
  query: "*[_type in ['a', 'b']]{ 'refs': [author, publisher] }",
})
```

By default, the plugin uses `doc.title || doc.name || doc._id` as the node label.

If you want to use another property, compute a `title` property in your query, e.g.:

```js
contentGraphView({
  query:
    "*[_type in ['a', 'b']] { ..., \"title\": select(_type == 'a' => 'Title A', _type == 'b' => 'Title B') }",
})
```

## License

MIT-licensed. See LICENSE.
