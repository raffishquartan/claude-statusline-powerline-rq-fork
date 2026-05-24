import '../../segments'; // Auto-register segments
import { segmentRegistry } from '../../core/registry';
import {
	LastMessageTimeOptions,
	SegmentStyleConfig,
	StatuslineConfig,
} from '../../types';
import { hex_to_ansi } from '../../utils/colors';
import {
	assistant_timestamp_entry,
	missing_session_data,
	with_session_jsonl,
} from './jsonl-fixture';

const ANSI_BG_DEFAULT = '\x1b[49m';
const RED_BG = hex_to_ansi('#dc2626', true);

function make_config(
	options?: LastMessageTimeOptions,
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
			last_message_time: 'thick',
		},
		segment_config: {
			segments: [
				{
					type: 'last_message_time',
					last_message_time_options: options,
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

function run_last_message_time_segment_tests(): boolean {
	console.log('🧪 Running LastMessageTimeSegment tests...\n');

	const segment = segmentRegistry.get_segment('last_message_time');
	if (!segment) {
		console.log('❌ FAIL: last_message_time segment not registered');
		return false;
	}

	// Test 1: registered
	console.log('Test 1: last_message_time segment is registered');
	console.log('✅ PASS: last_message_time segment is registered');

	// Test 2: no data → dash, transparent, no separator
	console.log('\nTest 2: missing session file → dash + transparent');
	const no_data = segment.build(
		missing_session_data(),
		make_config(),
	);
	if (!no_data || !no_data.content.includes('-')) {
		console.log('❌ FAIL: expected dash, got', no_data?.content);
		return false;
	}
	if (
		no_data.bg_color !== ANSI_BG_DEFAULT ||
		no_data.separator_style !== 'none'
	) {
		console.log(
			'❌ FAIL: no-data should be transparent w/ none separator, got',
			no_data.bg_color,
			no_data.separator_style,
		);
		return false;
	}
	console.log(
		'✅ PASS: no data shows dash, transparent, no separator',
	);

	// Test 3: warm (2 min ago) → transparent, separator none, HH:MM shown
	console.log('\nTest 3: warm (2 min ago) → transparent + HH:MM');
	const warm_ts = new Date(Date.now() - 2 * 60_000);
	const warm = with_session_jsonl(
		[assistant_timestamp_entry(warm_ts)],
		(data) => segment.build(data, make_config()),
	);
	if (!warm) {
		console.log('❌ FAIL: expected segment data');
		return false;
	}
	if (!warm.content.includes(expected_hhmm(warm_ts))) {
		console.log(
			`❌ FAIL: expected ${expected_hhmm(warm_ts)}, got`,
			warm.content,
		);
		return false;
	}
	if (
		warm.bg_color !== ANSI_BG_DEFAULT ||
		warm.separator_style !== 'none'
	) {
		console.log('❌ FAIL: warm should be transparent, got', warm);
		return false;
	}
	console.log(
		'✅ PASS: warm shows HH:MM, transparent, separator none',
	);

	// Test 4: cold (10 min ago) → red bg, configured separator
	console.log('\nTest 4: cold (10 min ago) → red bg');
	const cold_ts = new Date(Date.now() - 10 * 60_000);
	const cold = with_session_jsonl(
		[assistant_timestamp_entry(cold_ts)],
		(data) => segment.build(data, make_config()),
	);
	if (!cold || !cold.content.includes(expected_hhmm(cold_ts))) {
		console.log(
			`❌ FAIL: expected ${expected_hhmm(cold_ts)}, got`,
			cold?.content,
		);
		return false;
	}
	if (cold.bg_color !== RED_BG || cold.separator_style !== 'thick') {
		console.log(
			'❌ FAIL: cold should be red bg w/ thick separator, got',
			cold.bg_color,
			cold.separator_style,
		);
		return false;
	}
	console.log('✅ PASS: cold shows red bg, thick separator');

	// Test 5: custom cache_warn_minutes makes a 3-min-old message cold
	console.log(
		'\nTest 5: cache_warn_minutes=1 → 3-min message is cold',
	);
	const recent_ts = new Date(Date.now() - 3 * 60_000);
	const custom = with_session_jsonl(
		[assistant_timestamp_entry(recent_ts)],
		(data) =>
			segment.build(data, make_config({ cache_warn_minutes: 1 })),
	);
	if (!custom || custom.bg_color !== RED_BG) {
		console.log(
			'❌ FAIL: with 1-min threshold a 3-min message should be cold, got',
			custom?.bg_color,
		);
		return false;
	}
	console.log('✅ PASS: configurable threshold honoured');

	// Test 6: string separator shorthand in warm state → curvy
	// Regression: "separator": "curvy" was silently ignored, leaving the
	// warm state at 'none' (no separator rendered).
	console.log(
		'\nTest 6: string separator override → applied in warm state',
	);
	const warm_string_sep = with_session_jsonl(
		[assistant_timestamp_entry(new Date(Date.now() - 1 * 60_000))],
		(data) =>
			segment.build(
				data,
				make_config(undefined, { separator: 'curvy' }),
			),
	);
	if (
		!warm_string_sep ||
		warm_string_sep.separator_style !== 'curvy'
	) {
		console.log(
			'❌ FAIL: string separator should yield "curvy", got',
			warm_string_sep?.separator_style,
		);
		return false;
	}
	console.log('✅ PASS: string "curvy" applied in warm state');

	console.log('\n✅ All LastMessageTimeSegment tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_last_message_time_segment_tests();
	process.exit(success ? 0 : 1);
}

export { run_last_message_time_segment_tests };
