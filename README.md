# Claude Statusline Powerline

[![npm version](https://badge.fury.io/js/claude-statusline-powerline.svg)](https://badge.fury.io/js/claude-statusline-powerline)
[![npm downloads](https://img.shields.io/npm/dm/claude-statusline-powerline.svg)](https://www.npmjs.com/package/claude-statusline-powerline)
[![license](https://img.shields.io/npm/l/claude-statusline-powerline.svg)](https://github.com/spences10/claude-statusline-powerline/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

A beautiful powerline-style statusline for Claude Code with git
integration, session tracking, and settings config IntelliSense
support.

![demo of themes](/demo.png)

## ✨ Features

- 🎨 **Powerline styling** with beautiful separators and colors
- 🌿 **Enhanced git integration** - comprehensive status with
  superscript symbols
- 📁 **Directory display** - current working directory
- 📱 **Model info** - shows which Claude model you're using
- 💰 **Session cost** - real-time cost estimation for the session
- 🧠 **Context window monitoring** - real percentage of the model's
  context window used, with amber/red thresholds
- 🕐 **Last message time** - when the last API call was sent, so you
  can tell whether the prompt cache is still warm
- 🧠 **Context caching** - displays cache hit rate and warm/cold
  sessions
- ⚡ **Rate limits** - Claude.ai subscription usage (5h / 7d windows)
- 🪟 **Transparent (floating) segments** - segments can blend into the
  terminal background, with separators that adapt to it
- 🎯 **Settings IntelliSense** - autocomplete, validation, and hover
  docs in settings files

## 📊 Available Segments

| Segment              | Icon | Description                                              | Example Output                 |
| -------------------- | ---- | -------------------------------------------------------- | ------------------------------ |
| **Model**            | ⚡   | Shows the Claude model being used                        | `⚡ Claude Sonnet 4`           |
| **Directory**        | 📁   | Current working directory name                           | `📁 my-project`                |
| **Git**              | 🌿   | Git branch and status with superscript                   | `🌿 main ⁺3 ˜1 ᵘ2`             |
| **Window**           | 🧠   | Real % of the model's context window used                | `🧠 ~23%`                      |
| **Last Message Time**| 🕐   | Local time the last API call was sent (cache warm/cold)  | `🕐 21:01`                     |
| **Session**          | 💰   | Estimated cost of the current session                    | `💰 $0.42`                     |
| **Usage**            | 📊   | Aggregated usage statistics from database                | `📊 29.9k • $8.83 7d`          |
| **Context**          | 🧠   | Cache performance and session state                      | `🧠 10.5k cached (70% reused)` |
| **Session ID**       | ℹ    | Current session identifier                               | `ℹ abc123-def456`              |
| **Rate Limits**      | ⚠   | Claude.ai subscription rate limit usage                  | `⚠ 5h: 24% \| 7d: 41%`         |

All segments can be **shown/hidden** (via `lines` configuration),
**reordered**, and **customized** through the configuration file.

> **Window vs Context vs Session.** These three look similar but answer
> different questions. **Window** reads the latest assistant entry in the
> session transcript and shows the _current_ context window fill as a
> percentage of the active model's window (it turns amber, then red, as it
> approaches auto-compaction). **Context** shows prompt-cache efficiency
> (hit rate / warm vs cold). **Session** shows the _cumulative_ dollar cost
> of the session. Window % and Session cost are independent numbers — one is
> the current context size, the other is total spend.

## Themes & Configuration

### 🎨 Color Themes:

- **`dark`** - Default professional dark theme
- **`electric`** - High-contrast electric theme with vibrant colors
- **`night-owl`** - Dark theme inspired by Night Owl
- **`dracula`** - Popular Dracula theme colors
- **`gruvbox`** - Retro groove color scheme
- **`one-dark`** - Atom's One Dark theme
- **`monokai`** - Classic Monokai theme
- **`nord`** - Arctic, north-bluish theme
- **`tokyo-night`** - Modern dark theme
- **`solarized-light`** - Light theme based on Solarized
- **`gruvbox-light`** - Light variant of Gruvbox
- **`alucard`** - Dark red theme inspired by Hellsing

### ⚡ Available Separator Styles:

- `thick` - Standard powerline separator (``)
- `thin` - Thin powerline separator (``)
- `curvy` - Curved separator (``)
- `angly` - Angular separator (``)
- `angly2` - Alternative angular separator (``)
- `double_chevron` - Double arrow separator (``)
- `none` - No separator

Run `claude-statusline-powerline --list-separators` to preview the
glyphs in your own terminal and font.

## 🔧 Configuration

### JSON Configuration with IntelliSense

Claude Statusline Powerline uses JSON configuration files with
**IntelliSense support**:

**Primary config location:**
`~/.claude/claude-statusline-powerline.json`  
**Project-specific override:**
`./.claude/claude-statusline-powerline.json`

### ⚡ IntelliSense Features

- **🎯 Autocomplete** - All available options as you type
- **📖 Hover documentation** - Descriptions for every property
- **🎨 Color validation** - Hex color patterns with examples

### Example Configuration

```json
{
	"$schema": "https://raw.githubusercontent.com/spences10/claude-statusline-powerline/main/statusline.schema.json",
	"color_theme": "dark",
	"font_profile": "nerd-font",
	"terminal_background": "#1e1e1e",
	"segment_config": {
		"segments": [
			{
				"type": "window"
			},
			{
				"type": "last_message_time"
			},
			{
				"type": "model"
			},
			{
				"type": "directory"
			},
			{
				"type": "git"
			},
			{
				"type": "session"
			},
			{
				"type": "usage"
			},
			{
				"type": "context"
			},
			{
				"type": "session_id"
			},
			{
				"type": "rate_limits"
			}
		]
	}
}
```

`terminal_background` is optional — see
[Terminal background & transparent segments](#-terminal-background--transparent-segments).

### Configuration Options

**Color Themes:**

- `"dark"` - Classic blue/gray/yellow theme
- `"electric"` - Purple/cyan/red theme
- `"night-owl"` - Dark theme with blue/purple accents
- `"dracula"` - Purple/pink/green Dracula theme
- `"gruvbox"` - Warm retro colors
- `"one-dark"` - Blue/purple Atom theme
- `"monokai"` - Classic yellow/orange/green
- `"nord"` - Cool blue/teal arctic theme
- `"tokyo-night"` - Modern purple/blue theme
- `"solarized-light"` - Light theme with blue accents
- `"gruvbox-light"` - Light warm theme
- `"alucard"` - Dark red/crimson theme

**Font Profiles:**

- `"powerline"` - Basic powerline font support
- `"nerd-font"` - Full Nerd Font support with more icons

### Multi-line Layout & Segment Ordering

Control segment layout and ordering using the `lines` configuration:

```json
{
	"segment_config": {
		"lines": [
			{
				"directory": true,
				"git": true
			},
			{
				"model": true,
				"session": true
			},
			{
				"context": true
			}
		],
		"segments": [
			{ "type": "git" },
			{ "type": "model" },
			{ "type": "directory" },
			{ "type": "session" }
		]
	}
}
```

**Control rules:**

- **Visibility**: Only segments present in `lines` configuration are
  shown
- **Between lines**: Order determined by position in `lines` array
- **Within lines**: Order determined by property order in each line
  object
- **Styling**: Use `segments` array to configure colors, icons,
  separators, etc.

### Custom Icons

Customize the icons used in each segment with the `icons` property in
segment styles:

```json
{
	"segment_config": {
		"segments": [
			{
				"type": "model",
				"style": {
					"icons": {
						"ai": "🤖"
					}
				}
			},
			{
				"type": "directory",
				"style": {
					"icons": {
						"folder": "🗂️"
					}
				}
			},
			{
				"type": "git",
				"style": {
					"icons": {
						"branch": "🌿",
						"clean": "✅",
						"dirty": "⚠️"
					}
				}
			},
			{
				"type": "session",
				"style": {
					"icons": {
						"cost": "💲"
					}
				}
			}
		]
	}
}
```

**Available Icons:**

- `ai` - AI/Model segment icon
- `folder` - Directory/folder icon
- `branch` - Git branch icon
- `clean` - Clean git status icon
- `dirty` - Dirty git status icon (fallback)
- `ahead` - Commits ahead of remote
- `behind` - Commits behind remote
- `conflicts` - Merge conflicts
- `staged_add` - Staged additions/modifications
- `staged_del` - Staged deletions
- `unstaged` - Unstaged working directory changes
- `untracked` - Untracked files
- `cost` - Session cost/usage icon

You can use any Unicode character, emoji, or Nerd Font icon code
(e.g., `\uF07B` for folder).

### Custom Separators

Set the separator that follows a segment with the `separator` property in
its `style`. It accepts either a **bare style string** (shorthand) or an
**object** with `style` and/or `color`:

```json
{
	"segment_config": {
		"segments": [
			{
				"type": "model",
				"style": {
					"separator": "curvy"
				}
			},
			{
				"type": "usage",
				"style": {
					"separator": {
						"style": "curvy",
						"color": "#059669"
					}
				}
			}
		]
	}
}
```

- `separator: "curvy"` is shorthand for `separator: { "style": "curvy" }`.
- `color` (hex) overrides the separator glyph colour; by default it matches
  the segment's background so the powerline transition looks seamless.
- Valid styles are the ones listed under
  [Available Separator Styles](#-available-separator-styles).

### Single Line Layout

For simple single-line statuslines, just omit the `lines`
configuration:

```json
{
	"segment_config": {
		"segments": [
			{ "type": "model" },
			{ "type": "directory" },
			{ "type": "git" },
			{ "type": "session" }
		]
	}
}
```

Segments will appear in the order enabled segments are found.

## 🌿 Enhanced Git Status

The git segment displays comprehensive repository information using
beautiful superscript symbols optimized for Victor Mono font:

### Git Status Symbols

**Powerline Font Profile:**

- `⇡2` - 2 commits ahead of remote
- `⇣1` - 1 commit behind remote
- `⚠️` - Merge conflicts present
- `⁺3` - 3 staged additions/modifications
- `⁻1` - 1 staged deletion
- `˜2` - 2 unstaged changes in working directory
- `ᵘ4` - 4 untracked files

**Example outputs:**

- Clean repo: ` main ✓`
- Complex status: ` main ⇡2 ⁺3 ˜1 ᵘ2`
- With conflicts: ` main ⚠️ ⁺1`
- Behind remote: ` main ⇣3 ˜2`

### Truncation Control

Long segment content is automatically truncated. You can configure the
maximum length per segment:

```json
{
	"segment_config": {
		"segments": [
			{
				"type": "git",
				"style": {
					"truncation_length": 15
				}
			}
		]
	}
}
```

### Minimum Width

You can set a minimum width for any segment to ensure consistent sizing.
Content shorter than the minimum is right-padded with spaces:

```json
{
	"segment_config": {
		"segments": [
			{
				"type": "model",
				"style": {
					"minimum_width": 20
				}
			}
		]
	}
}
```

### Window Segment Options

The `window` segment shows how full the model's context window is. Tune it
with `window_options` on the segment:

```json
{
	"segment_config": {
		"segments": [
			{
				"type": "window",
				"window_options": {
					"show_percent": true,
					"show_tokens": false,
					"threshold_warn": 51,
					"threshold_danger": 80,
					"color_normal_fg": "terminal",
					"color_warn_bg": "#ea580c",
					"color_warn_fg": "auto",
					"color_danger_bg": "#dc2626",
					"color_danger_fg": "auto"
				}
			}
		]
	}
}
```

| Option             | Default     | Description                                                                          |
| ------------------ | ----------- | ------------------------------------------------------------------------------------ |
| `show_percent`     | `true`      | Show `~NN%` of the context window used                                               |
| `show_tokens`      | `false`     | Show consumed/total tokens, e.g. `120k / 200k` (rounds up; `M` units above 1M)       |
| `threshold_warn`   | `51`        | % at which the segment turns amber. Default is 60% of the 85% auto-compact point     |
| `threshold_danger` | `80`        | % at which the segment turns red                                                     |
| `color_normal_fg`  | `"terminal"`| Foreground below the warn threshold (transparent bg). `"terminal"` or a hex value    |
| `color_warn_bg`    | `"#ea580c"` | Background in the warn state                                                          |
| `color_warn_fg`    | `"auto"`    | Foreground in the warn state. `"auto"` derives a legible colour from the background  |
| `color_danger_bg`  | `"#dc2626"` | Background in the danger state                                                        |
| `color_danger_fg`  | `"auto"`    | Foreground in the danger state                                                       |

The context window size is looked up per model (including mid-session model
changes). Unknown models fall back to a conservative 200k window and the
percentage is shown with a `?`, e.g. `~23%?`.

### Last Message Time Options

The `last_message_time` segment shows the local time of the last assistant
API call, so you can tell whether the 5-minute prompt cache is still warm.
It is transparent while warm and turns red once the cache has likely expired.

```json
{
	"segment_config": {
		"segments": [
			{
				"type": "last_message_time",
				"last_message_time_options": {
					"cache_warn_minutes": 5,
					"color_warm_fg": "terminal",
					"color_cold_bg": "#dc2626",
					"color_cold_fg": "auto"
				}
			}
		]
	}
}
```

| Option               | Default     | Description                                                                |
| -------------------- | ----------- | -------------------------------------------------------------------------- |
| `cache_warn_minutes` | `5`         | Minutes since the last API call before the segment turns red (cache cold)  |
| `color_warm_fg`      | `"terminal"`| Foreground while warm (transparent bg). `"terminal"` or a hex value        |
| `color_cold_bg`      | `"#dc2626"` | Background once cold                                                        |
| `color_cold_fg`      | `"auto"`    | Foreground once cold. `"auto"` derives a legible colour from the background |

> The statusline re-renders on each prompt, not continuously — so the colour
> flips to cold the next time the line is drawn after the threshold elapses,
> not as a live countdown.

## 🪟 Terminal Background & Transparent Segments

Some segments (`window` and `last_message_time`) are **transparent** in
their normal state: their background is the terminal default, so they appear
to float on the terminal rather than sitting in a coloured powerline block.

A powerline separator glyph is filled with the colour of the segment on its
left. A transparent segment has no such colour — the terminal default
background cannot be used as a foreground fill — so by default a transparent
segment emits **no separator** and the next coloured segment simply begins
flat.

If you tell the statusline what your terminal background colour is, it can
instead draw a normal, correctly-pointing separator filled with that colour,
so floating segments connect to the bar seamlessly. Set it with
`terminal_background` (top-level, hex):

```json
{
	"terminal_background": "#fdf6e3"
}
```

### Detecting the terminal background

You can try to detect it automatically:

```bash
# Print the detected colour:
claude-statusline-powerline --detect-bg

# Detect and save it to your config as terminal_background:
claude-statusline-powerline --detect-bg --write
```

`--detect-bg` queries the terminal with an OSC 11 escape sequence. Important
caveats:

- **Run it directly in your terminal**, not via the statusline. During normal
  operation Claude Code owns the terminal and feeds the statusline JSON on
  stdin, so it cannot (and must not) query the terminal itself — doing so
  would corrupt the session and would run on every redraw.
- **Inside tmux/screen** the query is often swallowed; if detection times
  out, read the background colour from your terminal's settings and set
  `terminal_background` by hand.
- The value is **static** once set. If your terminal background changes (for
  example a day/night theme), re-run `--detect-bg --write` or update the hex
  manually.

If `terminal_background` is unset, everything still works — transparent
segments simply begin the coloured bar with a flat edge instead of a curve.

## 📦 Installation

Install globally with your preferred package manager:

```bash
# npm
npm install -g claude-statusline-powerline

# pnpm
pnpm add -g claude-statusline-powerline

# bun
bun add -g claude-statusline-powerline

# volta
volta install claude-statusline-powerline
```

The statusline will be automatically configured for Claude Code with a
default config file!

## Font Setup

This statusline is **built and tested specifically with Victor Mono**
for optimal powerline compatibility. While it should work with other
Nerd Fonts, the focus is on providing the best experience with
reliable powerline symbols rather than chasing extensive Nerd Font
icon support.

**Primary recommendation:**

- **Victor Mono** - The font this project is optimized for
- Any powerline-compatible font as a secondary option

**Note:** This project prioritizes rock-solid powerline separator
rendering over extensive icon support. Many Nerd Font separators don't
render consistently across different terminals and fonts, so we focus
on what actually works reliably.

## How It Works

Claude Code sends session information via stdin as JSON:

```json
{
	"session_id": "abc123-def456",
	"model": { "display_name": "Claude Sonnet 4" },
	"workspace": { "current_dir": "/path/to/project" },
	"rate_limits": {
		"five_hour": { "used_percentage": 23.5, "resets_at": 1738425600 },
		"seven_day": { "used_percentage": 41.2, "resets_at": 1738857600 }
	}
}
```

The statusline script processes this and outputs a coloured
powerline-style status.

## 🗃️ Local Usage Database

Claude Statusline Powerline maintains a local SQLite database at
`~/.claude/statusline-usage.db` to track usage analytics and power
both the **Session** and **Usage** segments with high-performance data
access.

**Stored Data:**

- **Session records** with start/end times and token usage
- **Daily summaries** with total costs and model usage
- **Project mapping** linking sessions to directory paths
- **Cache performance** metrics for optimization insights

**Performance Benefits:**

- **Session segment**: 31x faster than file parsing (0.11ms vs 3.44ms)
- **Usage segment**: Pre-aggregated daily/weekly/monthly summaries
- **Real-time insights** without impacting statusline responsiveness
- **Efficient SQLite queries** for instant data access

**These segments are database-only** and require the SQLite database
to function. They are not included in the default configuration but
can be enabled by adding them to your config:

```json
{
	"segment_config": {
		"segments": [{ "type": "session" }, { "type": "usage" }]
	}
}
```

The database automatically tracks usage data as you use Claude Code.
If the database is unavailable, these segments simply won't appear.

## Segments

1. **Model** - Shows the Claude model name
2. **Directory** - Shows current directory name
3. **Git** - Enhanced status with superscript symbols
4. **Window** - Real context-window usage for the active model
   - Reads the latest assistant entry in the session transcript
     (`input + cache_read + cache_creation` tokens) — the true current
     context size, not an estimate
   - Transparent below the warn threshold, amber, then red as it nears
     auto-compaction; thresholds and colours are configurable
   - Optionally shows token counts (`120k / 200k`) and reflects
     mid-session model changes; see
     [Window Segment Options](#window-segment-options)
5. **Last Message Time** - Local time the last API call was sent
   - Transparent while the prompt cache is warm; turns red once the
     cache window (default 5 min) has likely expired
   - See [Last Message Time Options](#last-message-time-options)
6. **Session** - Estimated cost of the current session
   - **Powered by SQLite database**
   - Format: `💰 ${cost}` (e.g. `💰 $0.42`), or `💰 nodata` when the
     session is not yet in the database
   - Must be manually enabled in configuration
7. **Usage** - Aggregated usage statistics across time periods
   - **Powered by SQLite database** with pre-calculated summaries
   - Format: `📊 {tokens}k • ${cost} {period}`
   - Shows daily/weekly/monthly aggregated data
   - Must be manually enabled in configuration
8. **Context** - Cache performance and session state
   - Shows cache hit rate and total cached tokens for warm sessions
   - Displays "Cold" for new sessions without significant cache usage
9. **Session ID** - Displays the current session identifier
   - Useful for distinguishing between multiple concurrent sessions
   - Supports truncation for long IDs (default max 20 chars)
10. **Rate Limits** - Shows Claude.ai subscription rate limit usage
    - Displays 5-hour and 7-day rolling window percentages
    - Only appears for Claude.ai subscribers (Pro/Max) after the first
      API response
    - Gracefully hides when rate limit data is not available

## Credits

This project was inspired by
[claude-powerline](https://github.com/Owloops/claude-powerline) by
[@Owloops](https://github.com/Owloops) - thanks for the initial
concept and inspiration!

Built for
[Claude Code](https://docs.anthropic.com/en/docs/claude-code) by
[Anthropic](https://www.anthropic.com/).

## License

MIT
