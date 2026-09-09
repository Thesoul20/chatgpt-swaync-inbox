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

- Uses a **hybrid completion detector**: same-origin ChatGPT conversation resource completion as the primary signal, with a conservative DOM state-machine fallback.
- Binds the notification preview to the assistant turn that follows the **latest user prompt**, preventing stale previous-answer previews.
- Suppresses success notifications after a recent manual Stop click or an obvious generation error.
- DOM fallback requires a real generation cycle, assistant activity, Stop-control disappearance, and a stabilization window.
- Includes a response preview in the notification.
- Clicking a completion notification **reactivates the originating ChatGPT tab instead of opening a new tab**.
- Each notification captures its conversation URL; if the originating tab later moves to another chat, clicking the notification restores the original conversation in that same tab.
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


### Notification click behavior

Completion notifications are **conversation-bound**. The userscript intentionally does not provide a `url` field to `GM_notification`, because browser userscript managers may interpret that as “open this URL” and create a new tab. Instead it requests `highlight: true` and handles the click locally.

When you click a completion notification:

1. Tampermonkey/Violentmonkey highlights the tab that emitted it;
2. the click handler prevents the default open-URL behavior;
3. if that tab is still on the captured conversation, it scrolls back toward the completed answer;
4. if the tab has since navigated to another ChatGPT conversation, the **same tab** is navigated back to the captured conversation URL.

This makes a persistent notification behave like an unread task result: clicking it returns you to the task context rather than creating another browser tab.

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

The test suite verifies that swaync config installation is idempotent, preserves unrelated settings, restores prior values on uninstall, validates the userscript statically, and exercises pure detector logic such as conversation-path recognition, prompt-bound turn selection, error tokens, and manual-stop guard windows.

## How this differs from existing ChatGPT notifiers

Several projects already solve answer-completion notification itself:

| Project | Primary focus | Completion detection | Persistent swaync inbox |
|---|---|---|---|
| [ramhaidar/ChatGPT-Response-Complete-Notifier](https://github.com/ramhaidar/ChatGPT-Response-Complete-Notifier) | Browser/userscript completion notifications + sound | Browser/network and prompt-bound watcher in its newer implementation | No documented swaync integration |
| [kkonstantin08/chatgpt-done-notifier](https://github.com/kkonstantin08/chatgpt-done-notifier) | Chrome MV3 extension, Windows-focused | Conservative DOM state machine | No |
| [scarecrowx913x/ChatGPT-Answer-Done-Notifier](https://github.com/scarecrowx913x/ChatGPT-Answer-Done-Notifier) | Userscript beep + desktop notification + favicon badge | ChatGPT UI state | No documented swaync persistence |
| **chatgpt-swaync-inbox** | Linux/Wayland task-inbox semantics | Hybrid resource-completion signal + prompt-bound resolver + DOM fallback | **Yes — core feature** |

Those projects are alternatives if you only need a transient browser/OS notification. This repository exists for users who want completed ChatGPT work to behave like an unread desktop task.

No source code from the projects above is included here. They are listed as related work and design references. See [Related work and design provenance](docs/related-work.md) for the reviewed ideas and licensing boundary.

## Design principles

1. **Local only** — no server and no ChatGPT API required.
2. **Fail quiet** — prefer missing a notification over spamming false completions.
3. **Minimal OS mutation** — one named swaync rule, backup first, reversible uninstall.
4. **Browser/desktop separation** — ChatGPT detection and swaync policy are independent layers.
5. **Inspectable** — the entire project is shell, Python standard library, and one userscript.

## Known limitations

- ChatGPT is a live web application. DOM selectors can change.
- A ChatGPT tab must remain open for a userscript to observe it.
- Manual Stop and visible error detection remain heuristic because ChatGPT does not expose a stable public browser completion API.
- The primary network detector observes undocumented same-origin ChatGPT conversation paths; if they change or resource timing is unavailable, the DOM fallback remains active.
- DOM selectors can still change as ChatGPT evolves.
- `timeout-critical=0` affects every critical swaync notification, not only ChatGPT.

See [Troubleshooting](docs/troubleshooting.md) for recovery steps.

## Security and privacy

The userscript is scoped only to `https://chatgpt.com/*`. It reads the rendered final assistant turn only to create a local notification preview. No conversation content is transmitted by this project.

See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).

## Status

Early public release. The initial path has been validated end-to-end on Arch Linux + Hyprland + Firefox + Tampermonkey + swaync. Contributions for other Wayland compositors, distros, browsers, and notification daemons are welcome.
