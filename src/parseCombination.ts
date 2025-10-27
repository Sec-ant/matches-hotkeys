import type { LiteralUnion, Writable } from "type-fest";
import {
  type CombinationToken,
  MODIFIER_CODE_TOKENS,
  MODIFIER_KEY_MAP,
  SHIFT_KEY_MAPPINGS,
} from "./consts";
import { preMap } from "./preMap";
import { resolveKey } from "./resolveKey";

/**
 * Represents a parsed hotkey combination with its individual components.
 */
export interface ParsedCombination
  extends Pick<
    Writable<KeyboardEvent>,
    | "code"
    | "key"
    | "keyCode"
    | "which"
    | "metaKey"
    | "ctrlKey"
    | "shiftKey"
    | "altKey"
  > {}

/**
 * Options for parsing a hotkey combination.
 */
export interface ParseCombinationOptions<S extends string = "+"> {
  /**
   * The character(s) to split the string form hotkey combination string by.
   *
   * When using the string form hotkey combination, you may want to change this
   * to another character if you want "+" (the default split character) to be
   * treated as a regular character.
   *
   * @default "+"
   */
  splitBy?: LiteralUnion<S, string>;
  /**
   * Whether to trim whitespace from each token.
   *
   * When using the string form hotkey combination, you may want to change this
   * to `false` if you want to allow space key as a valid key in the combination.
   *
   * @default true when parsing a string form combination,
   * false when parsing an array form combination
   */
  trim?: boolean;
  /**
   * Whether physical code tokens (e.g. "ControlLeft", "ShiftRight") and their code aliases
   * (e.g. "lctrl", "rightshift") can be used as leading modifier segments.
   *
   * KeyboardEvent only exposes boolean modifier flags (ctrlKey/metaKey/shiftKey/altKey),
   * so "ControlLeft+a" and "ControlRight+a" are indistinguishable at runtime. Allowing them as
   * modifiers may falsely suggest left/right specificity. When set to false, those tokens are
   * rejected in modifier positions but still valid as a standalone main key (e.g. "ShiftLeft").
   *
   * Summary:
   * - `true`  -> "ControlLeft+a" accepted
   * - `false` -> "ControlLeft+a" rejected, "ShiftLeft" (single token) still accepted
   *
   * @default true
   */
  allowCodeAsModifier?: boolean;
  /**
   * Whether to automatically infer `shiftKey: true` for shift-derived keys.
   *
   * When enabled, keys that can only be produced with Shift (e.g., "+" from Equal key,
   * "!" from Digit1) will automatically get `shiftKey: true` for physical keys that
   * require Shift to produce those characters.
   *
   * When disabled, `shiftKey` is only set based on explicitly provided modifiers.
   *
   * Examples:
   * - With `inferShift: true`: `parseCombination("plus")` sets `shiftKey: true` for Equal key
   * - With `inferShift: false`: `parseCombination("plus")` sets `shiftKey: false` for both keys
   *
   * @default false
   */
  inferShift?: boolean;
}

/**
 * Represents a hotkey combination.
 *
 * You can use either a string or an array of strings to represent a combination of keys.
 * For example, `"ctrl+a"` is equivalent to `["ctrl", "a"]`.
 */
export type Combination =
  | LiteralUnion<CombinationToken, string>
  | CombinationToken[];

/**
 * Parses a hotkey combination string into its individual components.
 *
 * @param combination The hotkey combination to parse.
 * @param options Options for parsing.
 * @returns An array of parsed hotkey combinations.
 */
