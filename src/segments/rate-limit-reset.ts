import {
	ClaudeStatusInput,
	RateLimitResetOptions,
	SegmentData,
	StatuslineConfig,
} from '../types';
import { ANSI_BG_DEFAULT, ANSI_FG_DEFAULT } from '../utils/ansi';
import { hex_to_ansi } from '../utils/colors';
import { get_symbol } from '../utils/symbols';
import { BaseSegment } from './base';

const DEFAULTS = {
	window: 'five_hour' as const,
} satisfies Required<RateLimitResetOptions>;

export class RateLimitResetSegment extends BaseSegment {
	name = 'rate_limit_reset';

	build(
		data: ClaudeStatusInput,
		config: StatuslineConfig,
	): SegmentData {
		const style_override = this.getSegmentConfig(config);
		const opts = this.resolve_options(config);
		const hourglass_icon = get_symbol(
			'hourglass',
			style_override?.icons,
		);

		const window_data = data.rate_limits?.[opts.window];

		const raw_content = window_data
			? `${hourglass_icon} ${this.format_reset(window_data.resets_at, opts.window)}`
			: `${hourglass_icon} -`;

		const content = this.finalize_content(
			raw_content,
			config,
			style_override,
		);

		// Always neutral — transparent background, no separator unless the
		// user has explicitly overridden it, matching window/last_message_time's
		// transparent (non-threshold) state.
		return {
			content,
			bg_color: style_override?.bg_color
				? hex_to_ansi(style_override.bg_color, true)
				: ANSI_BG_DEFAULT,
			fg_color: style_override?.fg_color
				? hex_to_ansi(style_override.fg_color, false)
				: ANSI_FG_DEFAULT,
			separator_from_color: style_override?.separator?.color
				? hex_to_ansi(style_override.separator.color, false)
				: ANSI_FG_DEFAULT,
			separator_style: style_override?.separator?.style ?? 'none',
		};
	}

	private resolve_options(
		config: StatuslineConfig,
	): Required<RateLimitResetOptions> {
		const segment = config.segment_config?.segments?.find(
			(s) => s.type === 'rate_limit_reset',
		);
		const o = segment?.rate_limit_reset_options ?? {};

		return {
			window: o.window ?? DEFAULTS.window,
		};
	}

	/**
	 * five_hour resets within the same day, so a local HH:MM clock time is
	 * meaningful. seven_day can reset days out, where a bare clock time
	 * (with no date) is ambiguous, so it's shown as a day count instead.
	 */
	private format_reset(
		resets_at: number,
		window: RateLimitResetOptions['window'],
	): string {
		if (window === 'seven_day') {
			return this.format_days_remaining(resets_at);
		}
		return this.format_hhmm(new Date(resets_at * 1000));
	}

	private format_hhmm(date: Date): string {
		const hh = date.getHours().toString().padStart(2, '0');
		const mm = date.getMinutes().toString().padStart(2, '0');
		return `${hh}:${mm}`;
	}

	private format_days_remaining(resets_at: number): string {
		const ms_remaining = resets_at * 1000 - Date.now();
		const days = Math.max(
			0,
			Math.ceil(ms_remaining / (24 * 60 * 60 * 1000)),
		);
		return `${days} days`;
	}
}
