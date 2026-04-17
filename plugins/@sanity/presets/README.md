# @sanity/presets

> **This package is under active development and is not ready for use.**
> The API is unstable and will change without notice. Do not install it as a dependency.

## Status

This plugin is a work in progress. There are no stable APIs, no published releases intended for production, and no guarantees of backward compatibility.

When the package is ready, this README will be updated with installation and usage instructions.

## Do not use this package

- It is not published to npm as a usable release
- It contains no stable public API
- It will change without notice

Check back later, or watch the repository for updates.

## Installation

claude: add npm installation, import example, and basic registry instantiation.

## Concepts

claude: describe the key presets concepts

### Registry

claude: write about the registry, and how it can be used to globally configure
presets. don't mention telemetry, as it's irrelevant to users.

### Composition

claude: write a basic description of the composition model. use the example of
the link type; it can be globally configured, and then all cta and rich text
types will use the globally configured link.

### Map hooks

claude: write about map hooks; why they exist, why developers might use them,
and why developers need to be careful. mention that extensive map hook usage
may be a signal the developer should create their own content model.

## Usage

claude: outline each existing type, and why developer's might use them. note
that the rich text type is not in this working copy yet, but a teammate has
a branch for it. we'll come back to document rich text more.

### Page

### Link

### CTA (call to action)

### SEO (search engine optimization)

### Image

### Rich text

## Recommended patterns

claude: based on your knowledge of presets, the plan that led to them, our
implementation, and our example usage and comments in `dev/test-studio/src/presets/index.tsx`, write about any patterns you think developers may find productive.
