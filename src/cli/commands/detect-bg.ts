import * as fs from 'fs';

import { get_config_path } from '../../config';
import { detect_terminal_background } from '../../utils/terminal-background';

/**
 * Detect the terminal background colour (OSC 11) and offer to save it to the
 * config as `terminal_background`. Must be run directly in an interactive
 * terminal — not via the host application's statusline render.
 */
export async function detect_background(
	write = false,
): Promise<void> {
	if (!process.stdin.isTTY) {
		console.error(
			'❌ --detect-bg must be run directly in an interactive terminal.',
		);
		console.error(
			'   It queries the terminal for its background colour, which only',
		);
		console.error('   works when stdin is a TTY (not piped).');
		process.exit(1);
	}

	if (process.env.TMUX) {
		console.log(
			'⚠️  You are inside tmux, which often blocks colour queries.',
		);
		console.log(
			'   If detection times out, read your terminal background from its',
		);
		console.log(
			'   settings and set it manually (see the instructions below).',
		);
		console.log('');
	}

	console.log('🔎 Querying terminal background colour…');
	const color = await detect_terminal_background();

	if (!color) {
		console.error(
			'❌ Could not detect the terminal background colour.',
		);
		console.error('');
		console.error(
			"   Set it manually instead — find your terminal's",
		);
		console.error('   background hex and add to your config:');
		console.error('');
		console.error('     "terminal_background": "#rrggbb"');
		console.error('');
		console.error(`   Config file: ${get_config_path()}`);
		process.exit(1);
	}

	console.log(`✅ Detected terminal background: ${color}`);

	if (!write) {
		console.log('');
		console.log(
			'Add it to your config to enable curvy separators on',
		);
		console.log('transparent segments:');
		console.log('');
		console.log(`     "terminal_background": "${color}"`);
		console.log('');
		console.log(
			'Or re-run with --detect-bg --write to save it for you.',
		);
		return;
	}

	save_terminal_background(color);
}

function save_terminal_background(color: string): void {
	const config_path = get_config_path();
	let config: Record<string, unknown> = {};

	if (fs.existsSync(config_path)) {
		try {
			config = JSON.parse(fs.readFileSync(config_path, 'utf8'));
		} catch {
			console.error(
				`❌ Existing config at ${config_path} is not valid JSON; not modifying it.`,
			);
			process.exit(1);
		}
	}

	config.terminal_background = color;
	fs.writeFileSync(config_path, JSON.stringify(config, null, 2));
	console.log(`💾 Saved terminal_background to ${config_path}`);
}
