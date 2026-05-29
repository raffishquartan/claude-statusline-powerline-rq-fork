import { SegmentStyleConfig, SeparatorOverride } from '../types';

/**
 * Normalise a segment's `separator` config into object form.
 *
 * Users may write either a bare style string (`"separator": "curvy"`) or the
 * full object (`"separator": { "style": "curvy", "color": "#059669" }`). This
 * collapses both into `SeparatorOverride | undefined` so every read site can
 * uniformly access `.style` / `.color`.
 */
export function normalize_separator(
	separator: SegmentStyleConfig['separator'],
): SeparatorOverride | undefined {
	if (separator === undefined) return undefined;
	if (typeof separator === 'string') return { style: separator };
	return separator;
}
