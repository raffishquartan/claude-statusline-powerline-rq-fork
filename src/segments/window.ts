import * as fs from 'node:fs';
import * as path from 'node:path';
import {
	ClaudeStatusInput,
	SegmentData,
	StatuslineConfig,
	WindowSegmentOptions,
} from '../types';
import { hex_to_ansi, pick_fg_for_hex_bg } from '../utils/colors';
import { get_context_window } from '../utils/model-context';
import { get_symbol } from '../utils/symbols';
import { BaseSegment } from './base';

// ─── ANSI terminal-default codes ───────────────────────────────────────────
const ANSI_BG_DEFAULT = '\x1b[49m'; // reset bg to terminal default
const ANSI_FG_DEFAULT = '\x1b[39m'; // reset fg to terminal default

// ─── Defaults ──────────────────────────────────────────────────────────────
const DEFAULTS = {
	show_percent: true,
	show_tokens: false,
	threshold_warn: 51,
	threshold_danger: 80,
	color_normal_fg: 'terminal' as const,
	color_warn_bg: '#ea580c',
	color_warn_fg: 'auto' as const,
	color_danger_bg: '#dc2626',
	color_danger_fg: 'auto' as const,
} satisfies Required<WindowSegmentOptions>;

// ─── Token formatting ───────────────────────────────────────────────────────

/** Round token count UP to nearest 1k (< 1M) or 0.1M (≥ 1M). */
function format_consumed(tokens: number): string {
	if (tokens >= 1_000_000) {
		const raw = Math.ceil(tokens / 100_000) / 10;
		const str = raw.toFixed(1).replace(/\.0$/, '');
		return `${str}M`;
	}
	return `${Math.ceil(tokens / 1_000)}k`;
}

/** Format a context window size (always a clean multiple of 1k from MODEL_PRICING). */
function format_window_size(tokens: number): string {
	if (tokens >= 1_000_000) {
		const m = tokens / 1_000_000;
		return `${m % 1 === 0 ? m.toString() : m.toFixed(1)}M`;
	}
	const k = tokens / 1_000;
	return `${k % 1 === 0 ? k.toString() : k.toFixed(0)}k`;
}

// ─── Colour helpers ─────────────────────────────────────────────────────────

function resolve_fg_ansi(fg_config: string, bg_hex: string): string {
	if (fg_config === 'auto') {
		return hex_to_ansi(pick_fg_for_hex_bg(bg_hex), false);
	}
	if (fg_config === 'terminal') {
		return ANSI_FG_DEFAULT;
	}
	return hex_to_ansi(fg_config, false);
}

// ─── Segment ────────────────────────────────────────────────────────────────

export class WindowSegment extends BaseSegment {
	name = 'window';

	build(
		data: ClaudeStatusInput,
		config: StatuslineConfig,
	): SegmentData | null {
		const style_override = this.getSegmentConfig(config);
		const opts = this.resolve_options(config);

		const entry = this.read_last_entry(data);
		const brain_icon = get_symbol('brain', style_override?.icons);

		// No data yet — show dash in transparent/normal colours
		if (!entry) {
			const content = this.finalize_content(
				`${brain_icon} -`,
				config,
				style_override,
			);
			return this.build_segment_data(
				content,
				-1, // sentinel: always use normal colours
				opts,
				config,
				style_override,
			);
		}

		const { total_tokens, model_id } = entry;
		const { window: ctx_window, known } = get_context_window(model_id);
		const percent = Math.round((total_tokens / ctx_window) * 100);

		const parts: string[] = [];

		if (opts.show_percent) {
			parts.push(known ? `~${percent}%` : `~${percent}%?`);
		}

		if (opts.show_tokens) {
			parts.push(
				`${format_consumed(total_tokens)} / ${format_window_size(ctx_window)}`,
			);
		}

		// If both display options are off, show percent anyway
		if (parts.length === 0) {
			parts.push(known ? `~${percent}%` : `~${percent}%?`);
		}

		const raw_content = `${brain_icon} ${parts.join(' ')}`;
		const content = this.finalize_content(
			raw_content,
			config,
			style_override,
		);

		return this.build_segment_data(
			content,
			percent,
			opts,
			config,
			style_override,
		);
	}

