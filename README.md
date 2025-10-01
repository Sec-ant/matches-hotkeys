# matches-hotkeys

Parse keyboard shortcuts and match them against `KeyboardEvent` objects.

## Overview

This library provides functions to:

- Parse hotkey combinations (e.g., `"ctrl+a"`, `"mod+shift+p"`) into normalized representations
- Match `KeyboardEvent` objects against parsed hotkey specifications
- Handle platform differences (`mod` resolves to `cmd` on macOS, `ctrl` elsewhere)
- Resolve ambiguous keys (e.g., `"0"` matches both top-row and numpad)

**What this library does not do:**

- Register global keyboard listeners
- Manage shortcut conflicts or priorities
- Provide UI components or visual feedback

These concerns are left to the application layer.

## Installation

```bash
npm install matches-hotkeys
```

TypeScript types are included. ES Module, CommonJS, and IIFE builds are provided.

## Quick Start

```ts
import { matchesHotkeys } from "matches-hotkeys";

// Define shortcuts
const SAVE_SHORTCUT = [{ combination: "mod+s" }]; // cmd+s on macOS, ctrl+s elsewhere

// Check if event matches
window.addEventListener("keydown", (event) => {
  if (matchesHotkeys(SAVE_SHORTCUT, event)) {
    event.preventDefault();
    saveDocument();
  }
});
```

## Usage

### ES Module / CommonJS

```ts
import { matchesHotkeys, parseCombination } from "matches-hotkeys";
```

### IIFE

For direct browser usage via `<script>` tag, IIFE builds are available. The global variable is `MatchesHotkeys`.

```html
<script src="https://cdn.jsdelivr.net/npm/matches-hotkeys@<version>/dist/iife/index.js"></script>
<script>
  const { matchesHotkeys } = MatchesHotkeys;
  // Use matchesHotkeys...
</script>
```

## API

### `matchesHotkeys(hotkeys, event, options?)`

Tests if a `KeyboardEvent` matches any of the provided hotkey specifications.

**Parameters:**

- `hotkeys`: Array of `{ combination, options? }` objects
- `event`: A `KeyboardEvent` instance
- `options`: Optional `{ comparator? }` configuration

**Returns:** `boolean` - `true` if any hotkey matches the event

**Example:**

```ts
const hotkeys = [{ combination: "ctrl+s" }, { combination: "cmd+s" }];
matchesHotkeys(hotkeys, event); // true if event is Ctrl+S or Cmd+S
```

### `parseCombination(combination, options?)`

Parses a hotkey combination string or array into normalized representations.

**Parameters:**

