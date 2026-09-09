# ChatGPT swaync Inbox

Turn finished ChatGPT web responses into **persistent Linux/Wayland notifications** that stay in `swaync` until you dismiss them.

This project is intentionally not another generic “ChatGPT finished” notifier. Its focus is the missing Linux desktop workflow:

```text
ChatGPT Web
   ↓
Tampermonkey / Violentmonkey userscript
   ↓
GM_notification → Firefox/Chromium
   ↓
org.freedesktop.Notifications
   ↓
swaync
   ↓
ChatGPT-only critical rule
   ↓
Persistent task inbox until you dismiss it
```

## Why this exists

Generic ChatGPT notification userscripts and browser extensions already exist. They are useful, but most stop at “show a desktop notification.” On a Wayland desktop, transient notifications can disappear before you return to the machine.

`chatgpt-swaync-inbox` treats a finished answer like an **unread task result**. The notification remains in the swaync notification center until you deliberately handle it.

## Features

- Detects a real ChatGPT generation cycle before considering completion.
- Waits for the Stop control to disappear and for a stabilization window before notifying.
- Verifies that assistant output changed, reducing false positives from UI rerenders.
- Suppresses “success” notifications after a recent manual Stop click.
- Includes a response preview in the notification.
- Clicking the userscript notification returns to the ChatGPT page.
- Adds only one named `swaync` visibility rule.
- Backs up `~/.config/swaync/config.json` before modifying it.
- Stores install state so uninstall can restore the previous critical timeout and previous same-name rule.
- Includes `doctor`, test-notification, uninstall, and automated config tests.
- No backend, API key, analytics, telemetry, or conversation upload.

## Requirements

- Linux desktop using Wayland or X11
- `swaync` (SwayNotificationCenter)
- `libnotify` / `notify-send` for diagnostics
- Firefox or a Chromium-family browser
- Tampermonkey or Violentmonkey
- Python 3

Tested initially on:

- Arch Linux
- Hyprland
- swaync 0.12.6
- Firefox 154
- Tampermonkey

Other swaync-based Wayland desktops should work, but are not yet part of the tested matrix.

## Install

### 1. Clone

```bash
git clone https://github.com/Thesoul20/chatgpt-swaync-inbox.git
cd chatgpt-swaync-inbox
```

### 2. Install the swaync integration

```bash
./scripts/install-swaync.sh
```

The installer:

1. backs up your existing swaync config;
2. adds a rule matching the exact summary `ChatGPT Answer Complete`;
3. upgrades only that matching notification to `critical` urgency;
4. sets `timeout-critical` to `0`, which tells swaync not to expire critical notifications;
5. records enough state to restore your pre-install values later.

> **Important:** `timeout-critical` is a global swaync setting. If it was not already `0`, installing this project makes *all* critical swaync notifications persistent. The installer prints a warning when it changes an existing non-zero value. See [Architecture](docs/architecture.md#persistence-and-the-critical-timeout) for the trade-off.

### 3. Install the userscript

Open:

```text
userscript/chatgpt-swaync-inbox.user.js
```

in Tampermonkey or Violentmonkey and install it, then reload `https://chatgpt.com`.

### 4. Verify the Linux notification path

```bash
./scripts/doctor.sh
./scripts/test-notification.sh
```

The test notification should remain in swaync until you dismiss it.

### 5. Verify the browser path

Open the userscript manager menu while on ChatGPT and run:

```text
Send test notification
```

That notification should also remain until dismissed.

## Usage

Use ChatGPT normally. When a response truly finishes, the userscript emits:

```text
ChatGPT Answer Complete
<preview of the final assistant answer>
```

`swaync` recognizes that exact title, promotes it to critical urgency, and keeps it until you close it.

## Uninstall

```bash
./scripts/uninstall-swaync.sh
```

This removes the project-owned swaync rule and restores the `timeout-critical` value recorded at installation time. Remove the userscript separately from your userscript manager.

## Diagnostics

```bash
make doctor
```

The doctor checks:

- required commands;
- whether swaync is running;
- whether a desktop D-Bus session is visible;
- whether the project rule is installed;
- whether `timeout-critical=0`;
- DND and inhibition state when queryable.

## Tests

```bash
make test
```

The test suite verifies that swaync config installation is idempotent, preserves unrelated settings, restores prior values on uninstall, and that the userscript passes JavaScript/static checks.

## How this differs from existing ChatGPT notifiers

Several projects already solve answer-completion notification itself:

| Project | Primary focus | Completion detection | Persistent swaync inbox |
|---|---|---|---|
| [ramhaidar/ChatGPT-Response-Complete-Notifier](https://github.com/ramhaidar/ChatGPT-Response-Complete-Notifier) | Browser/userscript completion notifications + sound | Browser/network and prompt-bound watcher in its newer implementation | No documented swaync integration |
| [kkonstantin08/chatgpt-done-notifier](https://github.com/kkonstantin08/chatgpt-done-notifier) | Chrome MV3 extension, Windows-focused | Conservative DOM state machine | No |
| [scarecrowx913x/ChatGPT-Answer-Done-Notifier](https://github.com/scarecrowx913x/ChatGPT-Answer-Done-Notifier) | Userscript beep + desktop notification + favicon badge | ChatGPT UI state | No documented swaync persistence |
| **chatgpt-swaync-inbox** | Linux/Wayland task-inbox semantics | Conservative userscript state machine | **Yes — core feature** |

Those projects are alternatives if you only need a transient browser/OS notification. This repository exists for users who want completed ChatGPT work to behave like an unread desktop task.

No source code from the projects above is included here. They are listed as related work and implementation references.

## Design principles

1. **Local only** — no server and no ChatGPT API required.
2. **Fail quiet** — prefer missing a notification over spamming false completions.
3. **Minimal OS mutation** — one named swaync rule, backup first, reversible uninstall.
4. **Browser/desktop separation** — ChatGPT detection and swaync policy are independent layers.
5. **Inspectable** — the entire project is shell, Python standard library, and one userscript.

## Known limitations

- ChatGPT is a live web application. DOM selectors can change.
- A ChatGPT tab must remain open for a userscript to observe it.
- Manual Stop detection is heuristic.
- `timeout-critical=0` affects every critical swaync notification, not only ChatGPT.
- The current detector is DOM/state based rather than tied to ChatGPT internal network endpoints; this avoids relying on undocumented request paths but can require selector maintenance.

See [Troubleshooting](docs/troubleshooting.md) for recovery steps.

## Security and privacy

The userscript is scoped only to `https://chatgpt.com/*`. It reads the rendered final assistant turn only to create a local notification preview. No conversation content is transmitted by this project.

See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).

## Status

Early public release. The initial path has been validated end-to-end on Arch Linux + Hyprland + Firefox + Tampermonkey + swaync. Contributions for other Wayland compositors, distros, browsers, and notification daemons are welcome.
