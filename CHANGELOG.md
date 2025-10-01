# matches-hotkeys

## 0.2.0

### Breaking Changes

- Removed automatic Shift inference for shift-derived keys. Previously, when using shift-derived characters like `"+"`, `"!"`, `"@"`, etc., the library would automatically set `shiftKey: true` for physical keys that require Shift to produce those characters (e.g., `Equal` key for `"+"`). This behavior has been removed. Now, all shift-derived keys will have `shiftKey: false` unless you explicitly include `shift` in your combination. This change makes the library's behavior more explicit and predictable, relying on the default OR-based comparison logic which already handles matching by key, code, keyCode, or which.

## 0.1.1

### Patch Changes

- 8907a35: Fix shift-derived keys to match real keyboard events by automatically inferring `shiftKey: true`
