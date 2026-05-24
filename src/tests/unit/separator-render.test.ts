import { render_separator } from '../../core/statusline';
import { SegmentData } from '../../types';
import { ansi_bg_to_fg } from '../../utils/ansi';

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

	// Test 1: ansi_bg_to_fg converts bg codes to fg codes
	console.log('Test 1: ansi_bg_to_fg conversion');
	if (
		ansi_bg_to_fg('\x1b[49m') !== '\x1b[39m' ||
		ansi_bg_to_fg('\x1b[48;2;1;2;3m') !== '\x1b[38;2;1;2;3m'
	) {
		console.log('❌ FAIL: ansi_bg_to_fg wrong output');
		return false;
	}
	console.log('✅ PASS');

	// Test 2: coloured → coloured uses right glyph filled with current colour
	console.log(
		'\nTest 2: coloured → coloured (right glyph, current colour)',
	);
	const cc = render_separator(blue, grey);
	const expected_cc = `${grey.bg_color}${blue.separator_from_color}${RIGHT_CURVY}${RESET}`;
	if (cc !== expected_cc) {
		console.log('❌ FAIL: got', JSON.stringify(cc));
		return false;
	}
	console.log('✅ PASS: right glyph, current colour, next bg');

	// Test 3: transparent → coloured uses LEFT glyph filled with NEXT colour
	//         on the transparent cell (the bug: left part must not be dark fg)
	console.log(
		'\nTest 3: transparent → coloured (left glyph, next colour)',
	);
	const tc = render_separator(transparent('curvy'), blue);
	const expected_tc = `${TRANSPARENT_BG}${ansi_bg_to_fg(blue.bg_color)}${LEFT_CURVY}${RESET}`;
	if (tc !== expected_tc) {
		console.log('❌ FAIL: got', JSON.stringify(tc));
		console.log('   exp', JSON.stringify(expected_tc));
		return false;
	}
	// regression guard: glyph must NOT be the right glyph nor filled with the
	// terminal default fg (\x1b[39m) — that was the dark-blob bug.
	if (tc.includes(RIGHT_CURVY) || tc.includes('\x1b[39m')) {
		console.log(
			'❌ FAIL: transparent separator used default fg or right glyph',
		);
		return false;
	}
	console.log('✅ PASS: left glyph, next colour, transparent cell');

	// Test 4: transparent → transparent → no glyph
	console.log('\nTest 4: transparent → transparent → empty');
	if (render_separator(transparent(), transparent()) !== '') {
		console.log('❌ FAIL: expected empty separator');
		return false;
	}
	console.log('✅ PASS: no glyph between two transparent segments');

	// Test 5: transparent as last segment → no trailing glyph
	console.log('\nTest 5: transparent last segment → empty');
	if (render_separator(transparent(), undefined) !== '') {
		console.log('❌ FAIL: expected empty trailing separator');
		return false;
	}
	console.log(
		'✅ PASS: no trailing glyph for transparent last segment',
	);

	// Test 6: coloured last segment → right glyph, no next bg
	console.log('\nTest 6: coloured last segment → right glyph');
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
