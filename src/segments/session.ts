import {
	ClaudeStatusInput,
	SessionUsage,
	StatuslineConfig,
} from '../types';
import { get_usage_db } from '../utils/usage-db';
import { BaseSegment, SegmentData } from './base';

export class SessionSegment extends BaseSegment {
	name = 'session';

	build(
		data: ClaudeStatusInput,
		config: StatuslineConfig,
	): SegmentData | null {
		// First try to get session data from database
		const usage = this.get_session_usage(data);
		if (!usage) {
			return this.no_data_yet(config);
		}

		const cost_str =
			usage.totalCost < 0.01
				? '< $0.01'
				: `$${usage.totalCost.toFixed(2)}`;

		const { style_override, get_icon } = this.setup_segment(config);
		const theme = config.current_theme?.segments.session;
		const cost_icon = get_icon('cost');
		const raw_content = `${cost_icon} ${cost_str}`;
		const content = this.finalize_content(
			raw_content,
			config,
			style_override,
		);

		return this.create_segment_with_fallback(
			content,
			theme,
			'session',
			config.separators.session,
			style_override,
		);
	}

	private get_session_usage(
		data: ClaudeStatusInput,
	): SessionUsage | null {
		try {
			// Query database for session data
			const db = get_usage_db();
			const session = db.get_session(data.session_id);

			if (session) {
				// Convert database record to SessionUsage format
				return {
					totalInputTokens: session.input_tokens,
					totalOutputTokens: session.output_tokens,
					totalCacheTokens: session.cache_tokens,
					totalCost: session.cost,
					modelUsed: session.model,
					sessionDuration: this.calculate_session_duration(
						session.start_time,
						session.end_time,
					),
				};
			}

			// No session found in database
			return null;
		} catch (error) {
			// Database error
			return null;
		}
	}

	private no_data_yet(config: StatuslineConfig): SegmentData {
		const { style_override, get_icon } = this.setup_segment(config);
		const theme = config.current_theme?.segments.session;
		const cost_icon = get_icon('cost');
		const content = this.finalize_content(
			`${cost_icon} no data`,
			config,
			style_override,
		);
		return this.create_segment_with_fallback(
			content,
			theme,
			'session',
			config.separators.session,
			style_override,
		);
	}

	private calculate_session_duration(
		start_time: string,
		end_time?: string,
	): number {
		if (!start_time || !end_time) {
			return 0;
		}

		const start = new Date(start_time);
		const end = new Date(end_time);
		return Math.round(
			(end.getTime() - start.getTime()) / (1000 * 60),
		); // duration in minutes
	}
}
