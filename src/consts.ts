/**
 * Single data source keyboard mapping - Compliant with W3C standards
 * References:
 * - https://www.w3.org/TR/uievents-code/
 * - https://www.w3.org/TR/uievents-key/
 * - https://github.com/nfriend/ts-keycode-enum
 */

// === Core data source: W3C code as primary key ===
export const KEY_DEFINITIONS = {
  // Letter keys (a-z)
  KeyA: { key: "a", keyCode: 65 },
  KeyB: { key: "b", keyCode: 66 },
  KeyC: { key: "c", keyCode: 67 },
  KeyD: { key: "d", keyCode: 68 },
  KeyE: { key: "e", keyCode: 69 },
  KeyF: { key: "f", keyCode: 70 },
  KeyG: { key: "g", keyCode: 71 },
  KeyH: { key: "h", keyCode: 72 },
  KeyI: { key: "i", keyCode: 73 },
  KeyJ: { key: "j", keyCode: 74 },
  KeyK: { key: "k", keyCode: 75 },
  KeyL: { key: "l", keyCode: 76 },
  KeyM: { key: "m", keyCode: 77 },
  KeyN: { key: "n", keyCode: 78 },
  KeyO: { key: "o", keyCode: 79 },
  KeyP: { key: "p", keyCode: 80 },
  KeyQ: { key: "q", keyCode: 81 },
  KeyR: { key: "r", keyCode: 82 },
  KeyS: { key: "s", keyCode: 83 },
  KeyT: { key: "t", keyCode: 84 },
  KeyU: { key: "u", keyCode: 85 },
  KeyV: { key: "v", keyCode: 86 },
  KeyW: { key: "w", keyCode: 87 },
  KeyX: { key: "x", keyCode: 88 },
  KeyY: { key: "y", keyCode: 89 },
  KeyZ: { key: "z", keyCode: 90 },

  // Digit keys (0-9)
  Digit0: { key: "0", keyCode: 48 },
  Digit1: { key: "1", keyCode: 49 },
  Digit2: { key: "2", keyCode: 50 },
  Digit3: { key: "3", keyCode: 51 },
  Digit4: { key: "4", keyCode: 52 },
  Digit5: { key: "5", keyCode: 53 },
  Digit6: { key: "6", keyCode: 54 },
  Digit7: { key: "7", keyCode: 55 },
  Digit8: { key: "8", keyCode: 56 },
  Digit9: { key: "9", keyCode: 57 },

  // Function keys (F1-F12)
  F1: { key: "F1", keyCode: 112 },
  F2: { key: "F2", keyCode: 113 },
  F3: { key: "F3", keyCode: 114 },
  F4: { key: "F4", keyCode: 115 },
  F5: { key: "F5", keyCode: 116 },
  F6: { key: "F6", keyCode: 117 },
  F7: { key: "F7", keyCode: 118 },
  F8: { key: "F8", keyCode: 119 },
  F9: { key: "F9", keyCode: 120 },
  F10: { key: "F10", keyCode: 121 },
  F11: { key: "F11", keyCode: 122 },
  F12: { key: "F12", keyCode: 123 },

  // Modifier keys (supports left/right distinction)
  ShiftLeft: { key: "Shift", keyCode: 16 },
  ShiftRight: { key: "Shift", keyCode: 16 },
  ControlLeft: { key: "Control", keyCode: 17 },
  ControlRight: { key: "Control", keyCode: 17 },
  AltLeft: { key: "Alt", keyCode: 18 },
  AltRight: { key: "Alt", keyCode: 18 },
  MetaLeft: { key: "Meta", keyCode: 91 },
  MetaRight: { key: "Meta", keyCode: 93 },

  // Navigation keys
  ArrowUp: { key: "ArrowUp", keyCode: 38 },
  ArrowDown: { key: "ArrowDown", keyCode: 40 },
  ArrowLeft: { key: "ArrowLeft", keyCode: 37 },
  ArrowRight: { key: "ArrowRight", keyCode: 39 },
  Home: { key: "Home", keyCode: 36 },
  End: { key: "End", keyCode: 35 },
  PageUp: { key: "PageUp", keyCode: 33 },
  PageDown: { key: "PageDown", keyCode: 34 },

  // Editing keys
  Backspace: { key: "Backspace", keyCode: 8 },
  Delete: { key: "Delete", keyCode: 46 },
  Insert: { key: "Insert", keyCode: 45 },
  Tab: { key: "Tab", keyCode: 9 },
  Enter: { key: "Enter", keyCode: 13 },
  Space: { key: " ", keyCode: 32 },

  // Special keys
  Escape: { key: "Escape", keyCode: 27 },
  CapsLock: { key: "CapsLock", keyCode: 20 },
  NumLock: { key: "NumLock", keyCode: 144 },
  ScrollLock: { key: "ScrollLock", keyCode: 145 },
  Pause: { key: "Pause", keyCode: 19 },
  PrintScreen: { key: "PrintScreen", keyCode: 44 },

  // Symbol keys (standard US keyboard layout)
  Backquote: { key: "`", keyCode: 192 },
  Minus: { key: "-", keyCode: 189 },
  Equal: { key: "=", keyCode: 187 },
  BracketLeft: { key: "[", keyCode: 219 },
  BracketRight: { key: "]", keyCode: 221 },
  Backslash: { key: "\\", keyCode: 220 },
  Semicolon: { key: ";", keyCode: 186 },
  Quote: { key: "'", keyCode: 222 },
  Comma: { key: ",", keyCode: 188 },
  Period: { key: ".", keyCode: 190 },
  Slash: { key: "/", keyCode: 191 },

  // Numpad digit keys
  Numpad0: { key: "0", keyCode: 96 },
  Numpad1: { key: "1", keyCode: 97 },
  Numpad2: { key: "2", keyCode: 98 },
  Numpad3: { key: "3", keyCode: 99 },
  Numpad4: { key: "4", keyCode: 100 },
  Numpad5: { key: "5", keyCode: 101 },
  Numpad6: { key: "6", keyCode: 102 },
  Numpad7: { key: "7", keyCode: 103 },
  Numpad8: { key: "8", keyCode: 104 },
  Numpad9: { key: "9", keyCode: 105 },

  // Numpad operation keys
  NumpadDecimal: { key: ".", keyCode: 110 },
  NumpadDivide: { key: "/", keyCode: 111 },
  NumpadMultiply: { key: "*", keyCode: 106 },
  NumpadSubtract: { key: "-", keyCode: 109 },
  NumpadAdd: { key: "+", keyCode: 107 },
  NumpadEnter: { key: "Enter", keyCode: 13 },

  // === Audio/Media Control Keys ===
  // Modern browsers support these for media control in web applications
  AudioVolumeUp: { key: "AudioVolumeUp", keyCode: 175 },
  AudioVolumeDown: { key: "AudioVolumeDown", keyCode: 174 },
  AudioVolumeMute: { key: "AudioVolumeMute", keyCode: 173 },
  MediaPlayPause: { key: "MediaPlayPause", keyCode: 179 },
  MediaStop: { key: "MediaStop", keyCode: 178 },
  MediaTrackNext: { key: "MediaTrackNext", keyCode: 176 },
  MediaTrackPrevious: { key: "MediaTrackPrevious", keyCode: 177 },

  // === Browser Navigation Keys ===
  // Common on Windows/Linux keyboards for browser control
  BrowserBack: { key: "BrowserBack", keyCode: 166 },
  BrowserForward: { key: "BrowserForward", keyCode: 167 },
  BrowserRefresh: { key: "BrowserRefresh", keyCode: 168 },
  BrowserHome: { key: "BrowserHome", keyCode: 172 },
  BrowserSearch: { key: "BrowserSearch", keyCode: 170 },
  BrowserFavorites: { key: "BrowserFavorites", keyCode: 171 },

  // === System/Application Launch Keys ===
  // Special keys for launching applications and selecting media
  LaunchMail: { key: "LaunchMail", keyCode: 180 },
  LaunchApp1: { key: "LaunchApp1", keyCode: 182 },
  LaunchApp2: { key: "LaunchApp2", keyCode: 183 },
  MediaSelect: { key: "MediaSelect", keyCode: 181 },

  // === International/Special Keys ===
  // Support for international keyboard layouts
  IntlBackslash: { key: "\\", keyCode: 226 }, // International keyboard backslash
  IntlRo: { key: "ろ", keyCode: 193 }, // Japanese keyboard Ro key
  IntlYen: { key: "¥", keyCode: 255 }, // Japanese keyboard Yen key
} as const;

