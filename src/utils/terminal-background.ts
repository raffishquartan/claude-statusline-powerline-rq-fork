import * as fs from 'node:fs';

/**
 * Parse a terminal's OSC 11 background-colour reply into a #rrggbb hex string.
 *
 * Terminals answer an OSC 11 query with e.g.
 *   ESC ] 11 ; rgb:fdfd/f6f6/e3e3 ESC \
 * or with 8-bit channels (rgb:fd/f6/e3) or the `rgba:` / `#rrggbb` variants.
 * Each channel may be 1-4 hex digits; we scale it to a single byte.
 *
 * Returns null if the reply contains no recognisable colour.
 */
export function parse_osc11_response(
	response: string,
): string | null {
	const rgb = response.match(
		/rgba?:([0-9a-fA-F]+)\/([0-9a-fA-F]+)\/([0-9a-fA-F]+)/,
	);
	if (rgb) {
		return `#${channel_to_byte(rgb[1])}${channel_to_byte(rgb[2])}${channel_to_byte(rgb[3])}`;
	}

	// Some terminals reply with a plain #rgb / #rrggbb after the `11;`.
	const hash = response.match(
		/11;#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/,
	);
	if (hash) {
		const h = hash[1];
		if (h.length === 3) {
			return `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`.toLowerCase();
		}
		return `#${h.toLowerCase()}`;
	}

	return null;
}

/** Scale a 1-4 hex-digit channel to a two-digit (8-bit) hex string. */
function channel_to_byte(hex: string): string {
	const value = parseInt(hex, 16);
	const max = Math.pow(16, hex.length) - 1;
	const byte = Math.round((value / max) * 255);
	return byte.toString(16).padStart(2, '0');
}

/**
 * Wrap an escape sequence so it passes through tmux to the outer terminal.
 * tmux otherwise swallows OSC queries (and may answer with its own colour).
 */
function tmux_passthrough(sequence: string): string {
	const inner = sequence.replace(/\x1b/g, '\x1b\x1b');
	return `\x1bPtmux;${inner}\x1b\\`;
}

/**
 * Best-effort detection of the terminal background colour via an OSC 11 query
 * on /dev/tty. This must only be called from an interactive invocation (the
 * user running the CLI directly) — never from the statusline render path,
 * where stdin is JSON and the TTY belongs to the host application.
 *
 * Resolves to a #rrggbb hex string, or null if detection failed/timed out.
 */
export function detect_terminal_background(
	timeout_ms = 200,
): Promise<string | null> {
	return new Promise((resolve) => {
		let fd: number;
		try {
			fd = fs.openSync('/dev/tty', 'r+');
		} catch {
			resolve(null);
			return;
		}

		const query = '\x1b]11;?\x07';
		const in_tmux = !!process.env.TMUX;

		let settled = false;
		let buffer = '';
		const finish = (result: string | null) => {
			if (settled) return;
			settled = true;
			clearTimeout(timer);
			try {
				if (process.stdin.isTTY) process.stdin.setRawMode(false);
				process.stdin.pause();
			} catch {
				/* ignore */
			}
			try {
				fs.closeSync(fd);
			} catch {
				/* ignore */
			}
			resolve(result);
		};

		const timer = setTimeout(() => finish(null), timeout_ms);

		try {
			if (process.stdin.isTTY) process.stdin.setRawMode(true);
			process.stdin.resume();
			process.stdin.on('data', (chunk: Buffer) => {
				buffer += chunk.toString('latin1');
				const parsed = parse_osc11_response(buffer);
				if (parsed) finish(parsed);
			});

			fs.writeSync(fd, in_tmux ? tmux_passthrough(query) : query);
		} catch {
			finish(null);
		}
	});
}
