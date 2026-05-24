/**
 * Shared ANSI color constants and utilities
 */

// Reset codes
export const ANSI_RESET = '\x1b[0m';

// Terminal-default (transparent) codes: keep the terminal's own colours
export const ANSI_BG_DEFAULT = '\x1b[49m';
export const ANSI_FG_DEFAULT = '\x1b[39m';

/** True when a background ANSI code is the terminal default (transparent). */
export function is_transparent_bg(bg_color: string): boolean {
	return bg_color === ANSI_BG_DEFAULT;
}

/**
 * Convert a background ANSI code into the equivalent foreground code so a
 * segment's colour can be used to fill a separator glyph. Handles 24-bit
 * (48;2), 256-colour (48;5), the default background, and the basic 16-colour
 * ranges. Anything unrecognised is returned unchanged.
 */
export function ansi_bg_to_fg(bg_color: string): string {
	if (bg_color === ANSI_BG_DEFAULT) return ANSI_FG_DEFAULT;
	if (bg_color.includes('[48;')) return bg_color.replace('[48;', '[38;');

	const match = bg_color.match(/^\x1b\[(\d+)m$/);
	if (match) {
		const code = parseInt(match[1], 10);
		// 40-47 → 30-37 (standard), 100-107 → 90-97 (bright)
		if ((code >= 40 && code <= 47) || (code >= 100 && code <= 107)) {
			return `\x1b[${code - 10}m`;
		}
	}
	return bg_color;
}

// Background colors (48;2;r;g;b format for 24-bit)
export const ANSI_BG = {
	red: '\x1b[41m',
	green: '\x1b[42m',
	yellow: '\x1b[43m',
	blue: '\x1b[44m',
	purple: '\x1b[45m',
	cyan: '\x1b[46m',
	white: '\x1b[47m',
	gray: '\x1b[100m',
	bright_black: '\x1b[100m',
} as const;

// Foreground colors (38;2;r;g;b format for 24-bit)
export const ANSI_FG = {
	black: '\x1b[30m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	purple: '\x1b[35m',
	cyan: '\x1b[36m',
	white: '\x1b[37m',
	bright_white: '\x1b[97m',
	gray: '\x1b[90m',
} as const;

// Common color combinations for fallbacks
export const FALLBACK_COLORS = {
	model: {
		bg: ANSI_BG.blue,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.blue,
	},
	directory: {
		bg: ANSI_BG.gray,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.gray,
	},
	git_clean: {
		bg: ANSI_BG.green,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.green,
	},
	git_dirty: {
		bg: ANSI_BG.yellow,
		fg: ANSI_FG.black,
		separator: ANSI_FG.yellow,
	},
	session: {
		bg: ANSI_BG.purple,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.purple,
	},
	context: {
		bg: ANSI_BG.cyan,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.cyan,
	},
	usage: {
		bg: ANSI_BG.purple,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.purple,
	},
	session_id: {
		bg: ANSI_BG.blue,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.blue,
	},
	rate_limits: {
		bg: ANSI_BG.red,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.red,
	},
	error: {
		bg: ANSI_BG.red,
		fg: ANSI_FG.bright_white,
		separator: ANSI_FG.red,
	},
} as const;

/**
 * Create a styled text with foreground and background colors
 */
export function create_styled_text(
	text: string,
	fg_color: string,
	bg_color?: string,
): string {
	const bg = bg_color || '';
	return `${bg}${fg_color}${text}${ANSI_RESET}`;
}

/**
 * Get fallback colors for a segment type
 */
export function get_fallback_colors(
	segment_type: keyof typeof FALLBACK_COLORS,
) {
	return FALLBACK_COLORS[segment_type] || FALLBACK_COLORS.model;
}
