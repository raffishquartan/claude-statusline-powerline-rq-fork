import {
	ClaudeStatusInput,
	RateLimitsOptions,
	SegmentData,
	StatuslineConfig,
} from '../types';
import { ANSI_BG_DEFAULT, ANSI_FG_DEFAULT } from '../utils/ansi';
import { hex_to_ansi, pick_fg_for_hex_bg } from '../utils/colors';
import { get_symbol } from '../utils/symbols';
import { BaseSegment } from './base';

const DEFAULTS = {
	threshold_warn: 70,
	threshold_danger: 85,
	color_normal_fg: 'terminal' as const,
	color_warn_bg: '#d97706',
	color_warn_fg: 'auto' as const,
	color_danger_bg: '#dc2626',
	color_danger_fg: 'auto' as const,
} satisfies Required<RateLimitsOptions>;

function resolve_fg_ansi(fg_config: string, bg_hex: string): string {
	if (fg_config === 'auto') {
		return hex_to_ansi(pick_fg_for_hex_bg(bg_hex), false);
	}
	if (fg_config === 'terminal') {
		return ANSI_FG_DEFAULT;
	}
	return hex_to_ansi(fg_config, false);
}

export class RateLimitsSegment extends BaseSegment {
	name = 'rate_limits';

	build(
		data: ClaudeStatusInput,
		config: StatuslineConfig,
	): SegmentData {
		const style_override = this.getSegmentConfig(config);
		const opts = this.resolve_options(config);
		const warning_icon = get_symbol('warning', style_override?.icons);

		const five_hour = data.rate_limits?.five_hour;
		const seven_day = data.rate_limits?.seven_day;

		const parts: string[] = [];
		if (five_hour) {
			parts.push(`5h: ${Math.round(five_hour.used_percentage)}%`);
		}
		if (seven_day) {
			parts.push(`7d: ${Math.round(seven_day.used_percentage)}%`);
		}

		// Rate limit data only arrives with the first API response of a
		// session; until then show a placeholder rather than hiding the
		// segment, so its slot in the bar is stable from session start.
		const text =
			parts.length > 0 ? parts.join(' | ') : 'waiting for data';

		const content = this.finalize_content(
			`${warning_icon} ${text}`,
			config,
			style_override,
		);

		// State is driven by the higher of the two windows (0 when no data).
		const max_pct = Math.max(
			five_hour?.used_percentage ?? 0,
			seven_day?.used_percentage ?? 0,
		);

		return this.build_segment_data(
			content,
			max_pct,
			opts,
			config,
			style_override,
		);
	}

	private build_segment_data(
		content: string,
		max_pct: number,
		opts: Required<RateLimitsOptions>,
		config: StatuslineConfig,
		style_override: ReturnType<typeof this.getSegmentConfig>,
	): SegmentData {
		const configured_sep_style =
			style_override?.separator?.style ||
			config.separators.rate_limits ||
			config.separators.session ||
			'thick';

		const is_danger = max_pct > opts.threshold_danger;
		const is_warn = !is_danger && max_pct >= opts.threshold_warn;
		const is_normal = !is_danger && !is_warn;

		if (is_normal) {
			// Transparent — float on the terminal background
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
				separator_style: style_override?.separator?.style ?? 'none',
			};
		}

		const bg_hex = is_danger
			? opts.color_danger_bg
			: opts.color_warn_bg;
		const fg_config = is_danger
			? opts.color_danger_fg
			: opts.color_warn_fg;
		const effective_bg_hex = style_override?.bg_color ?? bg_hex;

		return {
			content,
			bg_color: style_override?.bg_color
				? hex_to_ansi(style_override.bg_color, true)
				: hex_to_ansi(bg_hex, true),
			fg_color: style_override?.fg_color
				? hex_to_ansi(style_override.fg_color, false)
				: resolve_fg_ansi(fg_config, effective_bg_hex),
			separator_from_color: style_override?.separator?.color
				? hex_to_ansi(style_override.separator.color, false)
				: hex_to_ansi(effective_bg_hex, false),
			separator_style: configured_sep_style,
		};
	}

	private resolve_options(
		config: StatuslineConfig,
	): Required<RateLimitsOptions> {
		const segment = config.segment_config?.segments?.find(
			(s) => s.type === 'rate_limits',
		);
		const o = segment?.rate_limits_options ?? {};

		return {
			threshold_warn: o.threshold_warn ?? DEFAULTS.threshold_warn,
			threshold_danger:
				o.threshold_danger ?? DEFAULTS.threshold_danger,
			color_normal_fg: o.color_normal_fg ?? DEFAULTS.color_normal_fg,
			color_warn_bg: o.color_warn_bg ?? DEFAULTS.color_warn_bg,
			color_warn_fg: o.color_warn_fg ?? DEFAULTS.color_warn_fg,
			color_danger_bg: o.color_danger_bg ?? DEFAULTS.color_danger_bg,
			color_danger_fg: o.color_danger_fg ?? DEFAULTS.color_danger_fg,
		};
	}
}
