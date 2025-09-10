/**
 * Determines if the current environment is running on macOS.
 *
 * This function checks the user agent string to detect macOS systems. Useful
 * for implementing platform-specific behaviors or UI adjustments.
 *
 * @returns `true` if running on macOS, `false` otherwise
 */
export function isMac() {
  return navigator.userAgent.includes("Mac");
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
