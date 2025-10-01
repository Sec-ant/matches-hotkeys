import { isEqualWith } from "es-toolkit";
import {
  and,
  type Comparator,
  DEFAULT_COMPARATOR,
  eq,
  or,
} from "./comparators";
import {
  type Combination,
  type ParseCombinationOptions,
  parseCombination,
} from "./parseCombination";

export interface MatchesHotkeysOptions {
  /**
   * Custom comparator passed to `isEqualWith` to decide whether a parsed hotkey
   * combination matches the provided `KeyboardEvent`.
   * Defaults to `DEFAULT_COMPARATOR` (compares code, key, keyCode, which, meta/ctrl/shift/alt flags).
   */
  comparator?: Comparator;
}

export interface Hotkey {
  /**
   * Hotkey combination in string form (e.g. "ctrl+a") or array form (e.g. ["ctrl", "a"]).
   * Ambiguous inputs may expand to multiple physical combinations (e.g. ShiftLeft/ShiftRight).
   */
  combination: Combination;
  /**
   * Optional parse options forwarded to `parseCombination` (e.g. `allowCodeAsModifier`).
   */
  options?: ParseCombinationOptions;
}

/**
 * Returns true if the keyboard event matches at least one provided hotkey.
 * Expands each hotkey via `parseCombination`, then compares each expanded
 * combination against the event using `isEqualWith` + the (optional) custom comparator.
 */
export function matchesHotkeys(
  hotkeys: Hotkey[],
  event: KeyboardEvent,
  { comparator = DEFAULT_COMPARATOR }: MatchesHotkeysOptions = {},
) {
  return hotkeys.some(({ combination, options }) =>
    parseCombination(combination, options).some((parsedCombination) =>
      isEqualWith(parsedCombination, event, comparator),
    ),
  );
}