- `combination`: String (`"ctrl+a"`) or array (`["ctrl", "a"]`)
- `options`: Optional configuration
  - `splitBy`: Separator character (default: `"+"`).

    Change this when you need to use `"+"` as the actual key in your shortcut (e.g., `"ctrl-+"` with `splitBy: "-"`)

  - `trim`: Whether to trim whitespace from each token after splitting (default: `true` when `combination` is a string, `false` when it's an array).

    When `true`, whitespace around tokens is removed, making empty spaces in string combinations become empty tokens (which are invalid). Set to `false` for string combinations to preserve the space character as a valid key (e.g., `"ctrl+ "` with `trim: false` matches the space key)

  - `allowCodeAsModifier`: Allow physical key codes like `"ControlLeft"` or `"ShiftRight"` as modifiers (default: `true`).

    When `true`, allows both `"ctrl+a"` and `"ControlLeft+a"` (both produce the same result with `ctrlKey: true`, since browsers cannot distinguish left/right modifiers at runtime). When `false`, only logical modifier names like `"ctrl"` are accepted in modifier positions, rejecting `"ControlLeft+a"` as invalid (but `"ControlLeft"` alone as a main key is still valid)

**Returns:** `ParsedCombination[]` - Array of parsed variants (empty if invalid)

**Examples:**

```ts
// Basic usage
parseCombination("ctrl+a");
// [{ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true, metaKey: false, shiftKey: false, altKey: false }]

// Ambiguous keys return multiple variants
parseCombination("0");
// [
//   { code: "Digit0", key: "0", keyCode: 48, which: 48, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false },
//   { code: "Numpad0", key: "0", keyCode: 96, which: 96, ctrlKey: false, metaKey: false, shiftKey: false, altKey: false }
// ]

// Key aliases work for shifted keys (e.g., "plus" → "+")
parseCombination("ctrl+plus"); // "plus" is an alias for "+"
// [
//   { code: "NumpadAdd", key: "+", keyCode: 107, which: 107, ctrlKey: true, shiftKey: false, ... },    // Numpad
//   { code: "Equal", key: "+", keyCode: 187, which: 187, ctrlKey: true, shiftKey: false, ... }          // Top-row
// ]

// Option: splitBy - Use different separator for literal "+" key
parseCombination("ctrl-+", { splitBy: "-" }); // Direct "+" character as key
// [
//   { code: "NumpadAdd", key: "+", keyCode: 107, which: 107, ctrlKey: true, shiftKey: false, ... },
//   { code: "Equal", key: "+", keyCode: 187, which: 187, ctrlKey: true, shiftKey: false, ... }
// ]

// Option: trim - Preserve whitespace to match space key
parseCombination("ctrl+ "); // Default trim removes space, " " becomes ""
// [] (empty - invalid because last token is empty)

parseCombination("ctrl+ ", { trim: false }); // Space key preserved
// [{ code: "Space", key: " ", keyCode: 32, which: 32, ctrlKey: true, shiftKey: false, ... }]

// Option: allowCodeAsModifier - Enforce logical modifiers only
parseCombination("ControlLeft+a"); // Physical code as modifier (allowed by default)
// [{ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true, shiftKey: false, ... }]

parseCombination("ControlLeft+a", { allowCodeAsModifier: false }); // Reject physical codes
// [] (empty - invalid because "ControlLeft" is not a logical modifier)

parseCombination("ctrl+a", { allowCodeAsModifier: false }); // Logical modifier OK
// [{ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true, shiftKey: false, ... }]
```

### `resolveKey(token)`

Resolves a single key token into standardized key information. Used internally by `parseCombination`.

**Parameters:**

- `token`: A single key string (case-insensitive)

**Returns:** `ResolvedKey[]` - Array of possible key resolutions

**Resolution behavior:**

- **Single-source keys** (e.g., `"a"`, `"Escape"`) return one result
- **Ambiguous keys** (e.g., `"0"`, `"+"`) return multiple results for different physical keys
- **Generic modifiers** (e.g., `"ctrl"`, `"shift"`) return both left and right variants
- **Specific modifiers** (e.g., `"ControlLeft"`) return only that variant
- **Unknown keys** return a fallback object with `keyCode: -1` and `which: -1`

**Examples:**

```ts
resolveKey("a"); // [{ key: "a", code: "KeyA", keyCode: 65, which: 65 }]

resolveKey("0"); // Ambiguous - returns both top-row and numpad
// [
//   { key: "0", code: "Digit0", keyCode: 48, which: 48 },
//   { key: "0", code: "Numpad0", keyCode: 96, which: 96 }
// ]

resolveKey("ctrl"); // Generic modifier - returns both variants
// [
//   { key: "Control", code: "ControlLeft", keyCode: 17, which: 17 },
//   { key: "Control", code: "ControlRight", keyCode: 17, which: 17 }
// ]

resolveKey("ControlLeft"); // Specific modifier - returns only left variant
// [{ key: "Control", code: "ControlLeft", keyCode: 17, which: 17 }]

resolveKey("unknown"); // Unknown key - returns fallback
// [{ key: "unknown", code: "unknown", keyCode: -1, which: -1 }]
```

## Usage Examples

### Simple Shortcuts

```ts
import { matchesHotkeys } from "matches-hotkeys";

window.addEventListener("keydown", (event) => {
  // Save
  if (matchesHotkeys([{ combination: "mod+s" }], event)) {
    event.preventDefault();
    save();
  }

  // Copy
  if (matchesHotkeys([{ combination: "mod+c" }], event)) {
    copy();
  }

  // Open command palette
  if (matchesHotkeys([{ combination: "mod+shift+p" }], event)) {
    event.preventDefault();
    openCommandPalette();
  }
});
```

### Registering Multiple Shortcuts

```ts
const shortcuts = [
  { combination: "mod+s", action: save },
  { combination: "mod+shift+s", action: saveAs },
  { combination: "mod+o", action: open },
  { combination: "mod+w", action: close },
];

window.addEventListener("keydown", (event) => {
  for (const { combination, action } of shortcuts) {
    if (matchesHotkeys([{ combination }], event)) {
      event.preventDefault();
      action();
      break;
    }
  }
});
```

### Arrow Key Navigation

```ts
const NAVIGATION = [
  { combination: "arrowup" },
  { combination: "arrowdown" },
  { combination: "arrowleft" },
  { combination: "arrowright" },
];

window.addEventListener("keydown", (event) => {
  if (matchesHotkeys(NAVIGATION, event)) {
    event.preventDefault();
    navigate(event.key);
  }
});
```

## Advanced Usage

### Custom Comparators

By default, a hotkey matches if any of `key`, `code`, `keyCode`, or `which` match AND all modifier flags are identical. You can customize this by composing your own comparators or using the exported ones.

#### Comparator Primitives

```ts
import { eq, and, or } from "matches-hotkeys";

// eq(...fields) - Creates a comparator that checks equality for specific fields
const checkKey = eq("key");
const checkModifiers = eq("altKey", "ctrlKey", "metaKey", "shiftKey");

// and(...comparators) - All comparators must match
const strictMatch = and(checkKey, checkModifiers);

// or(...comparators) - Any comparator can match
const flexibleMatch = or(eq("key"), eq("code"));
```

#### Pre-built Comparators

The library exports several pre-built comparators you can use directly or combine:

```ts
import {
  DEFAULT_COMPARATOR, // Matches by (key OR code OR keyCode OR which) + all modifiers
  MODIFIERS_COMPARATOR, // Only checks modifier flags match
  COMPARE_BY_KEY, // Matches by key + all modifiers
  COMPARE_BY_CODE, // Matches by code + all modifiers
  COMPARE_BY_KEY_CODE, // Matches by keyCode + all modifiers
  COMPARE_BY_WHICH, // Matches by which + all modifiers
} from "matches-hotkeys";
```

#### Example: Ignore Shift modifier

Compose a custom comparator from primitives:

```ts
import { matchesHotkeys, eq, and, or } from "matches-hotkeys";

const IGNORE_SHIFT = or(
  and(eq("key", "altKey", "ctrlKey", "metaKey")),
  and(eq("code", "altKey", "ctrlKey", "metaKey")),
);

// Matches both "a" and "Shift+a"
if (
  matchesHotkeys([{ combination: "a" }], event, { comparator: IGNORE_SHIFT })
) {
  handleKey();
}
```

#### Example: Use pre-built comparators

```ts
import { matchesHotkeys, COMPARE_BY_CODE } from "matches-hotkeys";

// Only match by physical key position, ignore key value
if (
  matchesHotkeys([{ combination: "a" }], event, { comparator: COMPARE_BY_CODE })
) {
  handleAction();
}
```

#### Example: Combine pre-built comparators

```ts
import {
  matchesHotkeys,
  or,
  COMPARE_BY_KEY,
  COMPARE_BY_CODE,
} from "matches-hotkeys";

// Match by either key or code (but not keyCode/which)
const KEY_OR_CODE = or(COMPARE_BY_KEY, COMPARE_BY_CODE);

if (
  matchesHotkeys([{ combination: "a" }], event, { comparator: KEY_OR_CODE })
) {
  handleAction();
}
```

#### Example: Fully custom comparator

You can also write completely custom logic:

```ts
import type { Comparator } from "matches-hotkeys";

// Custom: Ignore Shift modifier but check the key and other modifiers
const IGNORE_SHIFT: Comparator = (parsed, event) => {
  return (
    parsed.key === event.key &&
    parsed.ctrlKey === event.ctrlKey &&
    parsed.metaKey === event.metaKey &&
    parsed.altKey === event.altKey
    // Note: shiftKey is intentionally not checked
  );
};

// Now "a" matches both plain "a" and "Shift+a"
if (
  matchesHotkeys([{ combination: "a" }], event, { comparator: IGNORE_SHIFT })
) {
  handleKey();
}
```

## Key Concepts

### Keyboard Data Model

The parser relies on the W3C keyboard model exposed by `KeyboardEvent` and encoded in `src/consts.ts`:

- **`key`** – The logical character or action produced by the key (e.g., `"a"`, `"Enter"`, `"+"`). We store this in `KEY_DEFINITIONS[code].key` and match it against `event.key`.
- **`code`** – The physical key location (e.g., `"KeyA"`, `"ShiftLeft"`, `"NumpadAdd"`). This stays the same regardless of keyboard layout and is matched against `event.code`.
- **`keyCode` / `which`** – Legacy numeric codes kept for compatibility. We surface the numeric value from `KEY_DEFINITIONS` and mirror it onto `which`, just like the browser does.

Every `ParsedCombination` exposes all three so callers can pick the level of precision they need.

### Alias Layers

To keep authoring ergonomic we pre-compute several alias maps when resolving tokens:

- **Key aliases (`KEY_ALIASES`)** let you write friendly names for logical keys. Examples: `"esc" → "Escape"`, `"plus" → "+"`, `"space" → " "`.
- **Code aliases (`CODE_ALIAS_MAP`)** cover physical key nicknames such as `"lshift" → "ShiftLeft"` or `"prtsc" → "PrintScreen"`.
- **Shift-derived symbols (`SHIFT_KEY_MAPPINGS`)** synthesize characters that only appear when Shift is held. For instance, `"Equal" + Shift → "+"`, so resolving `"plus"` yields both `{ code: "NumpadAdd", key: "+" }` and `{ code: "Equal", key: "+" }`.

Aliases are applied in this order inside `resolveKey`: exact code → code alias → key value → key alias → fallback. This ensures that precise tokens stay precise while still supporting more human-readable inputs.

### Combination Syntax and Modifiers

Combinations can be declared as strings (`"ctrl+shift+p"`) or arrays (`["ctrl", "shift", "p"]`). The parser normalizes them as follows:

```ts
const stringForm = "ctrl+shift+p";
const arrayForm: string[] = ["ctrl", "shift", "p"]; // Equivalent representation
```

- Tokens are split by `splitBy` (default `"+"`) and lower-cased via `preMap`.
- Every segment before the last must resolve to a modifier. Supported modifier tokens are:
  - **Control:** `ctrl`, `control`
  - **Meta:** `meta`, `cmd`, `command`, `win`, `windows`
  - **Shift:** `shift`
  - **Alt:** `alt`, `option`
- The special `mod` token resolves to `cmd` on macOS and `ctrl` elsewhere (see `preMap`).
- The final token resolves to the main key and may expand to multiple physical variants.

**Modifier side note.** Browser events only expose boolean modifier flags (`metaKey`, `ctrlKey`, `shiftKey`, `altKey`). When a shortcut includes a modifier plus another key (e.g., `ctrl+a`), the resulting `KeyboardEvent` cannot distinguish between left and right modifier keys. Consequently, combinations like `"ControlLeft+a"` and `"ControlRight+a"` are both parsed to produce the same result: `{ ctrlKey: true, ... }`. The physical `code` distinction is lost because browsers don't provide separate flags for `ctrlLeftKey` vs `ctrlRightKey`.

Invalid sequences (missing main key, duplicate modifiers, empty segments) produce an empty array of parsed combinations.

### Resolution Flow

`parseCombination` processes each token through `resolveKey` to obtain one or more `ResolvedKey` objects, then combines modifiers with main keys:

1. **Normalize tokens:** Split by `splitBy`, trim (if enabled), and convert to lowercase.
2. **Separate modifiers from main key:** All tokens except the last must be modifiers.
3. **Resolve modifiers:** Convert modifier tokens to boolean flags (`metaKey`, `ctrlKey`, etc.), respecting `allowCodeAsModifier`.
4. **Resolve the main key:** Look up the last token through the alias layers described above. This may return multiple physical key variants (e.g., both `Digit0` and `Numpad0` for `"0"`).
5. **Generate combinations:** Create one `ParsedCombination` for each main key variant, each including key/code/keyCode metadata plus all modifier flags.

`matchesHotkeys` then compares these parsed combinations against the actual `KeyboardEvent` using the selected comparator.

### Shift-Derived Keys

Some keys produce different characters when Shift is held (e.g., pressing `Equal` produces `"="`, but `Shift+Equal` produces `"+"`). The library handles these through the `SHIFT_KEY_MAPPINGS` constant, which maps base keys to their shifted characters.

When you reference a shifted character (e.g., `"+"`, `"!"`, `"@"`), the library will resolve it to the appropriate physical key. For example, `"+"` resolves to both `NumpadAdd` (which produces `"+"` without Shift) and `Equal` (which produces `"+"` with Shift).

#### Shift-Derived Keys Mapping

The following keys have shifted character mappings:

- `+` (from `Equal`), `!` (from `Digit1`), `@` (from `Digit2`), `#` (from `Digit3`)
- `$` (from `Digit4`), `%` (from `Digit5`), `^` (from `Digit6`), `&` (from `Digit7`)
- `*` (from `Digit8`), `(` (from `Digit9`), `)` (from `Digit0`)
- `_` (from `Minus`), `~` (from `Backquote`)
- `{` (from `BracketLeft`), `}` (from `BracketRight`), `|` (from `Backslash`)
- `:` (from `Semicolon`), `"` (from `Quote`)
- `<` (from `Comma`), `>` (from `Period`), `?` (from `Slash`)

#### Explicit Shift Control

To match a shifted character, you need to explicitly include `shift` in your combination:

```ts
// To match the "+" character from the Equal key, you need explicit shift
parseCombination("shift+=");
// [{ code: "Equal", key: "=", shiftKey: true }]

// Or use "shift+plus" which resolves to both variants with explicit shift
parseCombination("shift+plus");
// [
//   { code: "NumpadAdd", key: "+", shiftKey: true },  // Matches Shift+NumpadAdd
//   { code: "Equal", key: "+", shiftKey: true }       // Matches Shift+Equal (produces "+")
// ]

// Without explicit shift, both variants have shiftKey: false
parseCombination("plus");
// [
//   { code: "NumpadAdd", key: "+", shiftKey: false },
//   { code: "Equal", key: "+", shiftKey: false }
// ]

// Base Equal key without shift (produces "=")
parseCombination("ctrl+=");
// [{ code: "Equal", key: "=", ctrlKey: true, shiftKey: false }]

// Only numpad plus (no shift)
parseCombination("ctrl+numpadadd");
// [{ code: "NumpadAdd", key: "+", ctrlKey: true, shiftKey: false }]
```

### Ambiguous Keys

Some key inputs map to multiple physical keys. The parser returns all possibilities:

```ts
parseCombination("0");
// Returns both:
// 1. { code: "Digit0", ... }    // Top row
// 2. { code: "Numpad0", ... }   // Numpad

parseCombination("ctrl");
// Returns both:
// 1. { code: "ControlLeft", ctrlKey: true, ... }
// 2. { code: "ControlRight", ctrlKey: true, ... }
```

`matchesHotkeys` tests all variants and returns `true` if any matches.

### Unknown or Fallback Tokens

Unknown key names create fallback objects with `-1` for numeric fields:

```ts
resolveKey("unknownkey");
// [{ key: "unknownkey", code: "unknownkey", keyCode: -1, which: -1 }]

parseCombination("ctrl+unknownkey");
// [{ key: "unknownkey", code: "unknownkey", keyCode: -1, which: -1, ctrlKey: true, ... }]
```

This preserves type consistency and allows detection of unknown keys. Using `-1` (instead of `undefined`) keeps the shape consistent and makes the data JSON-serializable.

### Parsed Combination Payload

```ts
interface ParsedCombination {
  code: string; // Physical key code (e.g., "KeyA")
  key: string; // Logical key value (e.g., "a")
  keyCode: number; // Legacy numeric code (or -1)
  which: number; // Alias of keyCode
  metaKey: boolean; // Cmd/Win modifier
  ctrlKey: boolean; // Control modifier
  shiftKey: boolean; // Shift modifier
  altKey: boolean; // Alt/Option modifier
}
```

All fields are present to match `KeyboardEvent` shape and support serialization.

## Limitations

- **No key sequences:** This library matches single key combinations. For sequences like `g g` (Vim-style), implement your own state machine.
- **No automatic conflict resolution:** The library doesn't manage shortcut priorities or conflicts. This is application-layer logic.

## Standards Reference

This library follows W3C specifications:

- [UI Events KeyboardEvent code values](https://www.w3.org/TR/uievents-code/)
- [UI Events KeyboardEvent key values](https://www.w3.org/TR/uievents-key/)

## License

MIT
