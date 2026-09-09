# Troubleshooting

## No notification at all

Before debugging swaync or the completion detector, confirm the userscript is actually allowed to run on ChatGPT:

1. Open Tampermonkey/Violentmonkey while on `https://chatgpt.com`.
2. Confirm the browser/extension has permission to run userscripts on `https://chatgpt.com/*`.
3. Confirm **ChatGPT swaync Inbox** is enabled for the current site.
4. Reload already-open ChatGPT tabs after changing permissions or updating the userscript.

If this permission is missing, the userscript is never injected, `GM_notification` is never called, and swaync has nothing to display.

Then run:

```bash
./scripts/doctor.sh
```

Use the userscript manager menu on `chatgpt.com` and select **Send test notification**. If that menu item is missing, treat it as a strong sign that the userscript is not running on the page.

If the userscript test fails but `./scripts/test-notification.sh` works, re-check the userscript manager site permissions before investigating detector internals.

## Linux test appears but disappears

Check:

```bash
python3 tools/swaync_config.py check \
  --config "${XDG_CONFIG_HOME:-$HOME/.config}/swaync/config.json" \
  --state "${XDG_STATE_HOME:-$HOME/.local/state}/chatgpt-swaync-inbox/install-state.json"
```

Both the named rule and `timeout-critical=0` are required for persistence.

## swaync is running but AgentDock/SSH cannot send a notification

A non-graphical shell may not inherit the desktop session D-Bus variables. The desktop session normally has values similar to:

```text
XDG_RUNTIME_DIR=/run/user/1000
DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
WAYLAND_DISPLAY=wayland-1
```

Run notification tests from a terminal inside the desktop session. Do not hard-code another user's runtime directory.

## Notifications are suppressed

Check:

```bash
swaync-client -D
swaync-client -I
```

DND or notification inhibition can suppress visible popups even when the project is otherwise configured correctly.


## Clicking a notification opens a new ChatGPT tab

Update the userscript to **v0.2.1 or newer**. Older releases used `url: location.href`, which some userscript/browser combinations interpret as an instruction to open the URL in a new tab.

Current releases omit the `url` option entirely. Starting with v0.2.2 they also omit `highlight`, so notifications stay passive until clicked; starting with v0.2.3 `@grant window.focus` lets the explicit click activate the originating tab. If a click still opens a new tab, confirm the active userscript version from **Log detector status** and disable any older experimental ChatGPT notification scripts.

## Duplicate notifications

Confirm that only one copy of the userscript is enabled. Userscript managers may retain old database blobs internally after an update; what matters is whether two scripts are listed as enabled in the manager UI.

## Completion notification never fires

First use the userscript manager menu on ChatGPT and choose **Log detector status**. In the browser console, confirm `networkObserverInstalled` and inspect the latest prompt-bound snapshot.

The network completion path currently recognizes `/backend-api/f/conversation` and `/backend-api/conversation`. If ChatGPT changes these internal paths, the DOM fallback should still work.

If both paths fail, ChatGPT may have changed the DOM. Inspect the generation and composer controls. Verify that:

- the Stop control still exposes a `data-testid` containing `stop`, an accessible label such as `Stop generating` / `Stop streaming`, or an equivalent localized label;
- the Send control or composer still produces a recognizable Send/Enter/form-submit signal for the short-response path;
- user and assistant messages still expose `data-message-author-role="user"` and `data-message-author-role="assistant"`.

## Undo everything

Run:

```bash
./scripts/uninstall-swaync.sh
```

Then remove the userscript from Tampermonkey/Violentmonkey. The installer-created backup remains next to your swaync config for manual recovery.


## Notification steals focus as soon as it appears

Update the userscript to **v0.2.2 or newer**. v0.2.1 used `highlight: true`, and Tampermonkey may focus the sending tab/window immediately when the notification is shown. v0.2.2 removes `highlight`; focus/navigation happens only after an explicit notification click.


## Clicking a notification does not switch to the ChatGPT tab

Use **v0.2.3 or newer**. Firefox may ignore ordinary page-level `window.focus()` for a background tab. v0.2.3 adds `@grant window.focus`, which lets Tampermonkey route the click through its privileged tab-focus bridge. After updating the userscript, reload any already-open ChatGPT tabs so the new grant is injected.

## Very short answers do not notify

Update to **v0.2.4 or newer**. Earlier releases could miss a generation if the Stop control appeared and disappeared entirely between DOM polling ticks and the resource-completion signal was unavailable. v0.2.4 adds mutation-driven checks plus prompt-change arming correlated with recent Send/Enter/form-submit activity.
