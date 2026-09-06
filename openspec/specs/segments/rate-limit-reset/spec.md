# rate-limit-reset Specification

## Purpose

Shows the local wall-clock time a Claude.ai rate-limit window (5-hour
or 7-day) resets, so a user can see when their usage headroom returns
without leaving the terminal.

## Requirements

### Requirement: Segment type and configuration

The system SHALL provide a `rate_limit_reset` segment type, selectable
in `segment_config.segments[].type` alongside the other segment types,
and not included in the default segment configuration.

The system SHALL accept a `rate_limit_reset_options.window` setting on
a `rate_limit_reset` segment, with allowed values `"five_hour"` and
`"seven_day"`, defaulting to `"five_hour"` when omitted.

#### Scenario: Segment configured with default window

- **WHEN** a `rate_limit_reset` segment is configured with no
  `rate_limit_reset_options`
- **THEN** the segment renders the 5-hour window's reset time

#### Scenario: Segment configured for the 7-day window

- **WHEN** a `rate_limit_reset` segment is configured with
  `rate_limit_reset_options.window` set to `"seven_day"`
- **THEN** the segment renders the 7-day window's reset time instead
  of the 5-hour window's

### Requirement: Reset time display

When the configured window's `resets_at` timestamp is present on the
input data, the system SHALL render the segment as an hourglass icon
followed by that timestamp formatted as local 24-hour `HH:MM`.

#### Scenario: Reset time available

- **WHEN** `rate_limits.five_hour.resets_at` is present on the
  statusline input and the segment is configured for the `five_hour`
  window
- **THEN** the segment displays the hourglass icon followed by that
  timestamp converted to the local timezone and formatted as `HH:MM`
  (24-hour, zero-padded)

### Requirement: Missing data placeholder

When the configured window's data is absent from the input (for
example, before the first API response of a session, or for accounts
without Claude.ai rate-limit reporting), the system SHALL render the
segment as the hourglass icon followed by a `-` placeholder rather
than omitting the segment, so its position in the statusline stays
stable.

#### Scenario: No rate-limit data yet

- **WHEN** `rate_limits` is absent from the statusline input, or the
  configured window's entry within it is absent
- **THEN** the segment displays the hourglass icon followed by `-`

### Requirement: Always-neutral styling

The system SHALL render the `rate_limit_reset` segment with a single,
consistent neutral appearance (transparent background by default, no
warn/danger colour states) regardless of how close the reset time is,
distinguishing it from segments like `rate_limits` and `window` that
change colour based on a threshold.

#### Scenario: Reset time imminent

- **WHEN** the configured window's `resets_at` timestamp is less than
  a minute away
- **THEN** the segment still renders with the same neutral styling as
  when the reset time is hours away
