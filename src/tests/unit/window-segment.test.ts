import '../../segments'; // Auto-register segments
import { segmentRegistry } from '../../core/registry';
import { StatuslineConfig, WindowSegmentOptions } from '../../types';
import { hex_to_ansi } from '../../utils/colors';
import {
	assistant_usage_entry,
	missing_session_data,
	with_session_jsonl,
} from './jsonl-fixture';

const ANSI_BG_DEFAULT = '\x1b[49m';
const AMBER_BG = hex_to_ansi('#ea580c', true);
const RED_BG = hex_to_ansi('#dc2626', true);

function make_config(
	window_options?: WindowSegmentOptions,
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
			window: 'thick',
		},
		segment_config: {
			segments: [{ type: 'window', window_options }],
		},
	};
}

function run_window_segment_tests(): boolean {
	console.log('🧪 Running WindowSegment tests...\n');

	const segment = segmentRegistry.get_segment('window');
	if (!segment) {
		console.log('❌ FAIL: window segment not registered');
		return false;
	}

	// Test 1: registered
	console.log('Test 1: window segment is registered');
	console.log('✅ PASS: window segment is registered');

	// Test 2: no data → dash, transparent bg, no separator
	console.log('\nTest 2: missing session file → dash + transparent');
	const no_data = segment.build(
		missing_session_data(),
		make_config(),
	);
	if (!no_data) {
		console.log('❌ FAIL: expected segment data, got null');
		return false;
	}
	if (!no_data.content.includes('-')) {
		console.log('❌ FAIL: expected dash, got', no_data.content);
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

	// Test 3: normal state (10%) → transparent, separator 'none'
	console.log('\nTest 3: normal state (10%) → transparent');
	const normal = with_session_jsonl(
		[
			assistant_usage_entry('claude-sonnet-4-6', {
				input_tokens: 20000,
			}),
		],
		(data) => segment.build(data, make_config()),
	);
	if (!normal) {
		console.log('❌ FAIL: expected segment data');
		return false;
	}
	if (!normal.content.includes('~10%')) {
		console.log('❌ FAIL: expected ~10%, got', normal.content);
		return false;
	}
	if (
		normal.bg_color !== ANSI_BG_DEFAULT ||
		normal.separator_style !== 'none'
	) {
		console.log('❌ FAIL: normal should be transparent, got', normal);
		return false;
	}
	console.log('✅ PASS: 10% → ~10%, transparent, separator none');

	// Test 4: warn state (60%) → amber bg, configured separator
	console.log('\nTest 4: warn state (60%) → amber bg');
	const warn = with_session_jsonl(
		[
			assistant_usage_entry('claude-sonnet-4-6', {
				input_tokens: 120000,
			}),
		],
		(data) => segment.build(data, make_config()),
	);
	if (!warn || !warn.content.includes('~60%')) {
		console.log('❌ FAIL: expected ~60%, got', warn?.content);
		return false;
	}
	if (
		warn.bg_color !== AMBER_BG ||
		warn.separator_style !== 'thick'
	) {
		console.log(
			'❌ FAIL: warn should be amber w/ thick separator, got',
			warn.bg_color,
			warn.separator_style,
		);
		return false;
	}
	console.log('✅ PASS: 60% → amber bg, thick separator');

	// Test 5: danger state (85%) → red bg
	console.log('\nTest 5: danger state (85%) → red bg');
	const danger = with_session_jsonl(
		[
			assistant_usage_entry('claude-sonnet-4-6', {
				input_tokens: 170000,
			}),
		],
		(data) => segment.build(data, make_config()),
	);
	if (!danger || !danger.content.includes('~85%')) {
		console.log('❌ FAIL: expected ~85%, got', danger?.content);
		return false;
	}
	if (danger.bg_color !== RED_BG) {
		console.log(
			'❌ FAIL: danger should be red bg, got',
			danger.bg_color,
		);
		return false;
	}
	console.log('✅ PASS: 85% → red bg');

	// Test 6: unknown model → ? suffix on percent
	console.log('\nTest 6: unknown model → "?" suffix');
	const unknown = with_session_jsonl(
		[
			assistant_usage_entry('gpt-mystery-model', {
				input_tokens: 20000,
			}),
		],
		(data) => segment.build(data, make_config()),
	);
	if (!unknown || !unknown.content.includes('%?')) {
		console.log(
			'❌ FAIL: expected "%?" for unknown model, got',
			unknown?.content,
		);
		return false;
	}
	console.log('✅ PASS: unknown model shows ~10%?');

	// Test 7: show_tokens formatting (sub-1M, round-up, ≥1M)
	console.log('\nTest 7: show_tokens formatting');
	const tokens_opts: WindowSegmentOptions = {
		show_percent: false,
		show_tokens: true,
	};
	const sub_1m = with_session_jsonl(
		[
			assistant_usage_entry('claude-sonnet-4-6', {
				input_tokens: 120000,
			}),
		],
		(data) => segment.build(data, make_config(tokens_opts)),
	);
	if (!sub_1m || !sub_1m.content.includes('120k / 200k')) {
		console.log(
			'❌ FAIL: expected "120k / 200k", got',
			sub_1m?.content,
		);
		return false;
	}
	console.log('✅ PASS (sub-1M): 120k / 200k');

	const round_up = with_session_jsonl(
		[
			assistant_usage_entry('claude-sonnet-4-6', {
				input_tokens: 100001,
			}),
		],
		(data) => segment.build(data, make_config(tokens_opts)),
	);
	if (!round_up || !round_up.content.includes('101k / 200k')) {
		console.log(
			'❌ FAIL: 100001 should round up to 101k, got',
			round_up?.content,
		);
		return false;
	}
	console.log('✅ PASS (round-up): 100001 → 101k');

	const over_1m = with_session_jsonl(
		[
			assistant_usage_entry('claude-opus-4-7', {
				input_tokens: 1_500_000,
			}),
		],
		(data) => segment.build(data, make_config(tokens_opts)),
	);
	if (!over_1m || !over_1m.content.includes('1.5M / 1M')) {
		console.log(
			'❌ FAIL: expected "1.5M / 1M", got',
			over_1m?.content,
		);
		return false;
	}
	console.log('✅ PASS (≥1M): 1.5M / 1M');

	// Test 8: both display toggles off → percent shown anyway
	console.log('\nTest 8: both toggles off → percent still shown');
	const both_off = with_session_jsonl(
		[
			assistant_usage_entry('claude-sonnet-4-6', {
				input_tokens: 20000,
			}),
		],
		(data) =>
			segment.build(
				data,
				make_config({ show_percent: false, show_tokens: false }),
			),
	);
	if (!both_off || !both_off.content.includes('%')) {
		console.log(
			'❌ FAIL: percent should show when both toggles off, got',
			both_off?.content,
		);
		return false;
	}
	console.log('✅ PASS: percent shown as fallback');

	console.log('\n✅ All WindowSegment tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_window_segment_tests();
	process.exit(success ? 0 : 1);
}

export { run_window_segment_tests };
