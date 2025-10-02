# matches-hotkeys

## 0.1.2

### Patch Changes

- 5ec5435: Add optional `inferShift` parameter to `parseCombination` to control automatic shift inference for shift-derived keys. Defaults to `false` (no automatic inference). When set to `true`, keys that can only be produced with Shift (e.g., "+" from Equal key, "!" from Digit1) automatically get `shiftKey: true` for physical keys that require it.

## 0.1.1

### Patch Changes

- 8907a35: Fix shift-derived keys to match real keyboard events by automatically inferring `shiftKey: true`