// === Shift key mappings (for keys that produce different symbols when shifted) ===
// Maps the base code to the shifted key value
export const SHIFT_KEY_MAPPINGS = {
  // Symbol keys that change when shifted
  Equal: "+", // Shift+Equal produces "+"
  Digit1: "!", // Shift+1 produces "!"
  Digit2: "@", // Shift+2 produces "@"
  Digit3: "#", // Shift+3 produces "#"
  Digit4: "$", // Shift+4 produces "$"
  Digit5: "%", // Shift+5 produces "%"
  Digit6: "^", // Shift+6 produces "^"
  Digit7: "&", // Shift+7 produces "&"
  Digit8: "*", // Shift+8 produces "*"
  Digit9: "(", // Shift+9 produces "("
  Digit0: ")", // Shift+0 produces ")"
  Minus: "_", // Shift+Minus produces "_"
  Backquote: "~", // Shift+Backquote produces "~"
  BracketLeft: "{", // Shift+[ produces "{"
  BracketRight: "}", // Shift+] produces "}"
  Backslash: "|", // Shift+\ produces "|"
  Semicolon: ":", // Shift+; produces ":"
  Quote: '"', // Shift+' produces "\""
  Comma: "<", // Shift+, produces "<"
  Period: ">", // Shift+. produces ">"
  Slash: "?", // Shift+/ produces "?"
} as const satisfies Partial<Record<keyof typeof KEY_DEFINITIONS, string>>;

