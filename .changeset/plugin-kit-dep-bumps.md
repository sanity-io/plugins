---
"@sanity/plugin-kit": patch
---

Update CLI dependencies to their latest majors: `chalk` 5, `concurrently` 9, `execa` 9, `git-remote-origin-url` 4, `inquirer` 12, `meow` 14, `p-props` 6, `xdg-basedir` 5 and `nodemon` 3.1.14. The CLI behaves the same as before, and its installed footprint shrinks noticeably (the new majors drop many transitive dependencies). `concurrently` 10, `execa` 10 and `inquirer` 13+ are intentionally held back for now, as they require Node.js versions newer than plugin-kit's supported range.
