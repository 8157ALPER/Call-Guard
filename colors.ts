/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#172033',
    tint: '#2f95dc',

    // Core surfaces
    background: '#ffffff',
    foreground: '#172033',

    // Cards / elevated surfaces
    card: '#ffffff',
    cardForeground: '#172033',

    // Primary action color (buttons, links, active states)
    primary: '#2f95dc',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#e9f4fc',
    secondaryForeground: '#17466f',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#edf3f8',
    mutedForeground: '#5c6c7b',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#e9f4fc',
    accentForeground: '#17466f',

    // Destructive actions (delete, error states)
    destructive: '#ef4444',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#d9e4ed',
    input: '#d9e4ed',
  },

  dark: {
    text: '#f4f8fb',
    tint: '#78c2f5',
    background: '#101823',
    foreground: '#f4f8fb',
    card: '#182433',
    cardForeground: '#f4f8fb',
    primary: '#5baee8',
    primaryForeground: '#07121d',
    secondary: '#21374b',
    secondaryForeground: '#e2f2ff',
    muted: '#21303f',
    mutedForeground: '#b3c2ce',
    accent: '#21374b',
    accentForeground: '#e2f2ff',
    destructive: '#f87171',
    destructiveForeground: '#221010',
    border: '#2f4356',
    input: '#2f4356',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 12,
};

export default colors;
