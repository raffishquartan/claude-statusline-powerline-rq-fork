import { pick_fg_for_hex_bg } from '../../utils/colors';

const DARK_FG = '#1a1a1a';
const LIGHT_FG = '#ffffff';

function run_colors_tests(): boolean {
	console.log('🧪 Running pick_fg_for_hex_bg tests...\n');

	const cases: Array<{ bg: string; expect: string; label: string }> =
		[
			{ bg: '#ffffff', expect: DARK_FG, label: 'white bg → dark fg' },
			{
				bg: '#000000',
				expect: LIGHT_FG,
				label: 'black bg → light fg',
			},
			{
				bg: '#ea580c',
				expect: LIGHT_FG,
				label: 'amber warn bg → light fg',
			},
			{
				bg: '#dc2626',
				expect: LIGHT_FG,
				label: 'red danger bg → light fg',
			},
			{
				bg: '#cccccc',
				expect: DARK_FG,
				label: 'light grey bg → dark fg',
			},
			// Luminance boundary: 0x80 (128) → 0.502 > 0.5 → dark
			{
				bg: '#808080',
				expect: DARK_FG,
				label: 'just-above-0.5 luminance → dark fg',
			},
			// Luminance boundary: 0x7f (127) → 0.498 < 0.5 → light
			{
				bg: '#7f7f7f',
				expect: LIGHT_FG,
				label: 'just-below-0.5 luminance → light fg',
			},
		];

	let n = 0;
	for (const c of cases) {
		n += 1;
		console.log(`Test ${n}: ${c.label}`);
		const got = pick_fg_for_hex_bg(c.bg);
		if (got !== c.expect) {
			console.log(
				`❌ FAIL: ${c.bg} expected ${c.expect}, got ${got}`,
			);
			return false;
		}
		console.log('✅ PASS');
	}

	console.log('\n✅ All pick_fg_for_hex_bg tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_colors_tests();
	process.exit(success ? 0 : 1);
}

export { run_colors_tests };
