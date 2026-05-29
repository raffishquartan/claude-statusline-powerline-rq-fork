import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

import { ClaudeStatusInput } from '../../types';

const CURRENT_DIR = '/test/project';
const SESSION_ID = 'test-fixture-session';

/**
 * Write `lines` as JSONL into a temp HOME-rooted session file at the exact
 * path the window / last_message_time segments read from, invoke `fn` with a
 * matching ClaudeStatusInput, then restore HOME and delete the temp dir.
 *
 * The segments build the path from `process.env.HOME`, the slash-encoded
 * `workspace.current_dir`, and `session_id`, so the fixture mirrors that.
 */
export function with_session_jsonl<T>(
	lines: unknown[],
	fn: (data: ClaudeStatusInput) => T,
): T {
	const original_home = process.env.HOME;
	const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'csl-test-'));
	process.env.HOME = tmp;

	const dir = path.join(
		tmp,
		'.claude/projects',
		CURRENT_DIR.replace(/\//g, '-'),
	);
	fs.mkdirSync(dir, { recursive: true });
	fs.writeFileSync(
		path.join(dir, `${SESSION_ID}.jsonl`),
		lines.map((l) => JSON.stringify(l)).join('\n'),
	);

	const data: ClaudeStatusInput = {
		session_id: SESSION_ID,
		model: { display_name: 'Test', id: 'claude-sonnet-4-6' },
		workspace: { current_dir: CURRENT_DIR },
	};

	try {
		return fn(data);
	} finally {
		if (original_home === undefined) {
			delete process.env.HOME;
		} else {
			process.env.HOME = original_home;
		}
		fs.rmSync(tmp, { recursive: true, force: true });
	}
}

/** ClaudeStatusInput pointing at a session file that does not exist. */
export function missing_session_data(): ClaudeStatusInput {
	return {
		session_id: 'no-such-session',
		model: { display_name: 'Test', id: 'claude-sonnet-4-6' },
		workspace: { current_dir: '/no/such/dir/at/all' },
	};
}

/** Build a single assistant JSONL entry with the given token usage. */
export function assistant_usage_entry(
	model: string,
	usage: {
		input_tokens?: number;
		cache_read_input_tokens?: number;
		cache_creation_input_tokens?: number;
		output_tokens?: number;
	},
): unknown {
	return {
		type: 'assistant',
		timestamp: new Date().toISOString(),
		message: { model, usage },
	};
}

/** Build a single assistant JSONL entry carrying only a timestamp. */
export function assistant_timestamp_entry(timestamp: Date): unknown {
	return {
		type: 'assistant',
		timestamp: timestamp.toISOString(),
		message: { model: 'claude-sonnet-4-6' },
	};
}
