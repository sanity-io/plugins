---
"@sanity/plugin-kit": major
---

**Node.js 24 or newer is now required** to run the plugin-kit CLI (`engines.node` was `>=20.19 <22 || >=22.12`). This only affects the machine running plugin-kit itself — plugins scaffolded and verified by plugin-kit still declare (and are held to) the wider `>=20.19 <22 || >=22.12` range shared with `@sanity/pkg-utils`.

With the permissive engine range gone, the CLI dependencies previously held back are now on their latest majors: `concurrently` 10, `execa` 10 and `inquirer` 14. The CLI behaves the same as before, apart from `link-watch` output now being prefixed with an automatic color (concurrently 10's new default).

Also drops several dependencies in favor of Node.js 24 built-ins and small local helpers:

- `chalk` → `util.styleText`
- `get-it` → native `fetch`
- `git-remote-origin-url` → `execa` + `git config`
- `github-url-to-object` → local URL/scp parser
- `xdg-basedir` → `os.homedir()` / `XDG_CONFIG_HOME`
- `email-validator` → lightweight local check
- `p-props` → `Promise.all` + `Object.fromEntries`
- `outdent` → local tagged-template helper

Also fixes `init` reporting a failed dependency install as an unhandled CLI error instead of the intended "Failed to install dependencies, try manually running `npm install`" hint.
