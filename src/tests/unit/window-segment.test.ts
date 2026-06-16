import '../../segments'; // Auto-register segments
import { segmentRegistry } from '../../core/registry';
import {
	ClaudeStatusInput,
	SegmentStyleConfig,
	StatuslineConfig,
	WindowSegmentOptions,
} from '../../types';
import { hex_to_ansi } from '../../utils/colors';

const ANSI_BG_DEFAULT = '\x1b[49m';
const AMBER_BG = hex_to_ansi('#ea580c', true);
const RED_BG = hex_to_ansi('#dc2626', true);

function make_config(
	window_options?: WindowSegmentOptions,
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
			window: 'thick',
		},
		segment_config: {
			segments: [{ type: 'window', window_options, style }],
		},
	};
}

/** ClaudeStatusInput carrying a context_window block with the given values. */
function with_context_window(cw: {
	used_percentage: number;
	context_window_size: number;
	total_input_tokens?: number;
	total_output_tokens?: number;
}): ClaudeStatusInput {
	const total_input_tokens = cw.total_input_tokens ?? 0;
	const total_output_tokens = cw.total_output_tokens ?? 0;
	return {
		session_id: 'test-session',
		model: { display_name: 'Test', id: 'claude-sonnet-4-6' },
		workspace: { current_dir: '/test/project' },
		context_window: {
			total_input_tokens,
			total_output_tokens,
			context_window_size: cw.context_window_size,
			used_percentage: cw.used_percentage,
			remaining_percentage: 100 - cw.used_percentage,
			current_usage: {
				input_tokens: total_input_tokens,
				output_tokens: total_output_tokens,
				cache_creation_input_tokens: 0,
				cache_read_input_tokens: 0,
			},
		},
	};
}

