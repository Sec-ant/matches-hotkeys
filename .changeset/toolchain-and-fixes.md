---
"matches-hotkeys": patch
---

Modernize toolchain and fix source code quality issues

- Migrate to Biome + Prettier dual formatting, single tsconfig, and updated CI workflows
- Replace O(n) key lookups with O(1) Map-based lookups (`KEY_VALUE_MAP`, `KEY_ALIAS_MAP`)
- Add case-insensitive key comparator to fix Shift+letter key matching
- Cache `isMac()` result with `resetPlatformCache()` for correctness and testability
- Remove `es-toolkit` dependency in favor of direct comparator calls
- Bundle type declarations with `rollupTypes` for cleaner `dist/es/` and `dist/cjs/` output
