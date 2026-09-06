## Why

Claude Code already sends `rate_limits.five_hour.resets_at` /
`rate_limits.seven_day.resets_at` (Unix timestamps) on stdin, and the
existing `rate_limits` segment surfaces the _percentage used_ for each
window, but nothing in the statusline shows _when_ a window resets. A
user watching their 5-hour usage climb has no way to see the
wall-clock time it frees up again without leaving the terminal. A new
segment that formats `resets_at` as a local `HH:MM` closes that gap.

## What Changes

- Add a new `rate_limit_reset` segment type that renders the reset
  time of a rate-limit window (e.g. `⌛ 13:06`) as local `HH:MM`.
- Add a `rate_limit_reset_options.window` option (`"five_hour"` |
  `"seven_day"`, default `"five_hour"`) so the same segment type can
  show either window's reset time.
- Add a `⌛` (hourglass) icon symbol, distinct from the `🕐` clock
  already used by `last_message_time`.
- Segment is always transparent/neutral (matches the "always neutral"
  design decision — no warn/danger colour states, no proximity
  threshold), showing `⌛ -` when the relevant window's data hasn't
  arrived yet (mirrors `rate_limits`' "waiting for data" pattern and
  `window`'s `-` placeholder).
- Register the segment (auto-registration via
  `src/segments/index.ts`), add its `SegmentType`, `SeparatorConfig`
  entry, default separator, theme colour, and JSON-schema
  regeneration.
- Document the new segment and its options in README.md.
- Not enabled by default (matches how `rate_limits`, `session`, and
  `usage` are opt-in via `segment_config`).

## Capabilities

### New Capabilities

- `segments/rate-limit-reset`: statusline segment that displays the
  local reset time (`HH:MM`) of a Claude.ai rate-limit window (5-hour
  or 7-day), independent of the existing `rate_limits`
  percentage-usage segment.

### Modified Capabilities

(none — this is a net-new, opt-in segment; it does not change the
behavior of any existing segment)

## Impact

- **Affected code**: `src/types.ts` (new `SegmentType` member, new
  `RateLimitResetOptions` interface, `SeparatorConfig` entry,
  `SegmentConfig.rate_limit_reset_options`), `src/segments/` (new
  `rate-limit-reset.ts`, `index.ts` registration), `src/config.ts`
  (default separator entry), `src/themes/base.ts` (segment theme
  colour), `src/utils/symbols.ts` (hourglass icon),
  `statusline.schema.json` (regenerated, not hand-edited), `README.md`
  (new segment docs).
- **Tests**: new `src/tests/unit/rate-limit-reset-segment.test.ts`
  following the pattern of `rate-limits-segment.test.ts` /
  `window-segment.test.ts`.
- **No breaking changes**: purely additive; existing configs and
  segment output are unaffected since the segment is opt-in.
- **No new dependencies**; uses the existing
  `ClaudeStatusInput.rate_limits` field already defined in
  `src/types.ts`.