// === Key level aliases (semantic aliases) ===
export const KEY_ALIASES = {
  // Modifier aliases
  Alt: ["option"],
  Meta: ["win", "windows", "cmd", "command"],
  Control: ["ctrl"],

  // Special key aliases
  Escape: ["esc"],
  Enter: ["return"],
  Delete: ["del"],
  Insert: ["ins"],
  CapsLock: ["caps"],
  PrintScreen: ["printscreen", "prtsc"],

  // Navigation key aliases
  ArrowUp: ["up"],
  ArrowDown: ["down"],
  ArrowLeft: ["left"],
  ArrowRight: ["right"],
  PageUp: ["pgup"],
  PageDown: ["pgdn"],

  // Symbol key aliases
  "`": ["grave", "backtick"],
  "-": ["minus", "dash"],
  "=": ["equal", "equals"],
  "[": ["openbracket", "leftbracket"],
  "]": ["closebracket", "rightbracket"],
  ";": ["semicolon"],
  "'": ["quote", "apostrophe"],
  ".": ["period", "dot"],
  " ": ["space"],
} as const satisfies Partial<
  Record<
    (typeof KEY_DEFINITIONS)[keyof typeof KEY_DEFINITIONS]["key"],
    Lowercase<string>[]
  >
>;

// === Code level aliases (physical location aliases) ===
export const CODE_ALIASES = {
  // Left/right modifier key aliases
  ShiftLeft: ["leftshift", "lshift"],
  ShiftRight: ["rightshift", "rshift"],
  ControlLeft: ["leftctrl", "lctrl", "leftcontrol"],
  ControlRight: ["rightctrl", "rctrl", "rightcontrol"],
  AltLeft: ["leftalt", "lalt", "leftoption"],
  AltRight: ["rightalt", "ralt", "rightoption"],
  MetaLeft: ["leftmeta", "lmeta", "leftcmd", "lcmd"],
  MetaRight: ["rightmeta", "rmeta", "rightcmd", "rcmd"],

  // Numpad aliases
  NumpadDecimal: ["numpaddot"],
  NumpadDivide: ["numpadslash"],
  NumpadMultiply: ["numpadstar"],
  NumpadSubtract: ["numpadminus"],
  NumpadAdd: ["numpadplus"],
} as const satisfies Partial<
  Record<keyof typeof KEY_DEFINITIONS, Lowercase<string>[]>
>;

// === Modifier key mappings for hotkey parsing ===
/** Base mapping from actual key values to modifier properties - SINGLE SOURCE OF TRUTH */
const MODIFIER_KEY_DEFINITIONS = {
  Meta: "metaKey",
  Control: "ctrlKey",
  Shift: "shiftKey",
  Alt: "altKey",
} as const satisfies Record<
  ExtractStrict<
    (typeof KEY_DEFINITIONS)[keyof typeof KEY_DEFINITIONS]["key"],
    "Meta" | "Control" | "Shift" | "Alt"
  >,
  ExtractStrict<
    keyof KeyboardEvent,
    "metaKey" | "ctrlKey" | "shiftKey" | "altKey"
  >
