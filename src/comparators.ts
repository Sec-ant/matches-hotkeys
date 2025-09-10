// === Comparator functions ===

import type { ParsedCombination } from "./parseCombination";

export type Comparator = (
  a: ParsedCombination,
  b: ParsedCombination,
) => boolean;

/**
 * Create equality comparator for specific fields
 */
export function eq(...keys: (keyof ParsedCombination)[]): Comparator {
  return (a, b) => keys.every((key) => a[key] === b[key]);
}

/**
 * Combine comparators with AND logic
 */
export function and(...conds: Comparator[]): Comparator {
  return (a, b) => conds.every((fn) => fn(a, b));
}

/**
 * Combine comparators with OR logic
 */
export function or(...conds: Comparator[]): Comparator {
  return (a, b) => conds.some((fn) => fn(a, b));
}

/**
 * Modifier keys comparator
 */
export const MODIFIERS_COMPARATOR = eq(
  "altKey",
  "ctrlKey",
  "metaKey",
  "shiftKey",
);

/**
 * Key comparator
 */
export const COMPARE_BY_KEY = and(eq("key"), MODIFIERS_COMPARATOR);

/**
 * Code comparator
 */
export const COMPARE_BY_CODE = and(eq("code"), MODIFIERS_COMPARATOR);

/**
 * Which comparator
 */
export const COMPARE_BY_WHICH = and(eq("which"), MODIFIERS_COMPARATOR);

/**
 * KeyCode comparator
 */
export const COMPARE_BY_KEY_CODE = and(eq("keyCode"), MODIFIERS_COMPARATOR);

/**
 * Default comparator
 */
export const DEFAULT_COMPARATOR = or(
  COMPARE_BY_KEY,
  COMPARE_BY_CODE,
  COMPARE_BY_WHICH,
  COMPARE_BY_KEY_CODE,
);