export function parseCombination<S extends string>(
  combination: Combination,
  {
    splitBy = "+",
    trim,
    allowCodeAsModifier = true,
    inferShift = false,
  }: ParseCombinationOptions<S> = {},
): ParsedCombination[] {
  const isCombinationArray = Array.isArray(combination);

  // We trim whitespace by default for string inputs, but not for arrays
  const resolvedTrim = trim ?? !isCombinationArray;

  const rawTokens = isCombinationArray
    ? combination.slice()
    : combination.split(splitBy);

  // Normalize tokens based on trim option
  const parts = rawTokens.map((part) =>
    (resolvedTrim ? part.trim() : part).toLowerCase(),
  );

  // Any empty token denotes unfinished/invalid combination like 'ctrl+' or '+a' or 'ctrl++a'
  if (parts.some((t) => t === "")) {
    return [];
  }

  // No valid parts
  if (parts.length === 0) {
    return [];
  }

  const seenModifiers = new Set<string>();
  const lastIndex = parts.length - 1;

  // All but last must be modifiers
  for (let i = 0; i < lastIndex; i++) {
    const part = parts[i];
    const normalizedPart = preMap(part);
    const modifierKey = MODIFIER_KEY_MAP.get(normalizedPart);

    // Non-modifier before main key (invalid order)
    if (!modifierKey) {
      return [];
    }

    // Disallow code / code-alias if configured
    if (!allowCodeAsModifier && MODIFIER_CODE_TOKENS.has(normalizedPart)) {
      return [];
    }

    // Check for duplicate modifiers
    if (seenModifiers.has(modifierKey)) {
      return [];
    }

    seenModifiers.add(modifierKey);
  }

  // Process last part
  const lastPart = parts[lastIndex];
  const normalizedLastPart = preMap(lastPart);

  // Check if last part is also a modifier
  const lastPartModifierKey = MODIFIER_KEY_MAP.get(normalizedLastPart);
  if (lastPartModifierKey) {
    if (seenModifiers.has(lastPartModifierKey)) {
      return [];
    }
    seenModifiers.add(lastPartModifierKey);
  }

  // Resolve last part
  const resolvedKeys = resolveKey(normalizedLastPart);

  // If no keys were resolved, the combination is invalid
  if (resolvedKeys.length === 0) {
    return [];
  }

  // Generate results for all resolved key variants
  return resolvedKeys.map((resolved) => {
    // Check if this resolved key is a shift-derived symbol when inferShift is enabled
    // (e.g., Equal + Shift → "+", Digit1 + Shift → "!")
    const isShiftDerived =
      inferShift &&
      Object.entries(SHIFT_KEY_MAPPINGS).some(
        ([baseCode, shiftedKey]) =>
          resolved.code === baseCode && resolved.key === shiftedKey,
      );

    // For shift-derived keys when inferShift is true, automatically set shiftKey: true
    // Otherwise, only use explicitly provided shift modifier
    const finalShiftKey = isShiftDerived || seenModifiers.has("shiftKey");

    return {
      metaKey: seenModifiers.has("metaKey"),
      ctrlKey: seenModifiers.has("ctrlKey"),
      shiftKey: finalShiftKey,
      altKey: seenModifiers.has("altKey"),
      key: resolved.key,
      code: resolved.code,
      keyCode: resolved.keyCode,
      which: resolved.which,
    };
  });
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  const originalUA = navigator.userAgent;
  const defineUA = (ua: string) =>
    Object.defineProperty(navigator, "userAgent", {
      value: ua,
      configurable: true,
    });

  it("parseCombination - valid single keys", () => {
    expect(parseCombination("五")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "五",
          "ctrlKey": false,
          "key": "五",
          "keyCode": -1,
          "metaKey": false,
          "shiftKey": false,
          "which": -1,
        },
      ]
    `);

    // Single main key
    expect(parseCombination("a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Single modifier - returns multiple results for left/right variants
    expect(parseCombination("ctrl")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "ControlLeft",
          "ctrlKey": true,
          "key": "Control",
          "keyCode": 17,
          "metaKey": false,
          "shiftKey": false,
          "which": 17,
        },
        {
          "altKey": false,
          "code": "ControlRight",
          "ctrlKey": true,
          "key": "Control",
          "keyCode": 17,
          "metaKey": false,
          "shiftKey": false,
          "which": 17,
        },
      ]
    `);

    expect(parseCombination("shift")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "ShiftLeft",
          "ctrlKey": false,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
        {
          "altKey": false,
          "code": "ShiftRight",
          "ctrlKey": false,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
      ]
    `);
  });

  it("parseCombination - valid combinations", () => {
    // Multiple modifiers - last is main key (returns multiple variants for shift)
    expect(parseCombination("ctrl+shift")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "ShiftLeft",
          "ctrlKey": true,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
        {
          "altKey": false,
          "code": "ShiftRight",
          "ctrlKey": true,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
      ]
    `);

    expect(parseCombination("shift+ctrl")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "ControlLeft",
          "ctrlKey": true,
          "key": "Control",
          "keyCode": 17,
          "metaKey": false,
          "shiftKey": true,
          "which": 17,
        },
        {
          "altKey": false,
          "code": "ControlRight",
          "ctrlKey": true,
          "key": "Control",
          "keyCode": 17,
          "metaKey": false,
          "shiftKey": true,
          "which": 17,
        },
      ]
    `);

    // Modifier + key (last part is main key)
    expect(parseCombination("shift+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": true,
          "which": 65,
        },
      ]
    `);
  });

  it("parseCombination - modifier aliases", () => {
    expect(parseCombination("control+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    expect(parseCombination("cmd+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": true,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);
  });

  it("parseCombination - accepts code names and code aliases as modifiers", () => {
    // Code names
    expect(parseCombination("ControlLeft+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    expect(parseCombination("ShiftRight+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": true,
          "which": 65,
        },
      ]
    `);

    // Code aliases
    expect(parseCombination("lctrl+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);
    expect(parseCombination("rightshift+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": true,
          "which": 65,
        },
      ]
    `);
    // This is expected to return an empty array,
    // because we cannot distinguish `lshift+rshift` from `rshift`.
    // So we don't support such combinations
    expect(parseCombination("lshift+rshift")).toMatchInlineSnapshot(`[]`);
    expect(parseCombination("lctrl+lshift")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "ShiftLeft",
          "ctrlKey": true,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
      ]
    `);
    expect(parseCombination("lctrl+lshift+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": true,
          "which": 65,
        },
      ]
    `);
  });

  it("parseCombination - allowCodeAsModifier = false", () => {
    // Base modifier still works
    expect(
      parseCombination("ctrl+a", { allowCodeAsModifier: false }),
    ).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Code name rejected
    expect(
      parseCombination("ControlLeft+a", { allowCodeAsModifier: false }),
    ).toEqual([]);

    // Code alias rejected
    expect(parseCombination("lctrl+a", { allowCodeAsModifier: false })).toEqual(
      [],
    );

    // Single ShiftLeft: acts as both main key and its own modifier, so shiftKey is true.
    // Important: This resolves regardless of allowCodeAsModifier (option only affects
    // using code/code-alias tokens as preceding modifier segments, not as the final main key).
    expect(
      parseCombination("ShiftLeft", { allowCodeAsModifier: false }),
    ).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "ShiftLeft",
          "ctrlKey": false,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
      ]
    `);

    // But ShiftLeft used as modifier then another key is rejected when disabled
    expect(
      parseCombination("ShiftLeft+a", { allowCodeAsModifier: false }),
    ).toEqual([]);
  });

  it("parseCombination - invalid cases", () => {
    // Multiple main keys
    expect(parseCombination("a+b")).toEqual([]);

    // Unknown modifier
    expect(parseCombination("unknown+a")).toEqual([]);

    // Duplicate modifiers
    expect(parseCombination("ctrl+control+a")).toEqual([]);

    // Invalid order - non-modifier before modifier
    expect(parseCombination("a+ctrl")).toEqual([]);

    // Invalid order - multiple non-modifiers mixed with modifiers
    expect(parseCombination("a+ctrl+b")).toEqual([]);

    // Unfinished combination 1
    expect(parseCombination("ctrl+")).toEqual([]);

    // Unfinished combination 2
    expect(parseCombination("+a")).toEqual([]);

    // Unfinished combination 3
    expect(parseCombination("ctrl++a")).toEqual([]);

    // Empty string
    expect(parseCombination("")).toEqual([]);
  });

  it("parseCombination - edge cases", () => {
    // Case insensitive
    expect(parseCombination("CTRL+A")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Extra whitespace
    expect(parseCombination(" ctrl + a ")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Space key (should not be trimmed)
    expect(parseCombination("ctrl+ ", { trim: false })).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Space",
          "ctrlKey": true,
          "key": " ",
          "keyCode": 32,
          "metaKey": false,
          "shiftKey": false,
          "which": 32,
        },
      ]
    `);

    // Ambiguous keys - multiple sources
    expect(parseCombination("0")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Digit0",
          "ctrlKey": false,
          "key": "0",
          "keyCode": 48,
          "metaKey": false,
          "shiftKey": false,
          "which": 48,
        },
        {
          "altKey": false,
          "code": "Numpad0",
          "ctrlKey": false,
          "key": "0",
          "keyCode": 96,
          "metaKey": false,
          "shiftKey": false,
          "which": 96,
        },
      ]
    `);

    // Unknown key
    expect(parseCombination("ctrl+unknownkey")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "unknownkey",
          "ctrlKey": true,
          "key": "unknownkey",
          "keyCode": -1,
          "metaKey": false,
          "shiftKey": false,
          "which": -1,
        },
      ]
    `);
  });

  it("parseCombination - modifier map verification", () => {
    // Test that the new Map-based MODIFIER_KEY_MAP works correctly
    expect(parseCombination("option+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": true,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    expect(parseCombination("win+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": true,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);
  });

  it("parseCombination - platform aware 'mod' mapping", () => {
    // macOS: 'mod+a' -> metaKey
    defineUA(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(parseCombination("mod+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": true,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Windows: 'mod+a' -> ctrlKey
    defineUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(parseCombination("mod+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Cleanup handled by afterEach
  });

  it("parseCombination - array input", () => {
    // Basic modifier + key
    expect(parseCombination(["ctrl", "a"])).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Multiple modifiers, last is main
    expect(parseCombination(["ctrl", "shift"])).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "ShiftLeft",
          "ctrlKey": true,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
        {
          "altKey": false,
          "code": "ShiftRight",
          "ctrlKey": true,
          "key": "Shift",
          "keyCode": 16,
          "metaKey": false,
          "shiftKey": true,
          "which": 16,
        },
      ]
    `);

    // Code names as modifiers
    expect(parseCombination(["ControlLeft", "a"])).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Code alias as modifier
    expect(parseCombination(["lctrl", "a"])).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    // Array + trim=false should keep space key
    expect(parseCombination(["ctrl", " "])).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Space",
          "ctrlKey": true,
          "key": " ",
          "keyCode": 32,
          "metaKey": false,
          "shiftKey": false,
          "which": 32,
        },
      ]
    `);

    // Invalid: trimmed whitespace
    expect(parseCombination(["ctrl", " "], { trim: true })).toEqual([]);

    // Invalid: empty token
    expect(parseCombination(["ctrl", ""])).toEqual([]);

    // Invalid order
    expect(parseCombination(["a", "ctrl"])).toEqual([]);

    // Duplicate modifiers
    expect(parseCombination(["ctrl", "control", "a"])).toEqual([]);
  });

  it("parseCombination - platform aware 'mod' mapping", () => {
    defineUA(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(parseCombination("mod+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": false,
          "key": "a",
          "keyCode": 65,
          "metaKey": true,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    defineUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(parseCombination("mod+a")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "KeyA",
          "ctrlKey": true,
          "key": "a",
          "keyCode": 65,
          "metaKey": false,
          "shiftKey": false,
          "which": 65,
        },
      ]
    `);

    defineUA(originalUA);
  });

  it("parseCombination - shift-derived keys (default: inferShift=false)", () => {
    // Test that shift-derived keys work correctly without automatic inference by default

    // "plus" ("+") can come from NumpadAdd (no shift) or Equal (no automatic inference)
    expect(parseCombination("plus")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "NumpadAdd",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 107,
          "metaKey": false,
          "shiftKey": false,
          "which": 107,
        },
        {
          "altKey": false,
          "code": "Equal",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 187,
          "metaKey": false,
          "shiftKey": false,
          "which": 187,
        },
      ]
    `);

    expect(parseCombination("ctrl+plus")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "NumpadAdd",
          "ctrlKey": true,
          "key": "+",
          "keyCode": 107,
          "metaKey": false,
          "shiftKey": false,
          "which": 107,
        },
        {
          "altKey": false,
          "code": "Equal",
          "ctrlKey": true,
          "key": "+",
          "keyCode": 187,
          "metaKey": false,
          "shiftKey": false,
          "which": 187,
        },
      ]
    `);

    // Explicit shift + plus: both variants get shiftKey: true
    expect(parseCombination("shift+plus")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "NumpadAdd",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 107,
          "metaKey": false,
          "shiftKey": true,
          "which": 107,
        },
        {
          "altKey": false,
          "code": "Equal",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 187,
          "metaKey": false,
          "shiftKey": true,
          "which": 187,
        },
      ]
    `);

    // Using "=" (base key) should NOT get automatic shift
    expect(parseCombination("ctrl+=")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Equal",
          "ctrlKey": true,
          "key": "=",
          "keyCode": 187,
          "metaKey": false,
          "shiftKey": false,
          "which": 187,
        },
      ]
    `);

    // Test other shift-derived keys
    expect(parseCombination("!")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Digit1",
          "ctrlKey": false,
          "key": "!",
          "keyCode": 49,
          "metaKey": false,
          "shiftKey": false,
          "which": 49,
        },
      ]
    `);

    expect(parseCombination("@")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Digit2",
          "ctrlKey": false,
          "key": "@",
          "keyCode": 50,
          "metaKey": false,
          "shiftKey": false,
          "which": 50,
        },
      ]
    `);

    expect(parseCombination("ctrl+shift+!")).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Digit1",
          "ctrlKey": true,
          "key": "!",
          "keyCode": 49,
          "metaKey": false,
          "shiftKey": true,
          "which": 49,
        },
      ]
    `);
  });

  it("parseCombination - shift-derived keys with inferShift=true", () => {
    // Test that shift-derived keys automatically get shiftKey: true when inferShift is enabled

    // "plus" ("+") with inferShift: true should infer shift for Equal key
    expect(
      parseCombination("plus", { inferShift: true }),
    ).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "NumpadAdd",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 107,
          "metaKey": false,
          "shiftKey": false,
          "which": 107,
        },
        {
          "altKey": false,
          "code": "Equal",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 187,
          "metaKey": false,
          "shiftKey": true,
          "which": 187,
        },
      ]
    `);

    expect(
      parseCombination("ctrl+plus", { inferShift: true }),
    ).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "NumpadAdd",
          "ctrlKey": true,
          "key": "+",
          "keyCode": 107,
          "metaKey": false,
          "shiftKey": false,
          "which": 107,
        },
        {
          "altKey": false,
          "code": "Equal",
          "ctrlKey": true,
          "key": "+",
          "keyCode": 187,
          "metaKey": false,
          "shiftKey": true,
          "which": 187,
        },
      ]
    `);

    // Explicit shift + plus: both variants get shiftKey: true
    expect(
      parseCombination("shift+plus", { inferShift: true }),
    ).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "NumpadAdd",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 107,
          "metaKey": false,
          "shiftKey": true,
          "which": 107,
        },
        {
          "altKey": false,
          "code": "Equal",
          "ctrlKey": false,
          "key": "+",
          "keyCode": 187,
          "metaKey": false,
          "shiftKey": true,
          "which": 187,
        },
      ]
    `);

    // Test other shift-derived keys
    expect(parseCombination("!", { inferShift: true })).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Digit1",
          "ctrlKey": false,
          "key": "!",
          "keyCode": 49,
          "metaKey": false,
          "shiftKey": true,
          "which": 49,
        },
      ]
    `);

    expect(parseCombination("@", { inferShift: true })).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Digit2",
          "ctrlKey": false,
          "key": "@",
          "keyCode": 50,
          "metaKey": false,
          "shiftKey": true,
          "which": 50,
        },
      ]
    `);

    expect(
      parseCombination("ctrl+shift+!", { inferShift: true }),
    ).toMatchInlineSnapshot(`
      [
        {
          "altKey": false,
          "code": "Digit1",
          "ctrlKey": true,
          "key": "!",
          "keyCode": 49,
          "metaKey": false,
          "shiftKey": true,
          "which": 49,
        },
      ]
    `);
  });
}
