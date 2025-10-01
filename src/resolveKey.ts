import {
  CODE_ALIAS_MAP,
  KEY_ALIASES,
  KEY_DEFINITIONS,
  LOWERCASE_CODE_MAP,
  SHIFT_KEY_MAPPINGS,
} from "./consts";
import type { ParsedCombination } from "./parseCombination";
import { preMap } from "./preMap";

/**
 * Represents a single resolved key information containing standardized key properties
 */
export interface ResolvedKey
  extends Pick<ParsedCombination, "key" | "code" | "keyCode" | "which"> {}

/**
 * Resolves user input key names and returns standardized key information.
 *
 * This function provides a comprehensive key resolution system that supports:
 * - W3C standard code names (e.g., "KeyA", "ShiftLeft")
 * - W3C standard key values (e.g., "a", "Shift")
 * - Various aliases for better usability (e.g., "ctrl" for "Control", "esc" for "Escape")
 * - Case-insensitive matching
 * - Ambiguous keys that can have multiple physical sources (e.g., "+" from Equal or NumpadAdd)
 *
 * The resolution follows this priority order:
 * 1. Direct code matching (most precise)
 * 2. Code alias matching
 * 3. Key value matching (may return multiple results for ambiguous keys, including modifiers)
 * 4. Key alias matching (may also return multiple results)
 * 5. Fallback to original input as key value
 *
 * @param input - The key name to resolve (case-insensitive)
 * @returns Array of resolved key information - single item for unambiguous keys, multiple items for ambiguous keys
 *
 * @example
 * ```typescript
 * // Direct code matching (unambiguous)
 * resolveKey("KeyA") // [{ key: "a", code: "KeyA", keyCode: 65, which: 65 }]
 *
 * // Key value matching (unambiguous)
 * resolveKey("a") // [{ key: "a", code: "KeyA", keyCode: 65, which: 65 }]
 *
 * // Ambiguous key value (multiple sources). Order reflects resolution strategy:
 * //   1. Direct key value matches in KEY_DEFINITIONS (e.g. NumpadAdd)
 * //   2. Synthetic shifted variants from SHIFT_KEY_MAPPINGS (e.g. Equal -> '+')
 * resolveKey("+") // [
 * //   { key: "+", code: "NumpadAdd", keyCode: 107, which: 107 },   // Numpad Plus
 * //   { key: "+", code: "Equal", keyCode: 187, which: 187 },       // Shift+Equal
 * // ]
 *
 * // Generic modifier matching (multiple variants)
 * resolveKey("ctrl") // [
 * //   { key: "Control", code: "ControlLeft", keyCode: 17, which: 17 },
 * //   { key: "Control", code: "ControlRight", keyCode: 17, which: 17 }
 * // ]
 *
 * // Alias matching
 * resolveKey("esc") // [{ key: "Escape", code: "Escape", keyCode: 27, which: 27 }]
 *
 * // Case insensitive
 * resolveKey("SHIFT") // [
 * //   { key: "Shift", code: "ShiftLeft", keyCode: 16, which: 16 },
 * //   { key: "Shift", code: "ShiftRight", keyCode: 16, which: 16 }
 * // ]
 *
 * // Unknown key fallback (keeps original token; numeric fields are -1 so callers can test for unknown keys)
 * resolveKey("unknown") // [
 * //   { key: "unknown", code: "unknown", keyCode: -1, which: -1 }
 * // ]
 *
 * NOTE: Using -1 (instead of undefined) for numeric fields preserves a consistent shape while
 * allowing explicit detection of unresolved numeric codes (and is JSON serializable).
 * ```
 */
