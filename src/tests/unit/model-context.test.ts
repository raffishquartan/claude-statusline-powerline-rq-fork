import { get_context_window } from '../../utils/model-context';

function run_model_context_tests(): boolean {
	console.log('🧪 Running get_context_window tests...\n');

	// Test 1: exact MODEL_PRICING hit returns known + correct window
	console.log(
		'Test 1: exact MODEL_PRICING match (opus 4.7 → 1M, known)',
	);
	const opus = get_context_window('claude-opus-4-7');
	if (opus.window !== 1_000_000 || opus.known !== true) {
		console.log(
			'❌ FAIL: expected { 1000000, known:true }, got',
			opus,
		);
		return false;
	}
	console.log('✅ PASS: opus 4.7 → 1M, known');

	console.log(
		'\nTest 2: exact MODEL_PRICING match (sonnet 4.6 → 200k)',
	);
	const sonnet = get_context_window('claude-sonnet-4-6');
	if (sonnet.window !== 200_000 || sonnet.known !== true) {
		console.log(
			'❌ FAIL: expected { 200000, known:true }, got',
			sonnet,
		);
		return false;
	}
	console.log('✅ PASS: sonnet 4.6 → 200k, known');

	// Test 3: Sonnet-4 dated regex fallback → 1M, not known
	console.log(
		'\nTest 3: sonnet-4 dated regex fallback → 1M, unknown',
	);
	const sonnet_dated = get_context_window('claude-sonnet-4-99999999');
	if (
		sonnet_dated.window !== 1_000_000 ||
		sonnet_dated.known !== false
	) {
		console.log(
			'❌ FAIL: expected { 1000000, known:false }, got',
			sonnet_dated,
		);
		return false;
	}
	console.log(
		'✅ PASS: sonnet-4 dated variant → 1M via regex, unknown',
	);

	// Test 4: Opus-4.x numbered regex fallback → 1M, not known
	console.log('\nTest 4: opus-4.x regex fallback → 1M, unknown');
	const opus_future = get_context_window('claude-opus-4-9');
	if (
		opus_future.window !== 1_000_000 ||
		opus_future.known !== false
	) {
		console.log(
			'❌ FAIL: expected { 1000000, known:false }, got',
			opus_future,
		);
		return false;
	}
	console.log('✅ PASS: opus-4.9 → 1M via regex, unknown');

	// Test 5: unrecognised model → conservative 200k default, not known
	console.log('\nTest 5: unrecognised model → 200k default, unknown');
	const mystery = get_context_window('gpt-some-other-model');
	if (mystery.window !== 200_000 || mystery.known !== false) {
		console.log(
			'❌ FAIL: expected { 200000, known:false }, got',
			mystery,
		);
		return false;
	}
	console.log('✅ PASS: unknown model → 200k default, unknown');

	console.log('\n✅ All get_context_window tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_model_context_tests();
	process.exit(success ? 0 : 1);
}

export { run_model_context_tests };
