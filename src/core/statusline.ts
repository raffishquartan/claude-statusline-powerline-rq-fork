import { load_config } from '../config';
import { create_styled_separator } from '../separators/styles';
import {
	ClaudeStatusInput,
	LineSegments,
	SegmentData,
	SeparatorStyle,
	StatuslineConfig,
} from '../types';
import { ANSI_RESET, is_transparent_bg } from '../utils/ansi';
import { hex_to_ansi } from '../utils/colors';
import { segmentRegistry } from './registry';

/**
 * Resolve the foreground ANSI used to fill a transparent segment's separator
 * glyph, from the configured terminal background colour. Returns undefined
 * when none is set, in which case transparent segments emit no separator.
 */
function resolve_transparent_fill(
	config: StatuslineConfig,
): string | undefined {
	return config.terminal_background
		? hex_to_ansi(config.terminal_background, false)
		: undefined;
}

function create_segment(
	content: string,
	bg_color: string,
	fg_color: string,
): string {
	return `${bg_color}${fg_color} ${content} ${ANSI_RESET}`;
}

/**
 * Render the separator that follows `current`.
 *
 * A powerline separator glyph is filled — as a foreground — with the left
 * segment's colour. A transparent (floating) segment's colour is the terminal
 * default background, which has no foreground equivalent. So a transparent
 * segment can only emit a (right-facing) glyph when `transparent_fill` — the
 * configured terminal background colour — is supplied to stand in for it;
 * otherwise it emits nothing and the coloured bar simply begins flat.
 *
 * A coloured segment always uses the normal right-facing glyph filled with its
 * own colour, transitioning to the next segment's background (or the terminal
 * background when it is the last segment).
 */
export function render_separator(
	current: SegmentData,
	next?: SegmentData,
	transparent_fill?: string,
): string {
	const style = (current.separator_style ||
		'thick') as SeparatorStyle;

	if (is_transparent_bg(current.bg_color)) {
		// With a known terminal background we can fill a normal right-facing
		// glyph with it, so a floating segment's separator points the same way
		// as the rest of the bar and its colour matches the terminal. Without
		// one, there is no foreground colour that represents "transparent", so
		// the coloured bar simply begins flat at the next segment.
		if (
			next &&
			!is_transparent_bg(next.bg_color) &&
			transparent_fill
		) {
			return create_styled_separator(
				transparent_fill,
				next.bg_color,
				style,
			);
		}
		return '';
	}

	return create_styled_separator(
		current.separator_from_color,
		next ? next.bg_color : '',
		style,
	);
}

function build_line_segments(
	data: ClaudeStatusInput,
	config: StatuslineConfig,
	line_segments: LineSegments,
): string {
	const segments = [];

	// Build segments in the order specified in the line configuration
	for (const [segment_name, enabled] of Object.entries(
		line_segments,
	)) {
		if (enabled) {
			const segment_builder =
				segmentRegistry.get_segment(segment_name);
			if (segment_builder) {
				const segment = segment_builder.build(data, config);
				if (segment) {
					segments.push(segment);
				}
			}
		}
	}

	// Build output with dynamic separators for this line
	const transparent_fill = resolve_transparent_fill(config);
	const output = [];
	for (let i = 0; i < segments.length; i++) {
		const current = segments[i];
		const next = segments[i + 1];

		// Add the segment content
		output.push(
			create_segment(
				current.content,
				current.bg_color,
				current.fg_color,
			),
		);

		// Add the separator that transitions to the next segment (or the
		// trailing separator when this is the last segment).
		output.push(render_separator(current, next, transparent_fill));
	}

	return output.join('');
}

export function build_statusline(data: ClaudeStatusInput): string {
	const config = load_config();

	// Check if multiline configuration exists in segment_config
	if (
		config.segment_config?.lines &&
		config.segment_config.lines.length > 0
	) {
		// Build multiline output
		const lines = [];
		for (const line_segments of config.segment_config.lines) {
			const line_output = build_line_segments(
				data,
				config,
				line_segments,
			);
			if (line_output) {
				lines.push(line_output);
			}
		}
		return lines.join('\n');
	}

	// Fallback to original single-line behavior
	const enabled_segments =
		segmentRegistry.get_enabled_segments(config);
	const segments = [];

	// Build each segment
	for (const segment_builder of enabled_segments) {
		const segment = segment_builder.build(data, config);
		if (segment) {
			segments.push(segment);
		}
	}

	// Build output with dynamic separators
	const transparent_fill = resolve_transparent_fill(config);
	const output = [];
	for (let i = 0; i < segments.length; i++) {
		const current = segments[i];
		const next = segments[i + 1];

		// Add the segment content
		output.push(
			create_segment(
				current.content,
				current.bg_color,
				current.fg_color,
			),
		);

		// Add the separator that transitions to the next segment (or the
		// trailing separator when this is the last segment).
		output.push(render_separator(current, next, transparent_fill));
	}

	return output.join('');
}
