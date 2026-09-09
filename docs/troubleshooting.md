# Troubleshooting

## No notification at all

Run:

```bash
./scripts/doctor.sh
```

Then use the userscript manager menu on `chatgpt.com` and select **Send test notification**.

If the userscript test fails but `./scripts/test-notification.sh` works, inspect the userscript manager permissions and confirm the script is enabled for `https://chatgpt.com/*`.

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

## Duplicate notifications

Confirm that only one copy of the userscript is enabled. Userscript managers may retain old database blobs internally after an update; what matters is whether two scripts are listed as enabled in the manager UI.

## Completion notification never fires

ChatGPT may have changed the DOM. In browser developer tools, inspect the generation Stop button and verify one of these is still recognizable:

- a `data-testid` containing `stop`;
- an accessible label such as `Stop generating` or `Stop streaming`;
- an equivalent localized label.

Also check whether assistant messages still use `data-message-author-role="assistant"`.

## Undo everything

Run:

```bash
./scripts/uninstall-swaync.sh
```

Then remove the userscript from Tampermonkey/Violentmonkey. The installer-created backup remains next to your swaync config for manual recovery.