>;

// === Pre-built lookup tables for optimal performance ===
// These are computed once at module load time to avoid repeated calculations

/** Lowercase code to definition mapping for O(1) lookups */
export const LOWERCASE_CODE_MAP = new Map(
  Object.entries(KEY_DEFINITIONS).map(([code, definition]) => [
    code.toLowerCase(),
    { ...definition, code },
  ]),
);

/** Code alias to definition mapping for O(1) lookups */
export const CODE_ALIAS_MAP = new Map(
  Object.entries(CODE_ALIASES).flatMap(([code, aliases]) => {
    const definition = KEY_DEFINITIONS[code as keyof typeof KEY_DEFINITIONS];
    return aliases.map((alias) => [
      alias.toLowerCase(),
      { ...definition, code },
    ]);
  }),
);

// Note: KEY_ALIAS_MAP intentionally omitted. We derive alias → codes on demand to keep a single source of truth.

/** Pre-built modifier lookup map for O(1) lookups */
export const MODIFIER_KEY_MAP = new Map([
  // Add actual modifier keys (lowercased)
  ...Object.entries(MODIFIER_KEY_DEFINITIONS).map(
    ([key, prop]) => [key.toLowerCase(), prop] as const,
  ),

  // Add KEY_ALIASES for modifiers
  ...Object.entries(KEY_ALIASES).flatMap(([key, aliases]) => {
    const modifierProp =
      MODIFIER_KEY_DEFINITIONS[key as keyof typeof MODIFIER_KEY_DEFINITIONS];
    if (!modifierProp) return [];
    return aliases.map((alias) => [alias.toLowerCase(), modifierProp] as const);
  }),

  // Add code names for modifiers (e.g., controlleft, shiftright)
  ...Object.entries(KEY_DEFINITIONS)
    .filter(
      ([, def]) =>
        (def.key as keyof typeof MODIFIER_KEY_DEFINITIONS) in
        MODIFIER_KEY_DEFINITIONS,
    )
    .map(
      ([code, def]) =>
        [
          code.toLowerCase(),
          MODIFIER_KEY_DEFINITIONS[
            def.key as keyof typeof MODIFIER_KEY_DEFINITIONS
          ],
        ] as const,
    ),

  // Add code-alias tokens for modifiers (e.g., lctrl, rightshift)
  ...Object.entries(CODE_ALIASES).flatMap(([code, aliases]) => {
    const def = KEY_DEFINITIONS[code as keyof typeof KEY_DEFINITIONS];
    const prop =
      MODIFIER_KEY_DEFINITIONS[
        def?.key as keyof typeof MODIFIER_KEY_DEFINITIONS
      ];
    if (!prop) return [];
    return aliases.map((alias) => [alias.toLowerCase(), prop] as const);
  }),
]);

/**
 * Set of modifier code tokens (code names + code aliases) used to optionally disallow
 * code-specific modifier usage when `allowCodeAsModifier` is false.
 * (All tokens are lowercased.)
 */
export const MODIFIER_CODE_TOKENS = new Set<string>([
  // Code names
  ...Object.entries(KEY_DEFINITIONS)
    .filter(
      ([, def]) =>
        (def.key as keyof typeof MODIFIER_KEY_DEFINITIONS) in
        MODIFIER_KEY_DEFINITIONS,
    )
    .map(([code]) => code.toLowerCase()),
  // Code aliases
  ...Object.entries(CODE_ALIASES).flatMap(([code, aliases]) => {
    const def = KEY_DEFINITIONS[code as keyof typeof KEY_DEFINITIONS];
    if (!def) return [] as string[];
    if (
      !(
        (def.key as keyof typeof MODIFIER_KEY_DEFINITIONS) in
        MODIFIER_KEY_DEFINITIONS
      )
    )
      return [] as string[];
    return aliases.map((a) => a.toLowerCase());
  }),
]);

type ExtractStrict<
  T,
  U extends [U] extends [
    // Ensure every member of `U` extracts something from `T`
    U extends unknown ? (Extract<T, U> extends never ? never : U) : never,
  ]
    ? unknown
    : never,
> = Extract<T, U>;
