# matches-hotkeys

## 0.1.4

### Patch Changes

- 1dc6df4: Modernize toolchain and fix source code quality issues
  - Migrate to Biome + Prettier dual formatting, single tsconfig, and updated CI workflows
  - Replace O(n) key lookups with O(1) Map-based lookups (`KEY_VALUE_MAP`, `KEY_ALIAS_MAP`)
  - Add case-insensitive key comparator to fix Shift+letter key matching
  - Cache `isMac()` result with `resetPlatformCache()` for correctness and testability
  - Remove `es-toolkit` dependency in favor of direct comparator calls
  - Bundle type declarations with `rollupTypes` for cleaner `dist/es/` and `dist/cjs/` output

## 0.1.3

### Patch Changes

- 9245b10: Improve type safety for `Combination` and `ParseCombinationOptions` with better autocomplete support

## 0.1.2

### Patch Changes

- 5ec5435: Add optional `inferShift` parameter to `parseCombination` to control automatic shift inference for shift-derived keys. Defaults to `false` (no automatic inference). When set to `true`, keys that can only be produced with Shift (e.g., "+" from Equal key, "!" from Digit1) automatically get `shiftKey: true` for physical keys that require it.

## 0.1.1

### Patch Changes

- 8907a35: Fix shift-derived keys to match real keyboard events by automatically inferring `shiftKey: true`
