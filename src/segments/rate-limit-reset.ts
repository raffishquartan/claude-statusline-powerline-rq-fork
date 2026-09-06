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
			? `${hourglass_icon} ${this.format_hhmm(new Date(window_data.resets_at * 1000))}`
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

	private format_hhmm(date: Date): string {
		const hh = date.getHours().toString().padStart(2, '0');
		const mm = date.getMinutes().toString().padStart(2, '0');
		return `${hh}:${mm}`;
	}
}
