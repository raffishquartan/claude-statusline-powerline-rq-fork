import { parse_osc11_response } from '../../utils/terminal-background';

function run_terminal_background_tests(): boolean {
	console.log('🧪 Running parse_osc11_response tests...\n');

	const cases: Array<{
		input: string;
		expect: string | null;
		label: string;
	}> = [
		{
			input: '\x1b]11;rgb:fdfd/f6f6/e3e3\x1b\\',
			expect: '#fdf6e3',
			label: '16-bit channels (solarized-light bg)',
		},
		{
			input: '\x1b]11;rgb:fd/f6/e3\x07',
			expect: '#fdf6e3',
			label: '8-bit channels with BEL terminator',
		},
		{
			input: '\x1b]11;rgb:0000/0000/0000\x1b\\',
			expect: '#000000',
			label: 'pure black',
		},
		{
			input: '\x1b]11;rgb:ffff/ffff/ffff\x1b\\',
			expect: '#ffffff',
			label: 'pure white',
		},
		{
			input: '\x1b]11;#011627\x07',
			expect: '#011627',
			label: 'plain #rrggbb reply (night-owl bg)',
		},
		{
			input: '\x1b]11;#abc\x07',
			expect: '#aabbcc',
			label: 'short #rgb reply expanded',
		},
		{
			input: 'garbage with no colour',
			expect: null,
			label: 'unparseable reply → null',
		},
	];

	let n = 0;
	for (const c of cases) {
		n += 1;
		console.log(`Test ${n}: ${c.label}`);
		const got = parse_osc11_response(c.input);
		if (got !== c.expect) {
			console.log(`❌ FAIL: expected ${c.expect}, got ${got}`);
			return false;
		}
		console.log('✅ PASS');
	}

	console.log('\n✅ All parse_osc11_response tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_terminal_background_tests();
	process.exit(success ? 0 : 1);
}

export { run_terminal_background_tests };