	private build_segment_data(
		content: string,
		percent: number,
		opts: Required<WindowSegmentOptions>,
		config: StatuslineConfig,
		style_override: ReturnType<typeof this.getSegmentConfig>,
	): SegmentData {
		const configured_sep_style =
			style_override?.separator?.style ||
			config.separators.window ||
			'thick';

		const is_danger = percent >= opts.threshold_danger;
		const is_warn = !is_danger && percent >= opts.threshold_warn;
		const is_normal = !is_danger && !is_warn;

		if (is_normal) {
			// Transparent — float on terminal background, no right separator
			const fg = resolve_fg_ansi(opts.color_normal_fg, '');
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
				// 'none' unless user has explicitly overridden separator style
				separator_style: style_override?.separator?.style ?? 'none',
			};
		}

		// Warn or danger: coloured background with readable foreground
		const bg_hex = is_danger
			? opts.color_danger_bg
			: opts.color_warn_bg;
		const fg_config = is_danger
			? opts.color_danger_fg
			: opts.color_warn_fg;

		const bg_ansi = style_override?.bg_color
			? hex_to_ansi(style_override.bg_color, true)
			: hex_to_ansi(bg_hex, true);

		// separator_from_color should match the segment bg so the separator
		// glyph appears as a smooth transition to the next segment
		const effective_bg_hex = style_override?.bg_color ?? bg_hex;
		const sep_fg_ansi = style_override?.separator?.color
			? hex_to_ansi(style_override.separator.color, false)
			: hex_to_ansi(effective_bg_hex, false);

		return {
			content,
			bg_color: bg_ansi,
			fg_color: style_override?.fg_color
				? hex_to_ansi(style_override.fg_color, false)
				: resolve_fg_ansi(fg_config, effective_bg_hex),
			separator_from_color: sep_fg_ansi,
			separator_style: configured_sep_style,
		};
	}

	private resolve_options(
		config: StatuslineConfig,
	): Required<WindowSegmentOptions> {
		const segment = config.segment_config?.segments?.find(
			(s) => s.type === 'window',
		);
		const o = segment?.window_options ?? {};

		return {
			show_percent: o.show_percent ?? DEFAULTS.show_percent,
			show_tokens: o.show_tokens ?? DEFAULTS.show_tokens,
			threshold_warn: o.threshold_warn ?? DEFAULTS.threshold_warn,
			threshold_danger:
				o.threshold_danger ?? DEFAULTS.threshold_danger,
			color_normal_fg:
				o.color_normal_fg ?? DEFAULTS.color_normal_fg,
			color_warn_bg: o.color_warn_bg ?? DEFAULTS.color_warn_bg,
			color_warn_fg: o.color_warn_fg ?? DEFAULTS.color_warn_fg,
			color_danger_bg:
				o.color_danger_bg ?? DEFAULTS.color_danger_bg,
			color_danger_fg:
				o.color_danger_fg ?? DEFAULTS.color_danger_fg,
		};
	}

	private read_last_entry(
		data: ClaudeStatusInput,
	): { total_tokens: number; model_id: string } | null {
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

			// Scan from end to find the most recent assistant entry with usage
			for (let i = lines.length - 1; i >= 0; i--) {
				try {
					const entry = JSON.parse(lines[i]);
					if (entry.type !== 'assistant') continue;

					const msg = entry.message;
					const usage = msg?.usage;
					if (!usage) continue;

					const total_tokens =
						(usage.input_tokens || 0) +
						(usage.cache_read_input_tokens || 0) +
						(usage.cache_creation_input_tokens || 0);

					if (total_tokens === 0) continue;

					// Use model from the JSONL entry so mid-session model
					// changes are reflected correctly
					const model_id =
						msg.model || data.model?.id || '';

					return { total_tokens, model_id };
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
