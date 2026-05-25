import { ClaudeStatusInput, StatuslineConfig } from '../types';
import { BaseSegment, SegmentData } from './base';

export class RateLimitsSegment extends BaseSegment {
	name = 'rate_limits';

	build(
		data: ClaudeStatusInput,
		config: StatuslineConfig,
	): SegmentData {
		const { style_override, get_icon } = this.setup_segment(config);
		const warning_icon = get_icon('warning');

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
		// segment, so its slot in the bar is stable from the start.
		const text = parts.length > 0 ? parts.join(' | ') : 'waiting for data';

		const content = this.finalize_content(
			`${warning_icon} ${text}`,
			config,
			style_override,
		);

		const theme = config.current_theme?.segments.rate_limits;

		return this.create_segment_with_fallback(
			content,
			theme,
			'session',
			config.separators.rate_limits || config.separators.session,
			style_override,
		);
	}
}
