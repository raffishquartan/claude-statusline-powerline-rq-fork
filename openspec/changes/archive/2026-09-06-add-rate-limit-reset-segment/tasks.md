## 1. Types and shared config surface

- [x] 1.1 Add `'rate_limit_reset'` to the `SegmentType` union in
      `src/types.ts` and verify `tsc` reports no new errors
- [x] 1.2 Add a `RateLimitResetOptions` interface to `src/types.ts`
      (JSDoc'd `window?: 'five_hour' | 'seven_day'`, default
      `'five_hour'`) and add
      `rate_limit_reset_options?: RateLimitResetOptions` to
      `SegmentConfig`
- [x] 1.3 Add a `rate_limit_reset?: SeparatorStyle` field to
      `SeparatorConfig` in `src/types.ts`, and a matching default
      entry in `DEFAULT_SEPARATORS` in `src/config.ts`
- [x] 1.4 Add an hourglass icon (`⌛`, U+231B) to
      `src/utils/symbols.ts` as `HOURGLASS_SYMBOL`, mapped under the
      key `hourglass` in `get_symbol`'s `symbol_map`

## 2. Segment implementation

- [x] 2.1 Create `src/segments/rate-limit-reset.ts` with a
      `RateLimitResetSegment extends BaseSegment`
      (`name = 'rate_limit_reset'`), following the structure of
      `src/segments/last-message-time.ts` (transparent-only
      `build_segment_data`, `resolve_options` reading
      `rate_limit_reset_options`) and `src/segments/rate-limits.ts`
      (reading `data.rate_limits`)
- [x] 2.2 Implement `build()`: resolve the configured window
      (`five_hour` default) from `data.rate_limits`, and if its
      `resets_at` is present render `⌛ HH:MM` (local time, 24-hour,
      zero-padded, via `new Date(resets_at * 1000)`), otherwise render
      `⌛ -`
- [x] 2.3 Register `RateLimitResetSegment` in `src/segments/index.ts`
      (export +
      `segmentRegistry.register(new RateLimitResetSegment())`), and
      verify it does NOT appear in `DEFAULT_SEGMENTS_CONFIG` (opt-in
      only, matching `rate_limits`/`session`/`usage`)
- [x] 2.4 Skipped adding a `themes/base.ts` theme colour: `window.ts`
      and `last-message-time.ts` — this segment's actual siblings,
      since all three are always-custom-built (never call
      `create_segment_with_fallback`) — never read
      `config.current_theme?.segments.*` either, so a
      `rate_limit_reset` entry would be dead code. Verified
      `pnpm run build` succeeds without one.

## 3. Tests

- [x] 3.1 Create `src/tests/unit/rate-limit-reset-segment.test.ts`
      mirroring `rate-limits-segment.test.ts` /
      `window-segment.test.ts`'s structure, and verify it passes:
      default window (`five_hour`) renders `HH:MM` from `resets_at`
- [x] 3.2 Add a test case for `window: 'seven_day'` rendering the
      7-day `resets_at` instead of the 5-hour one
- [x] 3.3 Add a test case for missing `rate_limits` data (and
      separately, missing just the configured window's entry)
      rendering `⌛ -`
- [x] 3.4 Add a test case asserting the segment's colours/separator
      are identical regardless of how close `resets_at` is to
      `Date.now()` (always-neutral, no threshold branching);
      registered the test in `src/tests/test-runner.ts` and verified
      `node dist/tests/test-runner.js` passes (16/16 suites, including
      this one)

## 4. Schema and docs

- [x] 4.1 Ran `pnpm run schema` to regenerate `statusline.schema.json`
      from the updated `src/types.ts`; diff confirmed additive-only
      (new type/option/separator fields, no unrelated drift)
- [x] 4.2 Added a "Rate Limit Reset Options" subsection to README.md
      (after "Rate Limits Options"), documenting
      `rate_limit_reset_options.window`, the default, the `⌛ -`
      no-data placeholder, and the "Claude.ai subscribers only"
      caveat, following the existing options-table format
- [x] 4.3 Added an 11th entry to the numbered "## Segments" list in
      README.md, and a `"type": "rate_limit_reset"` example to the
      "Example Configuration" JSON block alongside the existing
      `last_message_time`/`rate_limits` entries

## 5. Release bookkeeping

- [x] 5.1 Added `.changeset/rate-limit-reset-segment.md` by hand (the
      `pnpm changeset` wizard needs an interactive TTY, unavailable
      here) describing this as a `minor` addition to
      `claude-statusline-powerline`; verified with
      `pnpm changeset status` that it's recognised as a minor bump

## 6. Full verification

- [x] 6.1 Ran `pnpm run test` (build + comprehensive test runner —
      16/16 suites pass, including the pre-existing SQLite-backed
      session/usage suites) and `pnpm run format:check` (clean after a
      final `pnpm run format` pass); no pre-existing failures were
      left unresolved. Note: the SQLite-backed suite initially failed
      in this sandbox because `better-sqlite3`'s native binding wasn't
      built for this Node version — installed `pnpm`/`node-gyp` and
      ran `pnpm approve-builds --all` plus a manual `node-gyp rebuild`
      to fix it; unrelated to this change's code.
