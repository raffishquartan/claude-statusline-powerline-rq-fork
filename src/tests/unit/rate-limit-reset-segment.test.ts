import '../../segments'; // Auto-register segments
import { segmentRegistry } from '../../core/registry';
import {
	ClaudeStatusInput,
	RateLimitResetOptions,
	SegmentStyleConfig,
	StatuslineConfig,
} from '../../types';
import { hex_to_ansi } from '../../utils/colors';

const ANSI_BG_DEFAULT = '\x1b[49m';

function make_config(
	options?: RateLimitResetOptions,
	style?: SegmentStyleConfig,
): StatuslineConfig {
	return {
		color_theme: 'dark',
		separators: {
			model: 'thick',
			directory: 'thick',
			git: {
				clean: 'thick',
				dirty: 'thick',
				ahead: 'thick',
				behind: 'thick',
				conflicts: 'thick',
				staged: 'thick',
				untracked: 'thick',
			},
			session: 'thick',
			context: 'thick',
			rate_limit_reset: 'thick',
		},
		segment_config: {
			segments: [
				{
					type: 'rate_limit_reset',
					rate_limit_reset_options: options,
					style,
				},
			],
		},
	};
}

function expected_hhmm(date: Date): string {
	const hh = date.getHours().toString().padStart(2, '0');
	const mm = date.getMinutes().toString().padStart(2, '0');
	return `${hh}:${mm}`;
}

function with_rate_limits(
	rate_limits: NonNullable<ClaudeStatusInput['rate_limits']>,
): ClaudeStatusInput {
	return {
		session_id: 'test-session',
		model: { display_name: 'Sonnet 4' },
		workspace: { current_dir: '/test' },
		rate_limits,
	};
}

function no_rate_limits(): ClaudeStatusInput {
	return {
		session_id: 'test-session',
		model: { display_name: 'Sonnet 4' },
		workspace: { current_dir: '/test' },
	};
}

