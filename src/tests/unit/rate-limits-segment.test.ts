import '../../segments'; // Auto-register segments
import { segmentRegistry } from '../../core/registry';
import { ClaudeStatusInput, StatuslineConfig } from '../../types';
import { hex_to_ansi } from '../../utils/colors';

const ANSI_BG_DEFAULT = '\x1b[49m';
const AMBER_BG = hex_to_ansi('#d97706', true);
const RED_BG = hex_to_ansi('#dc2626', true);

function rate_limit_data(
	five_hour_pct: number | null,
	seven_day_pct: number | null,
): ClaudeStatusInput {
	const rate_limits: NonNullable<ClaudeStatusInput['rate_limits']> =
		{};
	if (five_hour_pct !== null) {
		rate_limits.five_hour = {
			used_percentage: five_hour_pct,
			resets_at: 1800000000,
		};
	}
	if (seven_day_pct !== null) {
		rate_limits.seven_day = {
			used_percentage: seven_day_pct,
			resets_at: 1800000000,
		};
	}
	return {
		session_id: 'test-session',
		model: { display_name: 'Sonnet 4' },
		workspace: { current_dir: '/test' },
		rate_limits,
	};
}

function run_rate_limits_segment_tests(): boolean {
	console.log('🧪 Running RateLimitsSegment tests...\n');

	const mock_config: StatuslineConfig = {
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
			rate_limits: 'thick',
		},
		segment_config: {
			segments: [{ type: 'rate_limits' }],
		},
	};

	// Test 1: rate_limits segment is registered
	console.log('Test 1: rate_limits segment is registered');
	const segment = segmentRegistry.get_segment('rate_limits');
	if (!segment) {
		console.log('❌ FAIL: rate_limits segment not found in registry');
		return false;
	}
	console.log('✅ PASS: rate_limits segment is registered');

	// Test 2: segment builds with both rate limits present
	console.log('\nTest 2: segment builds with both rate limits');
	const mock_data_both: ClaudeStatusInput = {
		session_id: 'test-session',
		model: { display_name: 'Sonnet 4' },
		workspace: { current_dir: '/test' },
		rate_limits: {
			five_hour: { used_percentage: 23.5, resets_at: 1738425600 },
			seven_day: { used_percentage: 41.2, resets_at: 1738857600 },
		},
	};
	const result_both = segment.build(mock_data_both, mock_config);
	if (!result_both) {
		console.log('❌ FAIL: segment returned null with both limits');
		return false;
	}
	if (
		!result_both.content.includes('5h') ||
		!result_both.content.includes('7d')
	) {
		console.log(
			'❌ FAIL: expected both 5h and 7d in content: %s',
			result_both.content,
		);
		return false;
	}
	console.log('✅ PASS: segment builds with both rate limits');

	// Test 3: segment builds with only five_hour
	console.log('\nTest 3: segment builds with only five_hour');
	const mock_data_5h: ClaudeStatusInput = {
		session_id: 'test-session',
		model: { display_name: 'Sonnet 4' },
		workspace: { current_dir: '/test' },
		rate_limits: {
			five_hour: { used_percentage: 80, resets_at: 1738425600 },
		},
	};
	const result_5h = segment.build(mock_data_5h, mock_config);
	if (!result_5h) {
		console.log('❌ FAIL: segment returned null with only five_hour');
		return false;
	}
	if (!result_5h.content.includes('5h')) {
		console.log(
			'❌ FAIL: expected 5h in content: %s',
			result_5h.content,
		);
		return false;
	}
	console.log('✅ PASS: segment builds with only five_hour');

	// Test 4: segment shows a placeholder (not null) when no rate_limits yet
	console.log(
		'\nTest 4: segment shows "waiting for data" when no rate_limits',
	);
	const mock_data_none: ClaudeStatusInput = {
		session_id: 'test-session',
		model: { display_name: 'Sonnet 4' },
		workspace: { current_dir: '/test' },
	};
	const result_none = segment.build(mock_data_none, mock_config);
	if (!result_none) {
		console.log('❌ FAIL: segment should always render, got null');
		return false;
	}
	if (!result_none.content.includes('waiting for data')) {
		console.log(
			'❌ FAIL: expected "waiting for data", got: %s',
			result_none.content,
		);
		return false;
	}
	console.log(
		'✅ PASS: segment shows "waiting for data" placeholder',
	);

	// Test 5: percentages are rounded to integers
	console.log('\nTest 5: percentages are rounded to integers');
	if (
		!result_both.content.includes('24%') ||
		!result_both.content.includes('41%')
	) {
		console.log(
			'❌ FAIL: expected rounded percentages (24%%, 41%%): %s',
			result_both.content,
		);
		return false;
	}
	console.log('✅ PASS: percentages are rounded');

	// Test 6: both windows < 70% → transparent background
	console.log('\nTest 6: both < 70% → transparent');
	const low = segment.build(rate_limit_data(40, 65), mock_config);
	if (!low || low.bg_color !== ANSI_BG_DEFAULT) {
		console.log(
			'❌ FAIL: expected transparent bg, got %s',
			low?.bg_color,
		);
		return false;
	}
	console.log('✅ PASS: transparent when both below 70%');

	// Test 7: either window in 70-85% → amber background
	console.log('\nTest 7: 5h in 70-85% → amber');
	const warn = segment.build(rate_limit_data(75, 20), mock_config);
	if (!warn || warn.bg_color !== AMBER_BG) {
		console.log('❌ FAIL: expected amber bg, got %s', warn?.bg_color);
		return false;
	}
	console.log('✅ PASS: amber when a window is between 70 and 85%');

	// Test 7b: exactly 85% is still amber (danger is strictly above 85)
	console.log('\nTest 7b: exactly 85% → amber (boundary)');
	const boundary = segment.build(rate_limit_data(85, 0), mock_config);
	if (!boundary || boundary.bg_color !== AMBER_BG) {
		console.log(
			'❌ FAIL: 85%% should be amber, got %s',
			boundary?.bg_color,
		);
		return false;
	}
	console.log('✅ PASS: 85% is amber');

	// Test 8: either window > 85% → red background
	console.log('\nTest 8: 7d > 85% → red');
	const danger = segment.build(rate_limit_data(30, 90), mock_config);
	if (!danger || danger.bg_color !== RED_BG) {
		console.log('❌ FAIL: expected red bg, got %s', danger?.bg_color);
		return false;
	}
	console.log('✅ PASS: red when a window exceeds 85%');

	// Test 9: no data → transparent (waiting for data is not a warning state)
	console.log('\nTest 9: no data → transparent');
	if (result_none.bg_color !== ANSI_BG_DEFAULT) {
		console.log(
			'❌ FAIL: waiting-for-data should be transparent, got %s',
			result_none.bg_color,
		);
		return false;
	}
	console.log('✅ PASS: transparent while waiting for data');

	console.log('\n✅ All RateLimitsSegment tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_rate_limits_segment_tests();
	process.exit(success ? 0 : 1);
}

export { run_rate_limits_segment_tests };
