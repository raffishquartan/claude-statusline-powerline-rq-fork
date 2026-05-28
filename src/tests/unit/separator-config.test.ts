import { normalize_separator } from '../../utils/separator-config';

function run_separator_config_tests(): boolean {
	console.log('🧪 Running normalize_separator tests...\n');

	// Test 1: bare string shorthand → object form
	console.log('Test 1: string "curvy" → { style: "curvy" }');
	const from_string = normalize_separator('curvy');
	if (
		!from_string ||
		from_string.style !== 'curvy' ||
		('color' in from_string && from_string.color !== undefined)
	) {
		console.log('❌ FAIL: got', from_string);
		return false;
	}
	console.log('✅ PASS');

	// Test 2: object form passes through unchanged
	console.log('\nTest 2: object form passes through');
	const obj = { style: 'thick' as const, color: '#059669' };
	const from_object = normalize_separator(obj);
	if (
		!from_object ||
		from_object.style !== 'thick' ||
		from_object.color !== '#059669'
	) {
		console.log('❌ FAIL: got', from_object);
		return false;
	}
	console.log('✅ PASS');

	// Test 3: undefined → undefined
	console.log('\nTest 3: undefined → undefined');
	if (normalize_separator(undefined) !== undefined) {
		console.log('❌ FAIL: expected undefined');
		return false;
	}
	console.log('✅ PASS');

	// Test 4: object with only style (no color)
	console.log('\nTest 4: object with only style');
	const only_style = normalize_separator({ style: 'angly' });
	if (!only_style || only_style.style !== 'angly') {
		console.log('❌ FAIL: got', only_style);
		return false;
	}
	console.log('✅ PASS');

	console.log('\n✅ All normalize_separator tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_separator_config_tests();
	process.exit(success ? 0 : 1);
}

export { run_separator_config_tests };
