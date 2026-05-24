import { load_config } from '../config';
import {
	create_styled_separator,
	create_styled_separator_left,
} from '../separators/styles';
import {
	ClaudeStatusInput,
	LineSegments,
	SegmentData,
	SeparatorStyle,
	StatuslineConfig,
} from '../types';
import {
	ANSI_RESET,
	ansi_bg_to_fg,
	is_transparent_bg,
} from '../utils/ansi';
import { segmentRegistry } from './registry';

function create_segment(
	content: string,
	bg_color: string,
	fg_color: string,
): string {
	return `${bg_color}${fg_color} ${content} ${ANSI_RESET}`;
}

/**
 * Render the separator that follows `current`. A powerline separator's
 * appearance depends on both adjacent backgrounds:
 *
 * - current coloured  → normal right-facing glyph filled with current's colour
 * - current transparent, next coloured → left-facing glyph filled with next's
 *   colour on the transparent cell, so the transparent segment's portion stays
 *   the terminal background instead of a foreground fill
 * - both transparent, or transparent and last → no glyph (nothing to transition)
 */
export function render_separator(
	current: SegmentData,
	next?: SegmentData,
): string {
	const style = (current.separator_style || 'thick') as SeparatorStyle;

	if (is_transparent_bg(current.bg_color)) {
		if (!next || is_transparent_bg(next.bg_color)) return '';
		return create_styled_separator_left(
			ansi_bg_to_fg(next.bg_color),
			current.bg_color,
			style,
		);
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
		output.push(render_separator(current, next));
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
		output.push(render_separator(current, next));
	}

	return output.join('');
}
