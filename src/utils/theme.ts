/**
 * Utility functions for theme-aware class names
 * Helps create conditional classes based on theme
 */

export function themeClass(
  darkClass: string,
  lightClass: string
): string {
  return `${darkClass} dark:${darkClass} light:${lightClass}`;
}

/**
 * Get theme-aware background color class
 */
export function bgTheme(variant: 'bg' | 'card' | 'border' = 'bg'): string {
  return `bg-dark-${variant} dark:bg-dark-${variant} light:bg-light-${variant}`;
}

/**
 * Get theme-aware text color class
 */
export function textTheme(variant: 'text' | 'muted' = 'text'): string {
  return `text-dark-${variant} dark:text-dark-${variant} light:text-light-${variant}`;
}

/**
 * Get theme-aware border color class
 */
export function borderTheme(): string {
  return 'border-dark-border dark:border-dark-border light:border-light-border';
}


