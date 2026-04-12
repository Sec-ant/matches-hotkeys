let _isMacCached: boolean | undefined;

/**
 * Determines if the current environment is running on macOS.
 *
 * This function checks the user agent string to detect macOS systems. Useful
 * for implementing platform-specific behaviors or UI adjustments.
 * The result is cached after first call for performance.
 *
 * @returns `true` if running on macOS, `false` otherwise
 */
export function isMac(): boolean {
  if (_isMacCached === undefined) {
    try {
      _isMacCached = navigator.userAgent.includes("Mac");
    } catch {
      _isMacCached = false;
    }
  }
  return _isMacCached;
}

/**
 * Reset cached platform detection result.
 * Only needed when the user agent string changes at runtime (e.g., in tests).
 */
export function resetPlatformCache(): void {
  _isMacCached = undefined;
}

/**
 * Maps certain key names to their corresponding platform-specific names.
 *
 * This function is useful for translating key names to account for differences
 * between operating systems, such as "mod" stands for "Control" key on Windows
 * vs. "Meta" key on macOS.
 *
 * @param normalizedInput - The normalized key name to map.
 * @returns The platform-specific key name.
 */
export function preMap(normalizedInput: string) {
  if (normalizedInput === "mod") {
    // Return lowercase so downstream lowercase-based lookups work directly
    return isMac() ? "meta" : "control";
  }
  return normalizedInput;
}
