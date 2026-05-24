import { SeparatorStyle } from '../types';
import { ANSI_RESET } from '../utils/ansi';

// Direct powerline separator characters - complete working set
const SEPARATORS = {
	left: '\uE0B2',
	right: '\uE0B0',
	left_thin: '\uE0B3',
	right_thin: '\uE0B1',
	curvy: '\uE0B4',
	curvy_left: '\uE0B6',
	curvy_thin: '\uE0B5',
	curvy_thin_left: '\uE0B7',
	angly: '\uE0B8',
	angly_left: '\uE0B9',
	angly2: '\uE0BC',
	angly2_left: '\uE0BD',
	double_chevron: '\uE0B0\uE0B1',
	double_chevron_left: '\uE0B2\uE0B3',
	extra_ba: '\uE0BA',
	extra_bb: '\uE0BB',
	extra_be: '\uE0BE',
	extra_bf: '\uE0BF',
};

function get_separator_char(style: SeparatorStyle): string {
	if (style === 'none') return '';

	// Direct mapping of styles to separator characters
	const separator_map: Record<SeparatorStyle, string> = {
		thick: SEPARATORS.right,
		thin: SEPARATORS.right_thin,
		curvy: SEPARATORS.curvy,
		angly: SEPARATORS.angly,
		angly2: SEPARATORS.angly2,
		double_chevron: SEPARATORS.double_chevron,
		none: '',
	};

	return separator_map[style] || SEPARATORS.right;
}

export function create_styled_separator(
	from_color: string,
	to_color = '',
	style: SeparatorStyle = 'thick',
): string {
	if (style === 'none') return '';

	const separator_char = get_separator_char(style);
	return `${to_color}${from_color}${separator_char}${ANSI_RESET}`;
}

function get_separator_char_left(style: SeparatorStyle): string {
	if (style === 'none') return '';

	const separator_map: Record<SeparatorStyle, string> = {
		thick: SEPARATORS.left,
		thin: SEPARATORS.left_thin,
		curvy: SEPARATORS.curvy_left,
		angly: SEPARATORS.angly_left,
		angly2: SEPARATORS.angly2_left,
		double_chevron: SEPARATORS.double_chevron_left,
		none: '',
	};

	return separator_map[style] || SEPARATORS.left;
}

/**
 * Left-facing separator. Used when the segment on the left is transparent:
 * the glyph is filled with the *next* (right) segment's colour and pointed
 * left, so the transparent segment's own area keeps the terminal background
 * rather than being filled with a foreground colour.
 *
 * `from_color` is the glyph fill (the next segment's colour as a foreground
 * code); `to_color` is the cell background (the transparent segment's bg).
 */
export function create_styled_separator_left(
	from_color: string,
	to_color = '',
	style: SeparatorStyle = 'thick',
): string {
	if (style === 'none') return '';

	const separator_char = get_separator_char_left(style);
	return `${to_color}${from_color}${separator_char}${ANSI_RESET}`;
}
