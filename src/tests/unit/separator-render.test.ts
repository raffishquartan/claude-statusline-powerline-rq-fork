import { render_separator } from '../../core/statusline';
import { SegmentData } from '../../types';

const TRANSPARENT_BG = '\x1b[49m';
const RESET = '\x1b[0m';

// Powerline curvy glyphs (Private Use Area; defined by code point so the
// source stays pure ASCII and unambiguous).
const RIGHT_CURVY = String.fromCharCode(0xe0b4); //
const LEFT_CURVY = String.fromCharCode(0xe0b6); //

function transparent(separator_style = 'curvy'): SegmentData {
	return {
		content: 'x',
		bg_color: TRANSPARENT_BG,
		fg_color: '\x1b[39m',
		separator_from_color: '\x1b[39m',
		separator_style,
	};
}

function colored(
	bg_rgb: string,
	separator_style = 'curvy',
): SegmentData {
	return {
		content: 'y',
		bg_color: `\x1b[48;2;${bg_rgb}m`,
		fg_color: '\x1b[38;2;255;255;255m',
		separator_from_color: `\x1b[38;2;${bg_rgb}m`,
		separator_style,
	};
}

function run_separator_render_tests(): boolean {
	console.log('🧪 Running render_separator tests...\n');

	const blue = colored('38;139;210');
	const grey = colored('101;123;131');

	// Test 1: coloured → coloured uses right glyph filled with current colour
	console.log(
		'Test 1: coloured → coloured (right glyph, current colour)',
	);
	const cc = render_separator(blue, grey);
	const expected_cc = `${grey.bg_color}${blue.separator_from_color}${RIGHT_CURVY}${RESET}`;
	if (cc !== expected_cc) {
		console.log('❌ FAIL: got', JSON.stringify(cc));
		return false;
	}
	console.log('✅ PASS: right glyph, current colour, next bg');

	// Test 2: transparent → coloured must NOT emit a powerline glyph.
	// A right-facing glyph from a transparent segment would have to be filled
	// with the terminal-default background (impossible as a foreground), and a
	// left-facing glyph points the wrong way against a left-to-right bar. So a
	// floating segment emits nothing and the coloured bar begins cleanly.
	console.log(
		'\nTest 2: transparent → coloured emits no glyph (not a wrong-way left glyph)',
	);
	const tc = render_separator(transparent('curvy'), blue);
	if (tc !== '') {
		console.log('❌ FAIL: expected empty, got', JSON.stringify(tc));
		// surface the specific regression if a glyph leaked through
		if (tc.includes(LEFT_CURVY)) {
			console.log('   → it used the backwards (left) curvy glyph');
		}
		return false;
	}
	console.log('✅ PASS: no glyph emitted for transparent → coloured');

	// Test 3: transparent → transparent → no glyph
	console.log('\nTest 3: transparent → transparent → empty');
	if (render_separator(transparent(), transparent()) !== '') {
		console.log('❌ FAIL: expected empty separator');
		return false;
	}
	console.log('✅ PASS: no glyph between two transparent segments');

	// Test 4: transparent as last segment → no trailing glyph
	console.log('\nTest 4: transparent last segment → empty');
	if (render_separator(transparent(), undefined) !== '') {
		console.log('❌ FAIL: expected empty trailing separator');
		return false;
	}
	console.log(
		'✅ PASS: no trailing glyph for transparent last segment',
	);

	// Test 5: coloured last segment → right glyph, no next bg
	console.log('\nTest 5: coloured last segment → right glyph');
	const last = render_separator(blue, undefined);
	if (last !== `${blue.separator_from_color}${RIGHT_CURVY}${RESET}`) {
		console.log('❌ FAIL: got', JSON.stringify(last));
		return false;
	}
	console.log(
		'✅ PASS: trailing right glyph for coloured last segment',
	);

	console.log('\n✅ All render_separator tests passed!\n');
	return true;
}

if (require.main === module) {
	const success = run_separator_render_tests();
	process.exit(success ? 0 : 1);
}

export { run_separator_render_tests };