/** ClaudeStatusInput with no context_window block (Claude Code hasn't supplied it). */
function without_context_window(): ClaudeStatusInput {
	return {
		session_id: 'test-session',
		model: { display_name: 'Test', id: 'claude-sonnet-4-6' },
		workspace: { current_dir: '/test/project' },
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

	// Test 2: no context_window → dash, transparent bg, no separator
	console.log('\nTest 2: no context_window → dash + transparent');
	const no_data = segment.build(without_context_window(), make_config());
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
	console.log('✅ PASS: no data shows dash, transparent, no separator');

	// Test 3: normal state (10%) → transparent, separator 'none'
	console.log('\nTest 3: normal state (10%) → transparent');
	const normal = segment.build(
		with_context_window({
			used_percentage: 10,
			context_window_size: 200_000,
		}),
		make_config(),
	);
	if (!normal) {
		console.log('❌ FAIL: expected segment data');
		return false;
	}
	if (!normal.content.includes('10%') || normal.content.includes('~')) {
		console.log('❌ FAIL: expected 10% (no tilde), got', normal.content);
		return false;
	}
	if (
		normal.bg_color !== ANSI_BG_DEFAULT ||
		normal.separator_style !== 'none'
	) {
		console.log('❌ FAIL: normal should be transparent, got', normal);
		return false;
	}
	console.log('✅ PASS: 10% → 10%, transparent, separator none');

	// Test 4: warn state (60%) → amber bg, configured separator
	console.log('\nTest 4: warn state (60%) → amber bg');
	const warn = segment.build(
		with_context_window({
			used_percentage: 60,
			context_window_size: 200_000,
		}),
		make_config(),
	);
	if (!warn || !warn.content.includes('60%') || warn.content.includes('~')) {
		console.log('❌ FAIL: expected 60% (no tilde), got', warn?.content);
		return false;
	}
	if (warn.bg_color !== AMBER_BG || warn.separator_style !== 'thick') {
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
	const danger = segment.build(
		with_context_window({
			used_percentage: 85,
			context_window_size: 200_000,
		}),
		make_config(),
	);
	if (
		!danger ||
		!danger.content.includes('85%') ||
		danger.content.includes('~')
	) {
		console.log('❌ FAIL: expected 85% (no tilde), got', danger?.content);
		return false;
	}
	if (danger.bg_color !== RED_BG) {
		console.log('❌ FAIL: danger should be red bg, got', danger.bg_color);
		return false;
	}
	console.log('✅ PASS: 85% → red bg');

	// Test 6: percent never carries a "?" suffix
	// Window size is authoritative from Claude Code, so there is no
	// model-guessing uncertainty to flag.
	console.log('\nTest 6: percent has no "?" suffix');
	const no_question = segment.build(
		with_context_window({
			used_percentage: 10,
			context_window_size: 1_000_000,
		}),
		make_config(),
	);
	if (!no_question || no_question.content.includes('%?')) {
		console.log(
			'❌ FAIL: percent should not include "?", got',
			no_question?.content,
		);
		return false;
	}
	console.log('✅ PASS: no "?" suffix on percent');

	// Test 7: show_tokens formatting (sub-1M, round-up, ≥1M)
	console.log('\nTest 7: show_tokens formatting');
	const tokens_opts: WindowSegmentOptions = {
		show_percent: false,
		show_tokens: true,
	};
	const sub_1m = segment.build(
		with_context_window({
			used_percentage: 60,
			context_window_size: 200_000,
			total_input_tokens: 120_000,
		}),
		make_config(tokens_opts),
	);
	if (!sub_1m || !sub_1m.content.includes('120k / 200k')) {
		console.log('❌ FAIL: expected "120k / 200k", got', sub_1m?.content);
		return false;
	}
	console.log('✅ PASS (sub-1M): 120k / 200k');

	const round_up = segment.build(
		with_context_window({
			used_percentage: 50,
			context_window_size: 200_000,
			total_input_tokens: 100_001,
		}),
		make_config(tokens_opts),
	);
	if (!round_up || !round_up.content.includes('101k / 200k')) {
		console.log(
			'❌ FAIL: 100001 should round up to 101k, got',
			round_up?.content,
		);
		return false;
	}
	console.log('✅ PASS (round-up): 100001 → 101k');

	const over_1m = segment.build(
		with_context_window({
			used_percentage: 99,
			context_window_size: 1_000_000,
			total_input_tokens: 1_500_000,
		}),
		make_config(tokens_opts),
	);
	if (!over_1m || !over_1m.content.includes('1.5M / 1M')) {
		console.log('❌ FAIL: expected "1.5M / 1M", got', over_1m?.content);
		return false;
	}
	console.log('✅ PASS (≥1M): 1.5M / 1M');

	// Test 8: both display toggles off → percent shown anyway
	console.log('\nTest 8: both toggles off → percent still shown');
	const both_off = segment.build(
		with_context_window({
			used_percentage: 10,
			context_window_size: 200_000,
		}),
		make_config({ show_percent: false, show_tokens: false }),
	);
	if (!both_off || !both_off.content.includes('%')) {
		console.log(
			'❌ FAIL: percent should show when both toggles off, got',
			both_off?.content,
		);
		return false;
	}
	console.log('✅ PASS: percent shown as fallback');

	// Test 9: string separator shorthand in transparent state → curvy
	// Regression: "separator": "curvy" was silently ignored, leaving the
	// transparent state at 'none' (no separator rendered at all).
	console.log(
		'\nTest 9: string separator override → applied in normal state',
	);
	const string_sep = segment.build(
		with_context_window({
			used_percentage: 10,
			context_window_size: 200_000,
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
	console.log('✅ PASS: string "curvy" applied in transparent state');

	// Test 10: object separator form still works in transparent state
	console.log(
		'\nTest 10: object separator override → applied in normal state',
	);
	const object_sep = segment.build(
		with_context_window({
			used_percentage: 10,
			context_window_size: 200_000,
		}),
		make_config(undefined, { separator: { style: 'angly' } }),
	);
	if (!object_sep || object_sep.separator_style !== 'angly') {
		console.log(
			'❌ FAIL: object separator should yield "angly", got',
			object_sep?.separator_style,
		);
		return false;
	}
	console.log(
		'✅ PASS: object { style: "angly" } applied in transparent state',
	);

	// Test 11: show_tokens consumed figure includes output tokens
	console.log('\nTest 11: show_tokens includes output tokens in consumed');
	const with_output = segment.build(
		with_context_window({
			used_percentage: 10,
			context_window_size: 200_000,
			total_input_tokens: 10_000,
			total_output_tokens: 10_000,
		}),
		make_config(tokens_opts),
	);
	if (!with_output || !with_output.content.includes('20k / 200k')) {
		console.log(
			'❌ FAIL: 10k input + 10k output should give 20k consumed, got',
			with_output?.content,
		);
		return false;
	}
	console.log('✅ PASS: input+output combined → 20k / 200k');

	console.log('\n✅ All WindowSegment tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_window_segment_tests();
	process.exit(success ? 0 : 1);
}

export { run_window_segment_tests };
