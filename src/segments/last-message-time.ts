import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	ClaudeStatusInput,
	LastMessageTimeOptions,
	SegmentData,
	StatuslineConfig,
} from '../types';
import { ANSI_BG_DEFAULT, ANSI_FG_DEFAULT } from '../utils/ansi';
import { hex_to_ansi, pick_fg_for_hex_bg } from '../utils/colors';
import { get_symbol } from '../utils/symbols';
import { BaseSegment } from './base';

const DEFAULTS = {
	cache_warn_minutes: 5,
	color_warm_fg: 'terminal' as const,
	color_cold_bg: '#dc2626',
	color_cold_fg: 'auto' as const,
} satisfies Required<LastMessageTimeOptions>;

function resolve_fg_ansi(fg_config: string, bg_hex: string): string {
	if (fg_config === 'auto') {
		return hex_to_ansi(pick_fg_for_hex_bg(bg_hex), false);
	}
	if (fg_config === 'terminal') {
		return ANSI_FG_DEFAULT;
	}
	return hex_to_ansi(fg_config, false);
}

export class LastMessageTimeSegment extends BaseSegment {
	name = 'last_message_time';

	build(
		data: ClaudeStatusInput,
		config: StatuslineConfig,
	): SegmentData | null {
		const style_override = this.getSegmentConfig(config);
		const opts = this.resolve_options(config);
		const clock_icon = get_symbol('clock', style_override?.icons);

		const timestamp = this.read_last_timestamp(data);

		const raw_content = timestamp
			? `${clock_icon} ${this.format_hhmm(timestamp)}`
			: `${clock_icon} -`;

		const content = this.finalize_content(
			raw_content,
			config,
			style_override,
		);

		const is_cold =
			timestamp !== null &&
			Date.now() - timestamp.getTime() >=
				opts.cache_warn_minutes * 60_000;

		return this.build_segment_data(
			content,
			is_cold,
			opts,
			config,
			style_override,
		);
	}

	private build_segment_data(
		content: string,
		is_cold: boolean,
		opts: Required<LastMessageTimeOptions>,
		config: StatuslineConfig,
		style_override: ReturnType<typeof this.getSegmentConfig>,
	): SegmentData {
		const configured_sep_style =
			style_override?.separator?.style ||
			config.separators.last_message_time ||
			'thick';

		if (!is_cold) {
			// Warm — transparent background, no right separator
			const fg = resolve_fg_ansi(opts.color_warm_fg, '');
			return {
				content,
				bg_color: style_override?.bg_color
					? hex_to_ansi(style_override.bg_color, true)
					: ANSI_BG_DEFAULT,
				fg_color: style_override?.fg_color
					? hex_to_ansi(style_override.fg_color, false)
					: fg,
				separator_from_color: style_override?.separator?.color
					? hex_to_ansi(style_override.separator.color, false)
					: ANSI_FG_DEFAULT,
				separator_style: style_override?.separator?.style ?? 'none',
			};
		}

		// Cold — coloured background signals that cache has likely expired
		const bg_hex = opts.color_cold_bg;
		const effective_bg_hex = style_override?.bg_color ?? bg_hex;

		return {
			content,
			bg_color: style_override?.bg_color
				? hex_to_ansi(style_override.bg_color, true)
				: hex_to_ansi(bg_hex, true),
			fg_color: style_override?.fg_color
				? hex_to_ansi(style_override.fg_color, false)
				: resolve_fg_ansi(opts.color_cold_fg, effective_bg_hex),
			separator_from_color: style_override?.separator?.color
				? hex_to_ansi(style_override.separator.color, false)
				: hex_to_ansi(effective_bg_hex, false),
			separator_style: configured_sep_style,
		};
	}

	private resolve_options(
		config: StatuslineConfig,
	): Required<LastMessageTimeOptions> {
		const segment = config.segment_config?.segments?.find(
			(s) => s.type === 'last_message_time',
		);
		const o = segment?.last_message_time_options ?? {};

		return {
			cache_warn_minutes:
				o.cache_warn_minutes ?? DEFAULTS.cache_warn_minutes,
			color_warm_fg: o.color_warm_fg ?? DEFAULTS.color_warm_fg,
			color_cold_bg: o.color_cold_bg ?? DEFAULTS.color_cold_bg,
			color_cold_fg: o.color_cold_fg ?? DEFAULTS.color_cold_fg,
		};
	}

	private format_hhmm(date: Date): string {
		const hh = date.getHours().toString().padStart(2, '0');
		const mm = date.getMinutes().toString().padStart(2, '0');
		return `${hh}:${mm}`;
	}

	private read_last_timestamp(
		data: ClaudeStatusInput,
	): Date | null {
		if (!data.session_id) return null;

		const session_file = path.join(
			process.env.HOME || '',
			'.claude/projects',
			data.workspace.current_dir.replace(/\//g, '-'),
			`${data.session_id}.jsonl`,
		);

		try {
			const content = fs.readFileSync(session_file, 'utf8');
			const lines = content.trim().split('\n');

			for (let i = lines.length - 1; i >= 0; i--) {
				try {
					const entry = JSON.parse(lines[i]);
					if (entry.type !== 'assistant') continue;
					if (!entry.timestamp) continue;

					const date = new Date(entry.timestamp);
					if (!isNaN(date.getTime())) return date;
				} catch {
					// Skip malformed lines
				}
			}

			return null;
		} catch {
			return null;
		}
	}
}