function run_rate_limit_reset_segment_tests(): boolean {
	console.log('🧪 Running RateLimitResetSegment tests...\n');

	const segment = segmentRegistry.get_segment('rate_limit_reset');
	if (!segment) {
		console.log('❌ FAIL: rate_limit_reset segment not registered');
		return false;
	}

	// Test 1: registered
	console.log('Test 1: rate_limit_reset segment is registered');
	console.log('✅ PASS: rate_limit_reset segment is registered');

	// Test 2: default window (five_hour) renders HH:MM from resets_at
	console.log('\nTest 2: default window shows five_hour reset time');
	const five_hour_reset = new Date(Date.now() + 3 * 60 * 60_000);
	const default_window = segment.build(
		with_rate_limits({
			five_hour: {
				used_percentage: 23.5,
				resets_at: Math.floor(five_hour_reset.getTime() / 1000),
			},
			seven_day: {
				used_percentage: 41.2,
				resets_at: Math.floor(Date.now() / 1000) + 999_999,
			},
		}),
		make_config(),
	);
	if (!default_window) {
		console.log('❌ FAIL: expected segment data, got null');
		return false;
	}
	if (
		!default_window.content.includes(expected_hhmm(five_hour_reset))
	) {
		console.log(
			`❌ FAIL: expected ${expected_hhmm(five_hour_reset)}, got`,
			default_window.content,
		);
		return false;
	}
	console.log(
		'✅ PASS: default window shows the five_hour reset time',
	);

	// Test 3: window: 'seven_day' shows a day count instead of a clock time
	// (a bare HH:MM is ambiguous when the reset could be days away)
	console.log(
		'\nTest 3: window="seven_day" shows "N days" instead of HH:MM',
	);
	const seven_day_reset_ms = Date.now() + 5 * 24 * 60 * 60_000;
	const seven_day_window = segment.build(
		with_rate_limits({
			five_hour: {
				used_percentage: 23.5,
				resets_at: Math.floor(Date.now() / 1000) + 100,
			},
			seven_day: {
				used_percentage: 41.2,
				resets_at: Math.floor(seven_day_reset_ms / 1000),
			},
		}),
		make_config({ window: 'seven_day' }),
	);
	if (
		!seven_day_window ||
		!seven_day_window.content.includes('5 days')
	) {
		console.log(
			'❌ FAIL: expected "5 days", got',
			seven_day_window?.content,
		);
		return false;
	}
	console.log('✅ PASS: window="seven_day" shows "5 days"');

	// Test 3b: partial days round up (2.1 days away → "3 days")
	console.log('\nTest 3b: partial day rounds up');
	const partial_day_window = segment.build(
		with_rate_limits({
			seven_day: {
				used_percentage: 41.2,
				resets_at: Math.floor(
					(Date.now() + 2.1 * 24 * 60 * 60_000) / 1000,
				),
			},
		}),
		make_config({ window: 'seven_day' }),
	);
	if (
		!partial_day_window ||
		!partial_day_window.content.includes('3 days')
	) {
		console.log(
			'❌ FAIL: expected "3 days" (rounded up), got',
			partial_day_window?.content,
		);
		return false;
	}
	console.log('✅ PASS: 2.1 days rounds up to "3 days"');

	// Test 4: no rate_limits block at all → dash placeholder
	console.log('\nTest 4: no rate_limits data → dash placeholder');
	const no_data = segment.build(no_rate_limits(), make_config());
	if (!no_data || !no_data.content.includes('-')) {
		console.log('❌ FAIL: expected dash, got', no_data?.content);
		return false;
	}
	console.log('✅ PASS: no rate_limits data shows dash');

	// Test 5: rate_limits present but the configured window's entry is missing
	console.log(
		'\nTest 5: configured window missing from rate_limits → dash',
	);
	const missing_window = segment.build(
		with_rate_limits({
			five_hour: {
				used_percentage: 10,
				resets_at: Math.floor(Date.now() / 1000) + 100,
			},
		}),
		make_config({ window: 'seven_day' }),
	);
	if (!missing_window || !missing_window.content.includes('-')) {
		console.log(
			'❌ FAIL: expected dash when configured window is absent, got',
			missing_window?.content,
		);
		return false;
	}
	console.log('✅ PASS: missing configured window shows dash');

	// Test 6: always neutral — same transparent styling near and far from reset
	console.log(
		'\nTest 6: neutral styling regardless of proximity to reset',
	);
	const far = segment.build(
		with_rate_limits({
			five_hour: {
				used_percentage: 10,
				resets_at: Math.floor(Date.now() / 1000) + 4 * 60 * 60,
			},
		}),
		make_config(),
	);
	const imminent = segment.build(
		with_rate_limits({
			five_hour: {
				used_percentage: 99,
				resets_at: Math.floor(Date.now() / 1000) + 10,
			},
		}),
		make_config(),
	);
	if (
		!far ||
		!imminent ||
		far.bg_color !== ANSI_BG_DEFAULT ||
		imminent.bg_color !== ANSI_BG_DEFAULT ||
		far.bg_color !== imminent.bg_color ||
		far.fg_color !== imminent.fg_color ||
		far.separator_style !== imminent.separator_style
	) {
		console.log(
			'❌ FAIL: styling should be identical (transparent) regardless of proximity, got',
			far,
			imminent,
		);
		return false;
	}
	console.log(
		'✅ PASS: styling stays neutral and transparent throughout',
	);

	// Test 7: string separator shorthand is honoured (always-rendered state)
	console.log(
		'\nTest 7: string separator override → applied in neutral state',
	);
	const string_sep = segment.build(
		with_rate_limits({
			five_hour: {
				used_percentage: 10,
				resets_at: Math.floor(Date.now() / 1000) + 100,
			},
		}),
		make_config(undefined, { separator: 'curvy' }),
	);
	if (!string_sep || string_sep.separator_style !== 'curvy') {
		console.log(
			'❌ FAIL: string separator should yield "curvy", got',
			string_sep?.separator_style,
		);
		return false;
	}
	console.log('✅ PASS: string "curvy" applied in neutral state');

	console.log('\n✅ All RateLimitResetSegment tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_rate_limit_reset_segment_tests();
	process.exit(success ? 0 : 1);
}

export { run_rate_limit_reset_segment_tests };
