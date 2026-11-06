---
'sanity-plugin-media': patch
---

Keep the Media browser working when the Studio shows it again after hiding it as a recently used tool (`beta.reactActivityMode`): its store, epics and listeners now stay alive while hidden, so the tool no longer sits on "LOADING…", does not reload its assets and tags on every return, and an open dialog stays where it is instead of remounting.
