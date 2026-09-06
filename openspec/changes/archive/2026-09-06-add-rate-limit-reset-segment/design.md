## Context

See proposal.md - Why. The relevant input data
(`ClaudeStatusInput.rate_limits.{five_hour,seven_day}.resets_at`, a
Unix timestamp in seconds) already exists in `src/types.ts` and is
already consumed by `src/segments/rate-limits.ts`. The codebase has
two existing segments that establish the patterns this segment should
follow:

- `src/segments/window.ts` and `src/segments/rate-limits.ts`:
  threshold- driven segments with
  `build_segment_data`/`resolve_options` helpers and a
  `Required<XOptions>` defaults object.
- `src/segments/last-message-time.ts`: a segment that formats a
  timestamp as local `HH:MM` (its `format_hhmm` is the exact
  formatting this segment needs, just applied to `resets_at * 1000`
  instead of a parsed transcript timestamp).

Every segment is a class extending `BaseSegment`, registered in
`src/segments/index.ts`, with its own `SegmentType` literal,
`*Options` interface, `SeparatorConfig` entry, default separator in
`src/config.ts`, and theme colour in `src/themes/base.ts`.
`statusline.schema.json` is generated from `src/types.ts` by
`pnpm run schema` (part of `pnpm run build`) and must never be hand-
edited.

## Goals / Non-Goals

**Goals:**

- Reuse the existing `rate_limits` input data and the existing
  timestamp-formatting approach from `last-message-time.ts`.
- Keep the new segment's shape (options, defaults, registration,
  config surface) indistinguishable in style from the existing
  segments, per the "treat sibling handlers as a set" rule.

**Non-Goals:**

- No new colour/threshold states (per the "always neutral" decision) -
  this segment does not need `build_segment_data`'s warn/danger
  branching, unlike `window.ts` and `rate-limits.ts`.
- No change to the existing `rate_limits` segment's behavior or
  output.
- No countdown/relative-time display (e.g. "in 3h 3m") - only the
  absolute local `HH:MM`, per the proposal.

## Decisions

- **New segment type name: `rate_limit_reset`.** Chosen over
  overloading `rate_limits` itself, because `rate_limits` already has
  a stable, documented output shape (percentage-based, both windows at
  once) and adding a mode switch there would complicate its config
  surface for existing users. A separate segment type keeps each
  segment's `build()` doing one thing, matches the project's one-
  segment-per-concern convention, and lets both segments be placed
  independently in the statusline layout.
- **`window` option (`"five_hour" | "seven_day"`, default
  `"five_hour"`) rather than two separate segment types
  (`rate_limit_reset_5h`, `rate_limit_reset_7d`).** A single
  parameterised segment type mirrors how
  `window_options`/`rate_limits_options` already parameterise behavior
  rather than multiplying segment types, and lets a user who wants
  both reset times configure two `rate_limit_reset` entries with
  different `window` values.
- **Icon: `⌛` (U+231B, HOURGLASS).** Visually distinct from the `🕐`
  clock (`last_message_time`) and the `⚙` warning gear
  (`rate_limits`), and reads as "time running out" rather than
  "current time" - user- selected over `⏳`/`⏱️`/`⏰` alternatives.
  registered as `get_symbol('hourglass', ...)` in
  `src/utils/symbols.ts`, consistent with how
  `clock`/`brain`/`warning` are registered.
- **No threshold options at all (not even an unused stub).** Per
  coding-standards.md, no dead config surface "for later" - if
  proximity colouring is wanted later, `RateLimitResetOptions` gains
  fields in a follow-up change, following `RateLimitsOptions`'s shape
  as a starting point.
- **Missing-data placeholder is `⌛ -`,** matching `window.ts`'s `- `
  for "no context_window data" rather than `rate_limits.ts`'s longer
  "waiting for data" text - the reset-time segment is a compact single
  value display, not a multi-field one, so the short dash reads better
  next to a formatted time like `⌛ 13:06`.
- **Timestamp source is `rate_limits.<window>.resets_at` directly** (a
  `number`, Unix seconds) - no session/transcript file reads are
  needed (unlike `last_message_time`, which has no equivalent field on
  `ClaudeStatusInput` and must parse the transcript JSONL itself).

## Risks / Trade-offs

- [Users on non-subscription Claude Code (no `rate_limits` block at
  all)] → segment always shows `⌛ -`; documented in README next to
  the existing `rate_limits` "Claude.ai subscribers only" caveat so
  it's not surprising.
- [`resets_at` semantics assumed to be Unix seconds, matching the
  existing `rate_limits` segment's untouched handling and the README's
  worked example (`1738425600`)] → if Claude Code ever changes units,
  both segments break identically, so no additional drift risk is
  introduced by this change.
- [A user wants both 5h and 7d reset times shown] → achievable today
  by configuring two `rate_limit_reset` segment entries with different
  `window` values; not a blocker, just slightly more config than a
  hypothetical combined display.