export function resolveKey(input: string): ResolvedKey[] {
  if (!input) {
    return [];
  }

  const normalizedInput = preMap(input.toLowerCase());

  // 1. Direct code matching (most precise)
  const codeEntry = findByCode(normalizedInput);
  if (codeEntry) {
    return [codeEntry];
  }

  // 2. Code alias matching
  const codeFromAlias = findByCodeAlias(normalizedInput);
  if (codeFromAlias) {
    return [codeFromAlias];
  }

  // 3. Key value matching (may return multiple results for ambiguous keys, including modifiers)
  const keyEntries = findByKey(normalizedInput);
  if (keyEntries.length > 0) {
    return keyEntries;
  }

  // 4. Key alias matching (derive on the fly; may return multiple results)
  const aliasEntries = findByKeyAlias(normalizedInput);
  if (aliasEntries.length > 0) {
    return aliasEntries;
  }

  // 5. Fallback: return original input as key
  return [
    {
      key: input,
      code: input,
      keyCode: -1,
      which: -1,
    },
  ];
}

// === Helper functions for key resolution ===

/**
 * Finds a key definition by matching the W3C code value (case-insensitive).
 * Time Complexity: O(1) - Uses pre-built hash map for instant lookup.
 *
 * @param input - The normalized input string to match against code values
 * @returns Resolved key information if found, undefined otherwise
 *
 * @example
 * ```typescript
 * findByCode("keya") // { key: "a", code: "KeyA", keyCode: 65, which: 65 }
 * findByCode("shiftleft") // { key: "Shift", code: "ShiftLeft", keyCode: 16, which: 16 }
 * ```
 */
function findByCode(input: string): ResolvedKey | undefined {
  const result = LOWERCASE_CODE_MAP.get(input);
  return result
    ? {
        key: result.key,
        code: result.code,
        keyCode: result.keyCode,
        which: result.keyCode, // Use keyCode as which (they're equivalent)
      }
    : undefined;
}

/**
 * Finds a key definition by matching code aliases (case-insensitive).
 * Time Complexity: O(1) - Uses pre-built hash map for instant lookup.
 *
 * Code aliases are alternative names for the same physical key location,
 * such as "leftshift" or "lshift" for "ShiftLeft".
 *
 * @param input - The normalized input string to match against code aliases
 * @returns Resolved key information if found, undefined otherwise
 *
 * @example
 * ```typescript
 * findByCodeAlias("leftshift") // { key: "Shift", code: "ShiftLeft", keyCode: 16, which: 16 }
 * findByCodeAlias("lctrl") // { key: "Control", code: "ControlLeft", keyCode: 17, which: 17 }
 * ```
 */
function findByCodeAlias(input: string): ResolvedKey | undefined {
  const result = CODE_ALIAS_MAP.get(input);
  return result
    ? {
        key: result.key,
        code: result.code,
        keyCode: result.keyCode,
        which: result.keyCode, // Use keyCode as which (they're equivalent)
      }
    : undefined;
}

/**
 * Finds key definitions by matching the W3C key value (case-insensitive).
 * Time Complexity: O(n) where n is the number of keys with the same key value.
 *
 * Key values represent the logical meaning of the key, such as "a", "Shift", or "Enter".
 * Some key values like "+" can come from multiple physical keys (Equal with Shift, NumpadAdd).
 *
 * @param input - The normalized input string to match against key values
 * @returns Array of resolved key information (multiple results for ambiguous keys)
 *
 * @example
 * ```typescript
 * findByKey("a") // [{ key: "a", code: "KeyA", keyCode: 65, which: 65 }]
 * findByKey("+") // [
 * //   { key: "+", code: "NumpadAdd", keyCode: 107, which: 107 },
 * //   { key: "+", code: "Equal", keyCode: 187, which: 187 }  // Shift+Equal
 * // ]
 * ```
 */
