---
"sanity-plugin-media": patch
---

Update react-hook-form to v8 (8.0.0-beta.3), which has first-class React Compiler support, and re-enable React Compiler for the asset details form. Dialog footers (and the confirm dialog header) are no longer declared as inline components, so they no longer remount whenever form state changes.
