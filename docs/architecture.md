# Architecture

## Boundary of responsibility

The project deliberately separates browser completion detection from Linux notification policy.

```text
Browser layer                                   Desktop layer
─────────────                                   ─────────────
ChatGPT request + rendered turns                org.freedesktop.Notifications
        ↓                                                   ↓
hybrid completion detector                      swaync notification-visibility
        ↓                                                   ↓
prompt-bound final-answer resolver               override urgency → critical
        ↓                                                   ↓
GM_notification                                 timeout-critical = 0
                                                            ↓
                                                  persistent until dismissed
```

If ChatGPT changes its UI or request path, only the browser detector should need adjustment. If a user changes compositor or notification styling, the detector should not care.

## Completion detector: v0.2.0

The detector uses two independent paths and deduplicates their result.

### Primary: resource-completion signal

A `PerformanceObserver` watches same-origin resource timing entries for the currently known ChatGPT conversation endpoints:

```text
/backend-api/f/conversation
/backend-api/conversation
```

A completed matching resource is treated as a strong indication that the current response stream ended. It is **not sufficient by itself** to emit a notification. The detector then:

1. identifies the latest user prompt in rendered conversation order;
2. resolves only the first assistant turn following that prompt;
3. waits until that answer is non-empty and stable;
4. suppresses success if a recent manual Stop or obvious error is detected;
5. emits the persistent notification.

The response body is never intercepted and no network content is uploaded or modified. Resource timing is only used as a local completion signal.

### Fallback: conservative DOM state machine

The DOM fallback remains active even when the network observer installs successfully. It covers endpoint changes, browsers that do not expose the expected resource timing entry, and other missed network signals.

The fallback requires all of the following:

1. a recognized Stop control was observed, proving a generation cycle started;
2. assistant output bound to that prompt changed from its baseline;
3. no recent manual Stop click or obvious error is present;
4. the Stop control disappears;
5. output remains stable through the quiet/stability windows.

The two paths share the same prompt-bound notification key, so the same answer should not notify twice.

## Prompt-bound answer resolution

Using “the last assistant message on the page” can accidentally select the previous answer while a new prompt is still starting. v0.2.0 instead walks conversation turns in document order:

```text
user(prompt A)
assistant(answer A)
user(prompt B)        ← latest user prompt
assistant(answer B)   ← only valid preview for prompt B
```

If `answer B` does not exist yet, the resolver returns “pending”; it never falls back to `answer A`.

## Stop and error semantics

A click on a recognized Stop control records a guard timestamp. A request or DOM completion arriving inside that window is not considered a successful natural completion.

Obvious generation errors are also fail-quiet. The detector looks for recent error/alert UI and error text associated with the prompt-bound answer. This is deliberately conservative: missing a notification is preferable to reporting a failed response as successfully finished.

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


## Conversation-bound notification navigation

The completion detector binds not only the preview to the latest prompt/answer pair, but also the notification click to the **conversation URL that existed when the notification was emitted**.

The production `GM_notification` deliberately omits the `url` option. Supplying `url: location.href` can cause the userscript manager/browser to open a new tab when the notification is clicked. Instead the notification uses:

```text
highlight: true
        +
onclick(event)
        ↓
preventDefault()
        ↓
focus originating tab
        ↓
current URL == captured conversation URL?
    ├─ yes → scroll toward the completed answer
    └─ no  → navigate that same tab back to captured URL
```

This creates two separate bindings:

- **prompt-bound completion** answers “which assistant answer belongs to the latest prompt?”
- **conversation-bound navigation** answers “which browser context should this notification return the user to?”

If the original tab has been closed entirely, the userscript does not intentionally create a replacement tab; the no-new-tab behavior is preferred over silently spawning duplicate ChatGPT tabs.

## Failure modes

- **Known network endpoint changes:** resource signal is missed; DOM fallback remains active.
- **Resource Timing unavailable:** network observer fails quiet; DOM fallback remains active.
- **Stop selector changes:** network path can still complete; DOM fallback may stop recognizing cycles.
- **Turn/role selector changes:** prompt-bound resolution fails; detector fails quiet instead of using a stale answer.
- **swaync rule missing:** browser notification still appears but follows normal swaync timeout.
- **critical timeout non-zero:** ChatGPT notification is promoted to critical but still expires according to swaync policy.
- **DND/inhibition:** OS policy wins and may suppress the popup.

See [Related work](related-work.md) for design provenance and licensing boundaries.
