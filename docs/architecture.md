# Architecture

## Boundary of responsibility

The project deliberately separates browser detection from Linux notification policy.

```text
Browser layer                          Desktop layer
─────────────                          ─────────────
ChatGPT DOM                            org.freedesktop.Notifications
  ↓                                             ↓
userscript state machine               swaync notification-visibility
  ↓                                             ↓
GM_notification                        override urgency → critical
  ↓                                             ↓
Firefox / Chromium                     timeout-critical = 0
                                                ↓
                                      persistent until dismissed
```

If ChatGPT changes its UI, only the browser layer should need adjustment. If a user changes compositor or notification styling, the ChatGPT detector should not care.

## Completion detector

The userscript uses a conservative three-part contract:

1. a Stop control must have been observed, proving that a generation cycle actually started;
2. the Stop control must disappear and remain absent through a stabilization window;
3. assistant output must differ from the baseline captured when generation began.

A click on a recognized Stop control records a recent manual-stop timestamp and suppresses a completion notification within the guard window.

The current polling interval is 500 ms and the stabilization window is 4.5 seconds. This intentionally adds latency in exchange for fewer false positives during tool activity, thinking transitions, and UI rerenders.

## Persistence and the critical timeout

`swaync` can match notifications by summary and override their urgency. It does not currently expose a per-rule expiration timeout in `notification-visibility`.

The integration therefore applies:

```json
{
  "notification-visibility": {
    "chatgpt-swaync-inbox": {
      "state": "enabled",
      "summary": "^ChatGPT Answer Complete$",
      "override-urgency": "critical"
    }
  },
  "timeout-critical": 0
}
```

This makes the ChatGPT completion notification persistent, but `timeout-critical` is global. Therefore any other application that emits a genuinely critical notification will also remain until dismissed.

The installer records the pre-install value and the uninstaller restores it.

## Why the userscript does not set a timeout

The production `GM_notification` intentionally omits its own timeout. The desktop notification daemon should own expiration policy. If the userscript set a finite timeout, the browser/userscript manager could close the notification even though swaync was configured to retain it.

## Failure modes

- **Stop selector changes:** no generation is recognized; fail quiet.
- **Assistant selector changes:** response-change check fails; fail quiet.
- **swaync rule missing:** browser notification still appears but follows normal swaync timeout.
- **critical timeout non-zero:** ChatGPT notification is promoted to critical but still expires according to swaync policy.
- **DND/inhibition:** OS policy wins and may suppress the popup.
