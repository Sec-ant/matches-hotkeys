---
"matches-hotkeys": patch
---

Add optional `inferShift` parameter to `parseCombination` to control automatic shift inference for shift-derived keys. Defaults to `false` (no automatic inference). When set to `true`, keys that can only be produced with Shift (e.g., "+" from Equal key, "!" from Digit1) automatically get `shiftKey: true` for physical keys that require it.