function findByKey(input: string): ResolvedKey[] {
  // We need to check all definitions for keys that might have multiple sources
  const allResults: ResolvedKey[] = [];

  // First, check direct key matches in KEY_DEFINITIONS
  Object.entries(KEY_DEFINITIONS).forEach(([code, definition]) => {
    if (definition.key.toLowerCase() === input) {
      allResults.push({
        key: definition.key,
        code: code,
        keyCode: definition.keyCode,
        which: definition.keyCode, // Use keyCode as which (they're equivalent)
      });
    }
  });

  // Then, check for shifted key combinations
  Object.entries(SHIFT_KEY_MAPPINGS).forEach(([baseCode, shiftedKey]) => {
    if (shiftedKey.toLowerCase() === input) {
      const baseDefinition =
        KEY_DEFINITIONS[baseCode as keyof typeof KEY_DEFINITIONS];
      if (baseDefinition) {
        allResults.push({
          key: shiftedKey,
          code: baseCode, // The actual code is still the base key
          keyCode: baseDefinition.keyCode,
          which: baseDefinition.keyCode, // Use keyCode as which (they're equivalent)
        });
      }
    }
  });

  return allResults;
}

/**
 * Finds key definitions by matching key aliases (case-insensitive).
 * Time Complexity: O(n) where n is the number of definitions that map to the aliased key.
 *
 * Key aliases are alternative names for the same logical key meaning,
 * such as "esc" for "Escape" or "cmd" for "Meta".
 *
 * @param input - The normalized input string to match against key aliases
 * @returns Array of resolved key information (multiple results when several codes share the same key)
 *
 * @example
 * ```typescript
 * findByKeyAlias("esc") // [{ key: "Escape", code: "Escape", keyCode: 27, which: 27 }]
 * findByKeyAlias("cmd") // [
 * //   { key: "Meta", code: "MetaLeft", keyCode: 91, which: 91 },
 * //   { key: "Meta", code: "MetaRight", keyCode: 93, which: 93 },
 * // ]
 * ```
 */
function findByKeyAlias(input: string): ResolvedKey[] {
  // find aliased key name from KEY_ALIASES
  const aliasEntry = Object.entries(KEY_ALIASES).find(([, aliases]) =>
    aliases.map((a) => a.toLowerCase()).includes(input),
  );
  if (!aliasEntry) return [];

  const [aliasedKey] = aliasEntry;
  // find all codes that yield this key (same logic as findByKey)
  const results: ResolvedKey[] = [];

  // First, check direct key matches in KEY_DEFINITIONS
  Object.entries(KEY_DEFINITIONS).forEach(([code, def]) => {
    if (def.key.toLowerCase() === aliasedKey.toLowerCase()) {
      results.push({
        key: def.key,
        code: code,
        keyCode: def.keyCode,
        which: def.keyCode,
      });
    }
  });

  // Then, check for shifted key combinations
  Object.entries(SHIFT_KEY_MAPPINGS).forEach(([baseCode, shiftedKey]) => {
    if (shiftedKey.toLowerCase() === aliasedKey.toLowerCase()) {
      const baseDefinition =
        KEY_DEFINITIONS[baseCode as keyof typeof KEY_DEFINITIONS];
      if (baseDefinition) {
        results.push({
          key: shiftedKey,
          code: baseCode, // The actual code is still the base key
          keyCode: baseDefinition.keyCode,
          which: baseDefinition.keyCode,
        });
      }
    }
  });

  return results;
}

