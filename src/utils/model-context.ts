import { MODEL_PRICING } from '../config';

export interface ContextWindowResult {
	/** Context window size in tokens */
	window: number;
	/** True when the model was found by exact match in MODEL_PRICING */
	known: boolean;
}

// Regex-based heuristics for models not in MODEL_PRICING.
// Checked in order; first match wins.
const REGEX_FALLBACKS: Array<{ pattern: RegExp; window: number }> = [
	// Sonnet 4 dated variants (e.g. claude-sonnet-4-20250514) → 1M
	{ pattern: /^claude-sonnet-4-\d{8}/, window: 1_000_000 },
	// Opus 4.x numbered variants (e.g. claude-opus-4-7) → 1M
	{ pattern: /^claude-opus-4-\d/, window: 1_000_000 },
];

/**
 * Look up the context window size for a model ID.
 *
 * Returns `known: false` when the result came from a heuristic or the
 * conservative 200k default — callers can use this to flag uncertainty.
 */
export function get_context_window(model_id: string): ContextWindowResult {
	const pricing = MODEL_PRICING[model_id];
	if (pricing) {
		return { window: pricing.context_window, known: true };
	}

	for (const fallback of REGEX_FALLBACKS) {
		if (fallback.pattern.test(model_id)) {
			return { window: fallback.window, known: false };
		}
	}

	return { window: 200_000, known: false };
}