if (import.meta.vitest) {
  const { it, expect } = import.meta.vitest;
  const originalUA = navigator.userAgent;
  const defineUA = (ua: string) =>
    Object.defineProperty(navigator, "userAgent", {
      value: ua,
      configurable: true,
    });

  // Simple helper to build a KeyboardEvent-like object for tests.
  const evt = (partial: Partial<KeyboardEvent>): KeyboardEvent =>
    ({
      code: "",
      key: "",
      keyCode: 0,
      which: 0,
      metaKey: false,
      ctrlKey: false,
      shiftKey: false,
      altKey: false,
      ...partial,
    }) as unknown as KeyboardEvent;

  it("matchesHotkeys - single simple hotkey (string form)", () => {
    const hotkeys: Hotkey[] = [{ combination: "ctrl+a" }];
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true }),
      ),
    ).toBe(true);
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyB", key: "b", keyCode: 66, which: 66, ctrlKey: true }),
      ),
    ).toBe(false);
  });

  it("matchesHotkeys - array form combination", () => {
    const hotkeys: Hotkey[] = [{ combination: ["ctrl", "a"] }];
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true }),
      ),
    ).toBe(true);
  });

  it("matchesHotkeys - ambiguous modifier expansion (shift as main)", () => {
    const hotkeys: Hotkey[] = [{ combination: "shift" }];
    // Should match both ShiftLeft and ShiftRight events
    expect(
      matchesHotkeys(
        hotkeys,
        evt({
          code: "ShiftLeft",
          key: "Shift",
          keyCode: 16,
          which: 16,
          shiftKey: true,
        }),
      ),
    ).toBe(true);
    expect(
      matchesHotkeys(
        hotkeys,
        evt({
          code: "ShiftRight",
          key: "Shift",
          keyCode: 16,
          which: 16,
          shiftKey: true,
        }),
      ),
    ).toBe(true);
  });

  it("matchesHotkeys - multiple hotkeys (first fails, second matches)", () => {
    const hotkeys: Hotkey[] = [
      { combination: "ctrl+b" },
      { combination: "ctrl+a" },
    ];
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true }),
      ),
    ).toBe(true);
  });

  it("matchesHotkeys - allowCodeAsModifier = false blocks code token as leading modifier", () => {
    const hotkeys: Hotkey[] = [
      { combination: "ControlLeft+a", options: { allowCodeAsModifier: false } },
      { combination: "ctrl+a" },
    ];
    // Event representing ctrl+a should not match the first (blocked), but matches second
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true }),
      ),
    ).toBe(true);
  });

  it("matchesHotkeys - custom comparator ignoring shiftKey (built via eq/and/or)", () => {
    // Build a comparator that mimics DEFAULT_COMPARATOR but omits shiftKey from comparisons.
    const IGNORE_SHIFT_COMPARATOR: Comparator = or(
      and(eq("key", "altKey", "ctrlKey", "metaKey")),
      and(eq("code", "altKey", "ctrlKey", "metaKey")),
      and(eq("which", "altKey", "ctrlKey", "metaKey")),
      and(eq("keyCode", "altKey", "ctrlKey", "metaKey")),
    );

    const hotkeys: Hotkey[] = [{ combination: "a" }];
    // Event has shiftKey true but comparator ignores it, so it still matches.
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, shiftKey: true }),
        { comparator: IGNORE_SHIFT_COMPARATOR },
      ),
    ).toBe(true);
  });

  it("matchesHotkeys - no match returns false", () => {
    const hotkeys: Hotkey[] = [{ combination: "ctrl+x" }];
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true }),
      ),
    ).toBe(false);
  });

  it("matchesHotkeys - platform aware 'mod' mapping", () => {
    const hotkeys: Hotkey[] = [{ combination: "mod+a" }];
    defineUA(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, metaKey: true }),
      ),
    ).toBe(true);
    defineUA(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/123.0.0.0 Safari/537.36",
    );
    expect(
      matchesHotkeys(
        hotkeys,
        evt({ code: "KeyA", key: "a", keyCode: 65, which: 65, ctrlKey: true }),
      ),
    ).toBe(true);
    defineUA(originalUA);
  });

  it("matchesHotkeys - shift-derived keys match real events", () => {
    // Test that shift-derived keys (e.g., "plus") can actually match real keyboard events

    const plusHotkeys: Hotkey[] = [{ combination: "ctrl+plus" }];

    // Should match Ctrl + NumpadAdd (no shift needed)
    expect(
      matchesHotkeys(
        plusHotkeys,
        evt({
          code: "NumpadAdd",
          key: "+",
          keyCode: 107,
          which: 107,
          ctrlKey: true,
          shiftKey: false,
        }),
      ),
    ).toBe(true);

    // Should match Ctrl + Shift + Equal (produces "+")
    expect(
      matchesHotkeys(
        plusHotkeys,
        evt({
          code: "Equal",
          key: "+",
          keyCode: 187,
          which: 187,
          ctrlKey: true,
          shiftKey: true,
        }),
      ),
    ).toBe(true);

    // Should NOT match Ctrl + Equal without Shift (produces "=", not "+")
    expect(
      matchesHotkeys(
        plusHotkeys,
        evt({
          code: "Equal",
          key: "=",
          keyCode: 187,
          which: 187,
          ctrlKey: true,
          shiftKey: false,
        }),
      ),
    ).toBe(false);

    // Test with explicit "=" - should only match Equal without shift
    const equalHotkeys: Hotkey[] = [{ combination: "ctrl+=" }];
    expect(
      matchesHotkeys(
        equalHotkeys,
        evt({
          code: "Equal",
          key: "=",
          keyCode: 187,
          which: 187,
          ctrlKey: true,
          shiftKey: false,
        }),
      ),
    ).toBe(true);

    expect(
      matchesHotkeys(
        equalHotkeys,
        evt({
          code: "Equal",
          key: "+",
          keyCode: 187,
          which: 187,
          ctrlKey: true,
          shiftKey: true,
        }),
      ),
    ).toBe(false);
  });
}