// === Vitest Inline Snapshot Tests ===
// Test resolveKey function with various key names to capture their resolved data structures

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  const originalUA = navigator.userAgent;
  const defineUA = (ua: string) =>
    Object.defineProperty(navigator, "userAgent", {
      value: ua,
      configurable: true,
    });

  // Test comprehensive resolveKey snapshots for different key types and cases
  it("resolveKey snapshots", () => {
    // Key categories - representative boundary cases
    expect(resolveKey("KeyA")).toMatchInlineSnapshot(`
      [
        {
          "code": "KeyA",
          "key": "a",
          "keyCode": 65,
          "which": 65,
        },
      ]
    `);
    expect(resolveKey("KeyZ")).toMatchInlineSnapshot(`
      [
        {
          "code": "KeyZ",
          "key": "z",
          "keyCode": 90,
          "which": 90,
        },
      ]
    `);
    expect(resolveKey("Digit0")).toMatchInlineSnapshot(`
      [
        {
          "code": "Digit0",
          "key": "0",
          "keyCode": 48,
          "which": 48,
        },
      ]
    `);
    expect(resolveKey("Digit9")).toMatchInlineSnapshot(`
      [
        {
          "code": "Digit9",
          "key": "9",
          "keyCode": 57,
          "which": 57,
        },
      ]
    `);

    // Function keys - boundary cases
    expect(resolveKey("F1")).toMatchInlineSnapshot(`
      [
        {
          "code": "F1",
          "key": "F1",
          "keyCode": 112,
          "which": 112,
        },
      ]
    `);
    expect(resolveKey("F12")).toMatchInlineSnapshot(`
      [
        {
          "code": "F12",
          "key": "F12",
          "keyCode": 123,
          "which": 123,
        },
      ]
    `);

    // Modifier keys - specific and generic
    expect(resolveKey("ShiftLeft")).toMatchInlineSnapshot(`
      [
        {
          "code": "ShiftLeft",
          "key": "Shift",
          "keyCode": 16,
          "which": 16,
        },
      ]
    `);
    expect(resolveKey("shift")).toMatchInlineSnapshot(`
      [
        {
          "code": "ShiftLeft",
          "key": "Shift",
          "keyCode": 16,
          "which": 16,
        },
        {
          "code": "ShiftRight",
          "key": "Shift",
          "keyCode": 16,
          "which": 16,
        },
      ]
    `);
    expect(resolveKey("ctrl")).toMatchInlineSnapshot(`
      [
        {
          "code": "ControlLeft",
          "key": "Control",
          "keyCode": 17,
          "which": 17,
        },
        {
          "code": "ControlRight",
          "key": "Control",
          "keyCode": 17,
          "which": 17,
        },
      ]
    `);

    // Ambiguous keys - multiple sources
    expect(resolveKey("+")).toMatchInlineSnapshot(`
      [
        {
          "code": "NumpadAdd",
          "key": "+",
          "keyCode": 107,
          "which": 107,
        },
        {
          "code": "Equal",
          "key": "+",
          "keyCode": 187,
          "which": 187,
        },
      ]
    `);
    expect(resolveKey("*")).toMatchInlineSnapshot(`
      [
        {
          "code": "NumpadMultiply",
          "key": "*",
          "keyCode": 106,
          "which": 106,
        },
        {
          "code": "Digit8",
          "key": "*",
          "keyCode": 56,
          "which": 56,
        },
      ]
    `);

    // Common special keys
    expect(resolveKey("Escape")).toMatchInlineSnapshot(`
      [
        {
          "code": "Escape",
          "key": "Escape",
          "keyCode": 27,
          "which": 27,
        },
      ]
    `);
    expect(resolveKey("Space")).toMatchInlineSnapshot(`
      [
        {
          "code": "Space",
          "key": " ",
          "keyCode": 32,
          "which": 32,
        },
      ]
    `);

    // Case sensitivity tests
    expect(resolveKey("keya")).toMatchInlineSnapshot(`
      [
        {
          "code": "KeyA",
          "key": "a",
          "keyCode": 65,
          "which": 65,
        },
      ]
    `);
    expect(resolveKey("ESCAPE")).toMatchInlineSnapshot(`
      [
        {
          "code": "Escape",
          "key": "Escape",
          "keyCode": 27,
          "which": 27,
        },
      ]
    `);

    // Key value matching (single source keys)
    expect(resolveKey("a")).toMatchInlineSnapshot(`
      [
        {
          "code": "KeyA",
          "key": "a",
          "keyCode": 65,
          "which": 65,
        },
      ]
    `);
    expect(resolveKey("0")).toMatchInlineSnapshot(`
      [
        {
          "code": "Digit0",
          "key": "0",
          "keyCode": 48,
          "which": 48,
        },
        {
          "code": "Numpad0",
          "key": "0",
          "keyCode": 96,
          "which": 96,
        },
      ]
    `);

    // Key aliases
    expect(resolveKey("leftshift")).toMatchInlineSnapshot(`
      [
        {
          "code": "ShiftLeft",
          "key": "Shift",
          "keyCode": 16,
          "which": 16,
        },
      ]
    `);
    expect(resolveKey("esc")).toMatchInlineSnapshot(`
      [
        {
          "code": "Escape",
          "key": "Escape",
          "keyCode": 27,
          "which": 27,
        },
      ]
    `);
    expect(resolveKey("cmd")).toMatchInlineSnapshot(`
      [
        {
          "code": "MetaLeft",
          "key": "Meta",
          "keyCode": 91,
          "which": 91,
        },
        {
          "code": "MetaRight",
          "key": "Meta",
          "keyCode": 93,
          "which": 93,
        },
      ]
    `);
    // Test key alias that maps to shifted key (regression test for SHIFT_KEY_MAPPINGS support)
    expect(resolveKey("plus")).toMatchInlineSnapshot(`
      [
        {
          "code": "NumpadAdd",
          "key": "+",
          "keyCode": 107,
          "which": 107,
        },
        {
          "code": "Equal",
          "key": "+",
          "keyCode": 187,
          "which": 187,
        },
      ]
    `);

    // Modifier aliases comprehensive tests
    expect(resolveKey("option")).toMatchInlineSnapshot(`
      [
        {
          "code": "AltLeft",
          "key": "Alt",
          "keyCode": 18,
          "which": 18,
        },
        {
          "code": "AltRight",
          "key": "Alt",
          "keyCode": 18,
          "which": 18,
        },
      ]
    `);
    expect(resolveKey("win")).toMatchInlineSnapshot(`
      [
        {
          "code": "MetaLeft",
          "key": "Meta",
          "keyCode": 91,
          "which": 91,
        },
        {
          "code": "MetaRight",
          "key": "Meta",
          "keyCode": 93,
          "which": 93,
        },
      ]
    `);
    expect(resolveKey("windows")).toMatchInlineSnapshot(`
      [
        {
          "code": "MetaLeft",
          "key": "Meta",
          "keyCode": 91,
          "which": 91,
        },
        {
          "code": "MetaRight",
          "key": "Meta",
          "keyCode": 93,
          "which": 93,
        },
      ]
    `);
    expect(resolveKey("command")).toMatchInlineSnapshot(`
      [
        {
          "code": "MetaLeft",
          "key": "Meta",
          "keyCode": 91,
          "which": 91,
        },
        {
          "code": "MetaRight",
          "key": "Meta",
          "keyCode": 93,
          "which": 93,
        },
      ]
    `);
    expect(resolveKey("control")).toMatchInlineSnapshot(`
      [
        {
          "code": "ControlLeft",
          "key": "Control",
          "keyCode": 17,
          "which": 17,
        },
        {
          "code": "ControlRight",
          "key": "Control",
          "keyCode": 17,
          "which": 17,
        },
      ]
    `);

    // Edge cases
    expect(resolveKey("")).toMatchInlineSnapshot(`[]`);
    expect(resolveKey("UnknownKey")).toMatchInlineSnapshot(`
      [
        {
          "code": "UnknownKey",
          "key": "UnknownKey",
          "keyCode": -1,
          "which": -1,
        },
      ]
    `);
  });

  it("resolveKey - platform aware 'mod' mapping", () => {
    // Simulate macOS
    defineUA(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(resolveKey("mod")).toMatchInlineSnapshot(`
      [
        {
          "code": "MetaLeft",
          "key": "Meta",
          "keyCode": 91,
          "which": 91,
        },
        {
          "code": "MetaRight",
          "key": "Meta",
          "keyCode": 93,
          "which": 93,
        },
      ]
    `);
    // Simulate Windows
    defineUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(resolveKey("mod")).toMatchInlineSnapshot(`
      [
        {
          "code": "ControlLeft",
          "key": "Control",
          "keyCode": 17,
          "which": 17,
        },
        {
          "code": "ControlRight",
          "key": "Control",
          "keyCode": 17,
          "which": 17,
        },
      ]
    `);
    // Restore original
    defineUA(originalUA);
  });
}
