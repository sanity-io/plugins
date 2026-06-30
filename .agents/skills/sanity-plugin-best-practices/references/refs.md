# Component refs in plugins

How to accept and forward a `ref` in plugin components now that the monorepo is on React 19.

## The one-line rule

Do **not** use `React.forwardRef`. In React 19 `ref` is an ordinary prop — declare it in your
component's props and use it directly. This is enforced by `oxlint`: importing `forwardRef` from
`react` is an error (see `.oxlintrc.json`).

---

## Anti-pattern: `forwardRef`

`forwardRef` exists only to thread a `ref` past the old rule that function components could not
receive one. React 19 removed that rule: a function component can read `ref` from its props like any
other value, and React still attaches it to the DOM node or component the prop is passed to.
`forwardRef` is now redundant indirection (an extra wrapper, an extra generic, an extra positional
argument) and it is [slated for removal in a future React release](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop).

**Why ban it here:**

- **Unnecessary.** Every `forwardRef` call is dead ceremony — the same code is shorter and clearer
  with `ref` as a prop.
- **Future-proof.** Code written against `ref`-as-a-prop keeps working when `forwardRef` is removed;
  code that depends on `forwardRef` does not.
- **Consistency.** All plugins in this repo use the prop form, so new and migrated code should too.

**Incorrect (`forwardRef`, second positional `ref` argument):**

```tsx
import {forwardRef, type Ref} from 'react'

const FormFieldInputText = forwardRef<HTMLInputElement, Props>((props, ref) => {
  const {label, name, value} = props
  return <TextInput id={name} defaultValue={value} ref={ref} />
})
```

**Correct (`ref` is a regular prop):**

```tsx
import {type Ref} from 'react'

type Props = {
  label: string
  name: string
  value?: string
  ref?: Ref<HTMLInputElement>
}

const FormFieldInputText = (props: Props) => {
  const {label, name, value, ref} = props
  return <TextInput id={name} defaultValue={value} ref={ref} />
}
```

---

## Typing the `ref` prop

Add an optional `ref` to the props type using React's `Ref<T>`, where `T` is the element or
component instance the ref points at:

```tsx
import {type Ref} from 'react'

// DOM element
ref?: Ref<HTMLDivElement>

// @sanity/ui primitive forwards to its root element
ref?: Ref<HTMLButtonElement>

// a typed component handle (e.g. CodeMirror)
ref?: Ref<ReactCodeMirrorRef>
```

When the component already takes a props object you don't own (an `@sanity/ui` primitive, an
intrinsic element via `ComponentProps<'div'>`, a library's `RefAttributes`), intersect it in rather
than editing that type:

```tsx
function UploadCard(props: UploadCardProps & {ref?: Ref<HTMLDivElement>}) {
  const {children, ref} = props
  return <Card ref={ref}>{children}</Card>
}
```

Destructure `ref` out of the props before spreading the rest so you don't pass it twice:

```tsx
function FileInputMenuItem(props: Props & {ref?: Ref<HTMLInputElement>}) {
  const {text, ref, ...rest} = props
  return (
    <FileButton {...rest} ref={ref}>
      {text}
    </FileButton>
  )
}
```

---

## Forwarding a ref through a wrapper

React 19 passes `ref` as a prop into the components you render, so a wrapper component that spreads
its props forwards a caller's `ref` to the inner element automatically — no explicit `ref={ref}`:

```tsx
function FancyButton(props: ComponentProps<typeof Button>) {
  // `ref` arrives in props and flows to Button via the spread
  return <Button {...props} tone="primary" />
}
```

`lazy()` and `memo()` components forward a `ref` prop the same way, so none of these need
`forwardRef`. Define wrapper components at module scope, not inside a parent's render (e.g. via
`useMemo` and the polymorphic `as` prop) — that breaks the `react/no-unstable-nested-components` and
React Compiler rules, and the Studio is moving away from it.

---

## See also

- `.oxlintrc.json` → the `no-restricted-imports` entry that bans `forwardRef`.
- `vercel-react-best-practices` → general React 19 patterns.
- [React 19 — ref as a prop](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop).
